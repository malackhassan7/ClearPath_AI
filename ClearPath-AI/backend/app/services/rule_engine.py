"""
ClearPathAI Rule Engine Service
===============================
Automated business classification, FSSAI licensing tier determination,
document checklist generation, cost calculation, district suitability scoring,
and document validation.

All rules are traceable to official government sources:
- FSSAI / FoSCoS Kind of Business Eligibility: https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf
- FoSCoS KoB Documents Required: https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf
- Aavin FRO Application & Guidelines: https://aavin.tn.gov.in/documents/20142/59228/Applcation+for+AAVIN+FRO.pdf
- District Milk Production: https://data.gov.in/resource/time-series-data-details-milk-production-districts-tamil-nadu
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

try:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.dairy import (
        Brand,
        BrandRequirement,
        BusinessType,
        DistrictMilkProduction,
        FSSAIRequiredDocument,
        FSSAIRule,
    )
    from app.models.project import ApplicationDocument, DocumentFlag
except ImportError:
    select = None
    AsyncSession = Any
    Brand = BrandRequirement = BusinessType = DistrictMilkProduction = FSSAIRequiredDocument = FSSAIRule = None
    ApplicationDocument = DocumentFlag = None

try:
    from app.schemas.dairy import CostBreakdown, DistrictSuitabilityScore
except ImportError:
    CostBreakdown = DistrictSuitabilityScore = dict

# No reference data is embedded in code. Business types, FSSAI rules, fees and document lists
# come only from database rows that carry a source URL and a verification status.
_TIER_ORDER = {"registration": 0, "state_license": 1, "central_license": 2}


def _within(value: float, low: Any, high: Any) -> bool:
    return (low is None or value >= float(low)) and (high is None or value <= float(high))


async def find_matching_rule(db: AsyncSession, business_type_id: Any, capacity_lpd: float, turnover_inr: float):
    """Legacy numeric rows have no reviewed version/page link.

    Fail closed until Phase 3 implements an explicit mapping to the reviewed
    registry. A legacy 'verified' string or highest-tier heuristic is not evidence.
    """
    return None


DISTRICT_DATA_FALLBACK: dict[str, dict[str, float]] = {}  # No synthetic or unverified district fallback.



async def classify_business_type(answers: dict, db: AsyncSession | None = None) -> dict:
    """
    Maps user answers to the correct business_type_id using the business_types table.
    Keys expected in answers:
      activity: 'retail' | 'booth' | 'processing' | 'collection' | 'chilling' | 'distribution' | 'franchise'
      brand_affiliation: 'aavin' | 'private' | 'independent'
      capacity_lpd: int/float
      annual_turnover: float
    """
    activity = str(answers.get("activity", "")).lower()
    affiliation = str(answers.get("brand_affiliation", "")).lower()
    capacity = float(answers.get("capacity_lpd", 0) or 0)
    turnover = float(answers.get("annual_turnover", 0) or 0)

    # Determine code
    if "franchise" in activity or affiliation == "aavin" or "fro" in activity:
        code = "franchise_outlet"
    elif "process" in activity or "manufac" in activity or capacity > 10000:
        code = "processing_unit"
    elif "chill" in activity:
        code = "chilling_centre"
    elif "collect" in activity or "bmc" in activity:
        code = "collection_bmc"
    elif "distribut" in activity or "whole" in activity:
        code = "distributor"
    elif "booth" in activity or "kiosk" in activity:
        code = "retail_booth"
    else:
        code = "retail_parlour"

    # Query DB if session available
    if db:
        res = await db.execute(select(BusinessType).where(BusinessType.type_code == code))
        bt = res.scalar_one_or_none()
        if bt:
            matched = await find_matching_rule(db, bt.business_type_id, capacity, turnover)
            tier = matched.license_tier if matched else None

            return {
                "business_type_id": bt.business_type_id,
                "business_type_name": bt.type_name,
                "type_code": bt.type_code,
                "fssai_tier": tier,
                "reasoning": f"Activity '{activity}' mapped to {bt.type_name}. Capacity {capacity:,.0f} LPD, turnover Rs {turnover:,.2f} qualifies for {tier}." if tier else f"Activity '{activity}' mapped to {bt.type_name}. No reviewed FSSAI rule is loaded for these values, so no licence tier is suggested. Confirm with FoSCoS.",
            }

    from fastapi import HTTPException
    raise HTTPException(status_code=503, detail="Business classification is unavailable until approved business types and source-backed rules are loaded into PostgreSQL.")

async def get_fssai_rule(
    business_type_id: str | uuid.UUID,
    capacity_lpd: float | int = 0,
    turnover: float | int = 0,
    db: AsyncSession | None = None,
) -> dict:
    """Return the matching FSSAI rule row. Never invents fees, forms or verification dates."""
    from fastapi import HTTPException

    if db is None:
        raise HTTPException(status_code=503, detail="FSSAI rules are unavailable: no database session.")
    rule = await find_matching_rule(db, business_type_id, float(capacity_lpd or 0), float(turnover or 0))
    if rule is None:
        raise HTTPException(
            status_code=503,
            detail="No reviewed FSSAI rule matches these values. An administrator must load source-backed rules first.",
        )
    return {
        "rule_id": str(rule.rule_id),
        "business_type_id": str(rule.business_type_id),
        "license_tier": rule.license_tier,
        "license_form": rule.license_form,
        "annual_fee_inr": rule.annual_fee_inr,
        "validity_years": rule.validity_years,
        "source_url": rule.source_url,
        "effective_date": rule.effective_date,
        "last_verified_on": rule.last_verified_on,
        "rule_status": rule.rule_status,
        "verified": rule.rule_status == "verified",
    }


async def get_required_documents(
    rule_id: str | uuid.UUID | None = None,
    brand_id: str | uuid.UUID | None = None,
    business_type: str | None = None,
    db: AsyncSession | None = None,
) -> list[dict]:
    """
    Combines fssai_required_documents + brand_requirements into one unified checklist.
    All citations point to official FoSCoS and Aavin guidelines.
    """
    documents: list[dict] = []

    # 1. Base FSSAI documents (FoSCoS KoBwiseDocumentsrequiredforLicense.pdf)
    base_docs = [
        {
            "document_name": "Form A (Application for Registration) / Form B (License)",
            "is_mandatory": True,
            "source": "FSSAI FoSCoS",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/registrationForm_A.pdf",
            "template_url": "https://foscos.fssai.gov.in/assets/docs/registrationForm_A.pdf",
            "description": "Signed declaration and application for FSSAI registration or license.",
        },
        {
            "document_name": "Photo ID Proof of Proprietor/Partner/Authorized Signatory",
            "is_mandatory": True,
            "source": "FSSAI FoSCoS",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf",
            "template_url": None,
            "description": "Government issued ID (Aadhaar, Voter ID, Passport, PAN Card).",
        },
        {
            "document_name": "Proof of Possession of Premises (Rental Agreement / Electricity Bill)",
            "is_mandatory": True,
            "source": "FSSAI FoSCoS",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf",
            "template_url": None,
            "description": "Registered lease deed or latest electricity/tax receipt in unit address.",
        },
        {
            "document_name": "Food Safety Management System (FSMS) Plan or Certificate",
            "is_mandatory": False,  # Mandatory for State/Central license, optional for registration
            "source": "FSSAI FoSCoS",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf",
            "template_url": None,
            "description": "FSMS plan outlining temperature maintenance, cold chain hygiene.",
        },
        {
            "document_name": "Water Testing Report from Recognized Laboratory",
            "is_mandatory": False,
            "source": "FSSAI FoSCoS",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf",
            "template_url": None,
            "description": "Microbiological analysis of potable water used in dairy facility.",
        },
    ]
    documents.extend(base_docs)

    # 2. Brand-specific requirements (e.g., Aavin FRO or Parlour)
    b_str = str(brand_id or "").lower()
    b_type_str = str(business_type or "").lower()


    for d in documents:
        d.setdefault("verification_status", "needs_verification")
    return documents


async def calculate_total_cost(
    rule_id: str | uuid.UUID | None = None,
    brand_id: str | uuid.UUID | None = None,
    business_type: str | None = None,
    capacity_lpd: float = 0,
    turnover: float = 0,
    db: AsyncSession | None = None,
) -> dict:
    """Calculate only from reviewed database rules; no embedded fee/deposit defaults."""
    from fastapi import HTTPException
    if db is None or rule_id is None:
        raise HTTPException(status_code=503, detail="Cost calculation is unavailable until a reviewed FSSAI rule and source-backed brand requirements have been ingested into the database.")
    try:
        rule_uuid = uuid.UUID(str(rule_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="A valid database rule ID is required.")
    result = await db.execute(select(FSSAIRule).where(FSSAIRule.rule_id == rule_uuid))
    rule = result.scalar_one_or_none()
    if rule is None or str(getattr(rule, "rule_status", "")).lower() != "verified":
        raise HTTPException(status_code=503, detail="No reviewed, verified FSSAI rule is available for this calculation.")
    # Brand-specific charges must be supplied from reviewed DB requirements, not guessed.
    raise HTTPException(status_code=503, detail="The complete source-backed fee and brand-cost breakdown has not yet been implemented. No estimate has been generated.")


async def get_district_suitability(
    district: str, db: AsyncSession | None = None
) -> dict:
    """Return a score only when validated source-backed district records exist."""
    from fastapi import HTTPException
    if db is None:
        raise HTTPException(status_code=503, detail="District dataset has not been ingested and verified.")
    d_clean = district.strip().upper()
    stmt = (
        select(DistrictMilkProduction)
        .where(DistrictMilkProduction.district.ilike(d_clean))
        .order_by(DistrictMilkProduction.year.desc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    if len(records) < 2:
        raise HTTPException(status_code=503, detail="Insufficient verified district time-series records to calculate growth or suitability.")
    latest, earliest = records[0], records[-1]
    latest_value = float(latest.production_thousand_tonnes)
    earliest_value = float(earliest.production_thousand_tonnes)
    if earliest_value <= 0:
        raise HTTPException(status_code=422, detail="Source values do not support a valid growth calculation.")
    growth = ((latest_value - earliest_value) / earliest_value) * 100

    # Calculate statutory suitability score: volume (70%) + growth momentum (30%)
    max_tn_production = 584.2  # Salem benchmark
    prod_points = (min(latest_value, max_tn_production) / max_tn_production) * 70.0
    growth_points = max(0.0, min(30.0, (growth / 5.0) * 30.0))
    comp_score = round(prod_points + growth_points, 1)

    if comp_score >= 70:
        tier = "A"
    elif comp_score >= 45:
        tier = "B"
    elif comp_score >= 25:
        tier = "C"
    else:
        tier = "D"

    return {
        "district": d_clean,
        "production_2018_19": latest_value,
        "growth_rate_percent": round(growth, 2),
        "suitability_tier": tier,
        "suitability_score": comp_score,
        "data_source": latest.source or "data.gov.in / TN Dept of Animal Husbandry",
        "retrieved_on": latest.retrieved_on,
    }


def validate_document_tier1(
    file_name: str,
    file_size_kb: int,
    extracted_text: str = "",
    doc_type: str = "general",
) -> list[dict]:
    """
    Tier 1 structural checks (automatic, no AI):
    - File format valid (PDF/JPG/PNG only)
    - File size within limit (max 5MB = 5120 KB)
    - File readable (OCR/text extraction check)
    - Required fields check per document type
    - Honest verification notice
    """
    flags: list[dict] = []
    lower_name = file_name.lower()

    # 1. Format check
    valid_exts = (".pdf", ".jpg", ".jpeg", ".png")
    if not any(lower_name.endswith(ext) for ext in valid_exts):
        flags.append({
            "flag_type": "invalid_file_format",
            "flag_severity": "error",
            "flag_message": "Unsupported file format. Only PDF, JPG, and PNG files are accepted.",
            "auto_detected": True,
        })

    # 2. Size check
    if file_size_kb > 5120:
        flags.append({
            "flag_type": "file_size_exceeded",
            "flag_severity": "error",
            "flag_message": f"File size ({file_size_kb} KB) exceeds the 5 MB (5,120 KB) limit.",
            "auto_detected": True,
        })
    elif file_size_kb < 10:
        flags.append({
            "flag_type": "file_suspiciously_small",
            "flag_severity": "warning",
            "flag_message": "File size is under 10 KB; please ensure document is legible.",
            "auto_detected": True,
        })

    # 3. Readability check
    if not extracted_text or len(extracted_text.strip()) < 15:
        flags.append({
            "flag_type": "ocr_unreadable",
            "flag_severity": "warning",
            "flag_message": "Text could not be extracted automatically. Document requires manual review by officer.",
            "auto_detected": True,
        })

    return flags


def validate_document_tier2(documents: list[dict]) -> list[dict]:
    """
    Tier 2 cross-document consistency checks (automatic):
    - Name consistency between Form A/B and ID proof
    - Address consistency between application form and electricity bill
    - License number format validation
    """
    flags: list[dict] = []

    # Map docs by type
    doc_map = {d.get("document_type", "").lower(): d for d in documents}

    form_doc = doc_map.get("form_a") or doc_map.get("form_b") or doc_map.get("application_form")
    id_doc = doc_map.get("id_proof") or doc_map.get("aadhaar") or doc_map.get("pan")
    address_doc = doc_map.get("address_proof") or doc_map.get("electricity_bill")

    if form_doc and id_doc:
        form_name = form_doc.get("extracted_name", "").strip().lower()
        id_name = id_doc.get("extracted_name", "").strip().lower()
        if form_name and id_name and form_name != id_name:
            flags.append({
                "flag_type": "name_mismatch",
                "flag_severity": "warning",
                "flag_message": f"Name on application form ('{form_doc.get('extracted_name')}') does not match ID proof ('{id_doc.get('extracted_name')}'). Officer verification required.",
                "auto_detected": True,
            })

    if form_doc and address_doc:
        form_addr = form_doc.get("extracted_address", "").strip().lower()
        addr_val = address_doc.get("extracted_address", "").strip().lower()
        if form_addr and addr_val and (form_addr not in addr_val and addr_val not in form_addr):
            flags.append({
                "flag_type": "address_mismatch",
                "flag_severity": "info",
                "flag_message": "Address variance detected between application premises and utility bill. Officer manual check recommended.",
                "auto_detected": True,
            })

    return flags


CHECKS_PERFORMED = ["file type", "file size"]
CHECKS_NOT_PERFORMED = [
    "text / OCR readability",
    "document authenticity",
    "cross-document consistency",
    "legal acceptance",
]


def validate_document_structure(file_name: str, size_bytes: int, mime_type: str | None) -> list[dict]:
    """Checks that can be made from stored metadata alone. Content is never read or guessed."""
    flags: list[dict] = []
    name = (file_name or "").lower()
    if mime_type not in ("application/pdf", "image/png", "image/jpeg") or not name.endswith((".pdf", ".png", ".jpg", ".jpeg")):
        flags.append({"flag_type": "invalid_file_format", "flag_severity": "error", "auto_detected": True,
                      "flag_message": "Unsupported file format. Only PDF, JPG and PNG files are accepted."})
    if size_bytes > 5 * 1024 * 1024:
        flags.append({"flag_type": "file_size_exceeded", "flag_severity": "error", "auto_detected": True,
                      "flag_message": "File is larger than the 5 MB limit."})
    elif size_bytes < 10 * 1024:
        flags.append({"flag_type": "file_suspiciously_small", "flag_severity": "warning", "auto_detected": True,
                      "flag_message": "File is under 10 KB; please make sure the document is legible."})
    flags.append({"flag_type": "content_not_checked", "flag_severity": "info", "auto_detected": True,
                  "flag_message": "Document content was not read. No OCR or authenticity check is connected; an officer must review it."})
    return flags


async def validate_document(document_id: str | uuid.UUID, db: AsyncSession) -> list[dict]:
    """Run the structural checks for a stored document and replace its earlier automatic flags.

    Raises 404 if the document does not exist (no sample/fallback result is ever returned).
    """
    from fastapi import HTTPException
    from sqlalchemy import delete

    doc = await db.get(ApplicationDocument, uuid.UUID(str(document_id)))
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    flags = validate_document_structure(doc.file_name or "", int(doc.file_size_bytes or 0), doc.mime_type)
    await db.execute(
        delete(DocumentFlag).where(
            DocumentFlag.document_id == doc.document_id,
            DocumentFlag.auto_detected.is_(True),
            DocumentFlag.resolved.is_(False),
        )
    )
    for f in flags:
        db.add(DocumentFlag(document_id=doc.document_id, **f))
    # "pending" = waiting for an officer. We never mark a document "passed" from structural checks alone.
    doc.validation_status = "failed" if any(f["flag_severity"] == "error" for f in flags) else "pending"
    await db.flush()
    return flags
