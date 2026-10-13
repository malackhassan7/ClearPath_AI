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
    hybrid_search,
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


@pytest.mark.asyncio
async def test_chat_tamil_requires_reviewed_sources():
    res = await chat_service("தமிழ்நாட்டில் பால் கடை தொடங்க என்ன ஆவணங்கள் தேவை?")
    assert res["language"] == "ta"
    assert res["sources"] == []
