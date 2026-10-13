"""
Tests for ClearPathAI Rule Engine.
Validates FSSAI classification, statutory rules, fee computation, and district scoring.
"""
try:
    import pytest
except ImportError:
    class MockPytest:
        class mark:
            @staticmethod
            def asyncio(fn):
                return fn
    pytest = MockPytest()

from app.services.rule_engine import (
    classify_business_type,
    get_fssai_rule,
    get_required_documents,
    calculate_total_cost,
    get_district_suitability,
    validate_document_tier1,
    validate_document_tier2,
)


# These calculators used to return hard-coded fees, deposits and district figures. They now read only
# reviewed database rows, so without data they must refuse (503) instead of inventing an answer.
# Matching logic against real rows is covered in tests/test_security_fixes.py.

@pytest.mark.asyncio
async def test_classify_refuses_without_business_types():
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as e:
        await classify_business_type({"activity": "retail", "capacity_lpd": 300, "annual_turnover": 800000})
    assert e.value.status_code == 503


@pytest.mark.asyncio
async def test_fssai_rule_refuses_without_database_rows():
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as e:
        await get_fssai_rule(business_type_id="retail_parlour", capacity_lpd=400, turnover=500000)
    assert e.value.status_code == 503


@pytest.mark.asyncio
async def test_cost_estimate_refuses_without_a_reviewed_rule():
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as e:
        await calculate_total_cost(rule_id="r1", brand_id="aavin", business_type="retail_parlour",
                                   capacity_lpd=300, turnover=500000)
    assert e.value.status_code == 503


@pytest.mark.asyncio
async def test_district_suitability_refuses_without_ingested_data():
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as e:
        await get_district_suitability("COIMBATORE")
    assert e.value.status_code == 503


@pytest.mark.asyncio
async def test_checklist_items_are_marked_unverified():
    docs = await get_required_documents()
    assert docs and all(d["verification_status"] == "needs_verification" for d in docs)


def test_validate_document_tier1_format():
    # Invalid extension (.exe or .txt)
    flags = validate_document_tier1(
        file_name="malicious_payload.exe",
        file_size_kb=50,
        extracted_text="some text content",
    )
    assert any(f["flag_type"] == "invalid_file_format" for f in flags)

    # Valid PDF
    valid_flags = validate_document_tier1(
        file_name="form_a_signed.pdf",
        file_size_kb=250,
        extracted_text="FSSAI Form A Tamil Nadu Murugan 400 LPD",
    )
    assert not any(f["flag_type"] == "invalid_file_format" for f in valid_flags)


def test_validate_document_tier2_consistency():
    docs = [
        {"document_type": "form_a", "extracted_name": "Murugan Krishnan", "extracted_address": "Namakkal Main Road"},
        {"document_type": "id_proof", "extracted_name": "Ramasamy Krishnan", "extracted_address": "Namakkal Main Road"},
    ]
    flags = validate_document_tier2(docs)
    assert any(f["flag_type"] == "name_mismatch" for f in flags)
