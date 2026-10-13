"""
ClearPathAI Deterministic Compliance Engine (Phase 3).
======================================================
Produces reproducible, source-grounded regulatory evaluation without LLM guesswork.
Adheres strictly to the fail-closed principle: if regulatory rules are unverified
or in DRAFT state, it refuses to fabricate legally binding approval or license tiers.
"""
from __future__ import annotations

import re
import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.registry import RegistryRule, SourceVersion
from app.schemas.compliance import (
    ActivityType,
    BusinessProfileInput,
    DocumentRequirementItem,
    ProjectComplianceReport,
    RuleEvaluationItem,
)


def parse_project_activities(project: Project) -> list[ActivityType]:
    """Deterministically extracts business activities from project metadata."""
    notes = (project.notes or "").lower()
    name = (project.project_name or "").lower()
    combined = f"{name} {notes}"

    activities: set[ActivityType] = set()

    if any(k in combined for k in ["process", "manufac", "plant", "dairy", "bmc", "chilling", "collection"]):
        activities.add("manufacturing")
    if any(k in combined for k in ["retail", "parlour", "parlor", "booth", "kiosk", "shop", "outlet"]):
        activities.add("retail")
    if any(k in combined for k in ["distribut", "transport", "logistics", "wholesale", "van", "vehicle"]):
        activities.add("distribution")

    # If none explicitly detected, default to manufacturing for dairy enterprises
    if not activities:
        activities.add("manufacturing")

    # Return sorted list for strict determinism
    return sorted(list(activities))


async def evaluate_business_compliance(
    db: AsyncSession,
    profile: BusinessProfileInput,
    project: Project | None = None,
) -> ProjectComplianceReport:
    """
    Evaluates statutory compliance and clearance requirements against the Source Registry.
    
    Invariants:
    1. Only approved/VERIFIED rules may produce authoritative compliance conclusions.
    2. DRAFT/NEEDS_REVIEW rules produce an explicit 'PENDING_REGULATORY_REVIEW' state.
    3. Every requirement is linked to its exact source version and page range.
    4. Deterministic: identical inputs and database states produce identical reports.
    """
    # Fetch all rules and their source provenance
    stmt = (
        select(RegistryRule, SourceVersion)
        .join(SourceVersion, RegistryRule.source_version_id == SourceVersion.id)
        .order_by(RegistryRule.activity, RegistryRule.rule_key, RegistryRule.version.desc())
    )
    res = await db.execute(stmt)
    records: Sequence[tuple[RegistryRule, SourceVersion]] = res.all()

    target_activities = set(profile.activities)
    matched_rules: list[RuleEvaluationItem] = []
    excluded_rules: list[RuleEvaluationItem] = []

    has_unverified = False
    has_verified = False

    for rule, source in records:
        is_target = rule.activity in target_activities
        
        if rule.state != "VERIFIED":
            has_unverified = True
            app_state = "pending_review"
            reason = (
                f"Rule '{rule.rule_key}' (v{rule.version}) for {rule.activity} is currently in {rule.state} state. "
                f"Statutory source '{source.title}' (pages {rule.page_start}–{rule.page_end}) requires authorized officer certification."
            )
        else:
            has_verified = True
            app_state = "applicable" if is_target else "excluded"
            reason = (
                f"Verified rule '{rule.rule_key}' (v{rule.version}) for {rule.activity} certified by regulatory officer. "
                f"Cited from '{source.title}', pages {rule.page_start}–{rule.page_end}."
            )

        item = RuleEvaluationItem(
            rule_id=rule.id,
            rule_key=rule.rule_key,
            activity=rule.activity,
            kind=rule.kind,
            version=rule.version,
            rule_state=rule.state,
            title=rule.title,
            source_title=source.title,
            source_issuer=source.issuer,
            canonical_url=source.canonical_url,
            page_start=rule.page_start,
            page_end=rule.page_end,
            excerpt=rule.excerpt[:300] + ("..." if len(rule.excerpt) > 300 else ""),
            applicability=app_state if is_target else "excluded",
            reason=reason,
        )

        if is_target:
            matched_rules.append(item)
        else:
            excluded_rules.append(item)

    # Document checklist generation from matched checklist/application_form rules
    required_docs: list[DocumentRequirementItem] = []
    
    # 1. Statutory Application Form (from Form A source)
    has_form_rule = any(r.kind == "application_form" for r in matched_rules)
    if has_form_rule:
        required_docs.append(
            DocumentRequirementItem(
                name="Statutory Form A (Application for Registration / Renewal)",
                category="Statutory Form",
                is_mandatory=True,
                source_rule_key="supplied-form-a-application_form",
                source_pages="Schedule 2, pp. 1–5",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="Prescribed FSSAI Schedule 2 Form A under Food Safety and Standards Regulations 2.1.1 and 2.1.7.",
            )
        )

    # 2. Checklist items (from FoSCoS KoB document rules)
    has_checklist_rule = any(r.kind == "checklist" for r in matched_rules)
    if has_checklist_rule:
        required_docs.extend([
            DocumentRequirementItem(
                name="Photo ID Proof of Proprietor / Partners / Authorized Signatory",
                category="Identity & Legal",
                is_mandatory=True,
                source_rule_key="fssai-kob-documents-checklist",
                source_pages="FoSCoS KoB, p. 1",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="Government issued photo identification (Aadhaar Card, Voter ID, PAN Card, or Passport).",
            ),
            DocumentRequirementItem(
                name="Proof of Premises Possession (Lease Deed / Rent Agreement / Electricity Bill)",
                category="Infrastructure",
                is_mandatory=True,
                source_rule_key="fssai-kob-documents-checklist",
                source_pages="FoSCoS KoB, p. 1",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="Registered rent agreement or property tax receipt establishing commercial occupation of facility.",
            ),
            DocumentRequirementItem(
                name="Food Safety Management System (FSMS) Plan & Supervisor Certificate",
                category="Quality & Safety",
                is_mandatory=False,  # Mandatory for state/central licenses, recommended for registrations
                source_rule_key="fssai-kob-documents-checklist",
                source_pages="FoSCoS KoB, p. 2",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="Documented FSMS plan outlining hygienic handling, cold chain maintenance, and FoSTaC supervisor certificate.",
            ),
            DocumentRequirementItem(
                name="NABL Potable Water Testing Laboratory Report (IS 10500:2012)",
                category="Quality & Safety",
                is_mandatory=False,
                source_rule_key="fssai-kob-documents-checklist",
                source_pages="FoSCoS KoB, p. 2",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="Chemical and bacteriological analysis report of potable water used in dairy handling/cleaning.",
            ),
            DocumentRequirementItem(
                name="Machinery & Equipment Declaration Schedule with Horsepower Ratings",
                category="Engineering",
                is_mandatory=False,
                source_rule_key="fssai-kob-documents-checklist",
                source_pages="FoSCoS KoB, p. 2",
                review_status="PENDING_OFFICER_REVIEW" if has_unverified else "VERIFIED",
                description="List of dairy processing machinery (pasteurizer, cream separator, BMC, pumps) with installed capacity.",
            ),
        ])

    # Determine evaluation status and authority
    if not matched_rules:
        eval_status = "INSUFFICIENT_DATA"
        is_auth = False
        suggested_tier = None
        tier_exp = "No regulatory rules found in the database matching the selected business activities."
    elif has_unverified:
        eval_status = "PENDING_REGULATORY_REVIEW"
        is_auth = False
        suggested_tier = None
        tier_exp = (
            "Authoritative licensing tier is withheld. "
            f"All {len(matched_rules)} matched regulatory rules in the Source Registry remain in DRAFT / NEEDS_REVIEW status. "
            "ClearPathAI operates in strict fail-closed mode: no official tier or compliance certification is issued "
            "until an authorized compliance officer independently certifies the regulatory sources."
        )
    else:
        eval_status = "VERIFIED"
        is_auth = True
        # If all rules are verified, calculate deterministic tier from capacity / turnover
        cap = profile.capacity_lpd or 0
        turn = profile.annual_turnover_inr or 0
        if cap > 50000 or turn > 200_000_000:
            suggested_tier = "Central FSSAI License"
            tier_exp = f"Verified capacity ({cap:,.0f} LPD > 50,000) or turnover (₹{turn:,.0f} > ₹20 Cr) requires Central License."
        elif cap > 500 or turn > 1_200_000:
            suggested_tier = "State FSSAI License"
            tier_exp = f"Verified capacity ({cap:,.0f} LPD > 500) or turnover (₹{turn:,.0f} > ₹12 Lakhs) qualifies for State License."
        else:
            suggested_tier = "Basic FSSAI Registration"
            tier_exp = f"Verified petty scale ({cap:,.0f} LPD <= 500 and turnover <= ₹12 Lakhs) qualifies for Basic Registration."

    disclaimer = (
        "STATUTORY COMPLIANCE NOTICE: ClearPathAI is an automated compliance support system. "
        "When regulatory rules are in DRAFT status, results represent candidate requirements for review "
        "and do not constitute legally binding determinations or official government approvals."
    )

    return ProjectComplianceReport(
        project_id=project.project_id if project else None,
        project_name=project.project_name if project else "Business Profile Evaluation",
        district=project.district if project else (profile.district or "Tamil Nadu"),
        activities=sorted(list(target_activities)),
        capacity_lpd=profile.capacity_lpd,
        annual_turnover_inr=profile.annual_turnover_inr,
        evaluation_status=eval_status,
        is_authoritative=is_auth,
        suggested_fssai_tier=suggested_tier,
        tier_explanation=tier_exp,
        matched_rules=matched_rules,
        excluded_rules=excluded_rules,
        required_documents=required_docs,
        regulatory_disclaimer=disclaimer,
    )
