"""
Tests for DairySetu-TN RAG Chatbot Service.
Validates language detection, hybrid search, grounding, and bilingual answers.
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

from app.services.rag_service import (
    chat_service,
    detect_language,
    format_grounded_answer,
    hybrid_search,
    search_verified_registry,
)


def test_language_detection():
    # Tamil queries
    assert detect_language("தமிழ்நாட்டில் பால் கடை தொடங்க என்ன ஆவணங்கள் தேவை?") == "ta"
    assert detect_language("பால் விலை மற்றும் ஆவின் உரிமம்") == "ta"

    # English queries
    assert detect_language("What documents do I need to open a milk parlour in Tamil Nadu?") == "en"
    assert detect_language("FSSAI license fee for 20,000 litres per day") == "en"


def test_static_knowledge_is_not_approved_retrieval():
    assert hybrid_search("Coimbatore milk production", top_k=2) == []


@pytest.mark.asyncio
async def test_chat_does_not_emit_unreviewed_fees():
    res = await chat_service("What is the FSSAI fee for 20,000 litres/day?")
    assert res["language"] == "en"
    assert res["sources"] == []
    assert "3,000" not in res["answer"]
    assert "State License" not in res["answer"]
    assert "No verified regulatory sources are currently available" in res["answer"]


@pytest.mark.asyncio
async def test_chat_tamil_requires_reviewed_sources():
    res = await chat_service("தமிழ்நாட்டில் பால் கடை தொடங்க என்ன ஆவணங்கள் தேவை?")
    assert res["language"] == "ta"
    assert res["sources"] == []
    assert "அதிகாரப்பூர்வ ஆவணங்களில் இல்லை" in res["answer"] or "சரிபார்க்கப்பட்ட ஒழுங்குமுறை ஆதாரங்கள்" in res["answer"]


def test_grounded_formatting_emits_exact_citations():
    mock_chunks = [
        {
            "rule_id": "00000000-0000-0000-0000-000000000001",
            "rule_key": "fssai-eligibility-manufacturing",
            "activity": "manufacturing",
            "kind": "eligibility",
            "title": "Manufacturing eligibility evidence",
            "page_number": 1,
            "page_end": 1,
            "excerpt": "Dairy units handling up to 500 LPD require Registration.",
            "doc_title": "Kind of Business Eligibility",
            "source_org": "FSSAI",
            "source_url": "https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf",
            "score": 0.85,
        }
    ]
    answer, citations = format_grounded_answer("What is the registration limit?", mock_chunks, "en")
    assert len(citations) == 1
    assert citations[0]["document_title"] == "Kind of Business Eligibility"
    assert citations[0]["page_number"] == 1
    assert citations[0]["source_url"] == "https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf"
    assert "eligibility engine" in answer.lower()
    assert "500 LPD" in answer


@pytest.mark.asyncio
async def test_search_verified_registry_refuses_when_db_is_none():
    res = await search_verified_registry(None, "FSSAI registration")
    assert res == []
