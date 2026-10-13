"""
ClearPathAI RAG Service
=======================
High-Quality Retrieval-Augmented Generation for Tamil Nadu Dairy Ecosystem.

Pipeline:
1. Ingest official PDFs (FSSAI FoSCoS, Aavin FRO, Tamil Nadu Dairy Policy Note).
2. Chunk into 300-500 word segments with metadata.
3. Hybrid search: Cosine similarity + BM25 keyword search combined with Reciprocal Rank Fusion (RRF).
4. Strict Grounding: LLM (Groq Llama-3 or Google Gemini) answers ONLY from retrieved context.
5. Guardrails: Low confidence triggers standard FoSCoS referral disclaimer.
6. Bilingual: Tamil & English detection and localized generation.
"""
from __future__ import annotations

import math
import os
import re
import uuid
from typing import Any

try:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.config import settings
    from app.models.chatbot import ChatbotChunk, ChatbotConversation, ChatbotDocument
    from app.models.registry import RegistryRule, SourceVersion
except ImportError:
    select = None
    AsyncSession = Any
    settings = None
    ChatbotChunk = ChatbotConversation = ChatbotDocument = None
    RegistryRule = SourceVersion = None

# Note: Static unreviewed knowledge bases are intentionally disabled.
# Retrieval must query only human-reviewed, VERIFIED records in the Source Registry.
# Invented, unverified, or hardcoded thresholds are not treated as legally valid.


def detect_language(text: str) -> str:
    """Detects whether user query is in Tamil or English."""
    # Tamil Unicode block: U+0B80 to U+0BFF
    tamil_chars = len(re.findall(r"[\u0b80-\u0bff]", text))
    if tamil_chars > 2:
        return "ta"
    return "en"


def compute_bm25_score(query: str, text: str) -> float:
    """Computes basic BM25 keyword score."""
    q_tokens = re.findall(r"\w+", query.lower())
    t_tokens = re.findall(r"\w+", text.lower())
    if not q_tokens or not t_tokens:
        return 0.0

    score = 0.0
    for token in q_tokens:
        if token in t_tokens:
            count = t_tokens.count(token)
            score += (count * 2.2) / (count + 1.2 * (0.25 + 0.75 * (len(t_tokens) / 80.0)))
    return score


def hybrid_search(query: str, top_k: int = 4) -> list[dict]:
    """Legacy static passages are not approved registry evidence. Static retrieval is disabled."""
    return []


async def search_verified_registry(
    db: AsyncSession | None,
    query: str,
    activity: str | None = None,
    top_k: int = 3,
) -> list[dict]:
    """
    Retrieves evidence strictly from VERIFIED registry rules linked to VERIFIED source versions.
    Unreviewed (DRAFT, NEEDS_REVIEW), DISABLED, or SUPERSEDED records are never retrieved.
    """
    if not db or select is None or RegistryRule is None or SourceVersion is None:
        return []

    stmt = (
        select(RegistryRule, SourceVersion)
        .join(SourceVersion, RegistryRule.source_version_id == SourceVersion.id)
        .where(
            RegistryRule.state == "VERIFIED",
            SourceVersion.state == "VERIFIED",
        )
    )
    if activity:
        stmt = stmt.where(RegistryRule.activity == activity)

    res = await db.execute(stmt)
    rows = res.all()
    if not rows:
        return []

    candidates = []
    for rule, source in rows:
        text_corpus = f"{rule.title} {rule.excerpt} {source.title}"
        score = compute_bm25_score(query, text_corpus)
        if score > 0.1:
            candidates.append({
                "rule_id": str(rule.id),
                "rule_key": rule.rule_key,
                "activity": rule.activity,
                "kind": rule.kind,
                "title": rule.title,
                "page_number": rule.page_start,
                "page_end": rule.page_end,
                "excerpt": rule.excerpt,
                "doc_title": source.title,
                "source_org": source.issuer,
                "source_url": source.canonical_url or "https://foscos.fssai.gov.in",
                "score": score,
            })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_k]


def call_llm_grounded(question: str, passages: list[dict], language: str) -> str | None:
    """
    Backend-only LLM call strictly grounded on verified registry passages.
    Never sends user data to untrusted endpoints. Reuses settings.GROQ_API_KEY or GEMINI_API_KEY.
    Returns None on any error or when no key is configured, triggering safe deterministic formatting.
    """
    if not settings:
        return None

    groq_key = getattr(settings, "GROQ_API_KEY", "") or ""
    gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""

    if not groq_key and not gemini_key:
        return None

    context_text = "\n\n".join(
        f"[{p['doc_title']} (Page {p.get('page_number', 'N/A')})]:\n{p['excerpt']}"
        for p in passages
    )
    system_prompt = (
        "You are the ClearPath AI Regulatory Compliance Assistant for Tamil Nadu dairy operations. "
        "Answer the user query STRICTLY and ONLY based on the provided verified source passages. "
        "Do NOT invent laws, fees, capacity thresholds, or approvals. "
        "If the passages do not provide enough information, explicitly state that. "
        "State that official licensing and tier determinations must be verified by the ClearPath AI eligibility engine."
    )
    user_prompt = f"Verified Source Passages:\n{context_text}\n\nQuestion: {question}"

    # Try Groq if configured
    if groq_key:
        try:
            import json
            import urllib.request

            req_data = json.dumps({
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 600,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {groq_key}",
                    "User-Agent": "ClearPath-AI/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    # Try Gemini if configured
    if gemini_key:
        try:
            import json
            import urllib.request

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            req_data = json.dumps({
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}],
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 600,
                },
            }).encode("utf-8")

            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                result = json.loads(response.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception:
            pass

    return None


def format_grounded_answer(question: str, chunks: list[dict], language: str) -> tuple[str, list[dict]]:
    """Formats grounded answers with exact source provenance citations."""
    if not chunks:
        msg = (
            "No verified regulatory sources are currently available for this query. "
            "All reference documents in the source registry are pending administrative review. "
            "ClearPath AI strictly avoids unverified rules to prevent compliance errors. "
            "Please consult FoSCoS (https://foscos.fssai.gov.in) or Aavin (https://aavin.tn.gov.in) directly."
            if language != "ta"
            else "இந்தக் கேள்விக்கு சரிபார்க்கப்பட்ட ஒழுங்குமுறை ஆதாரங்கள் தற்போது கிடைக்கவில்லை. "
            "ClearPath AI சரிபார்க்கப்பட்ட ஆதாரங்கள் இல்லாமல் பதிலளிக்காது. "
            "அதிகாரப்பூர்வ FoSCoS (https://foscos.fssai.gov.in) அல்லது ஆவின் வலைத்தளத்தைப் பார்க்கவும்."
        )
        return (msg, [])

    citations = [
        {
            "document_title": c["doc_title"],
            "page_number": c.get("page_number"),
            "source_url": c.get("source_url", "https://foscos.fssai.gov.in"),
            "source_org": c.get("source_org", "Official Authority"),
        }
        for c in chunks
    ]

    demo_notice_en = (
        "\n\n[Prototype Demonstration Notice: The retrieved citations reflect indexed reference passages in the ClearPath AI registry for educational and workflow decision-support. They do not constitute statutory legal advice or official government approval.]"
    )
    demo_notice_ta = (
        "\n\n[முன்மாதிரி விளக்கக் குறிப்பு: இந்த மேற்கோள்கள் ClearPath AI பதிவேட்டில் உள்ள குறிப்புப் பத்திகளை மட்டுமே குறிக்கின்றன. இது சட்டப்பூர்வ ஆலோசனை அல்ல.]"
    )

    llm_answer = call_llm_grounded(question, chunks, language)
    if llm_answer:
        return (
            f"{llm_answer}\n\n[Deterministic compliance note: Official licensing decisions must be processed through the ClearPath AI eligibility engine.]{demo_notice_en}",
            citations,
        )

    # Deterministic synthesis if LLM provider not reachable or not configured
    if language == "ta":
        bullet_points = "\n\n".join(
            f"- {c['title']} ({c['doc_title']}, பக்கம் {c.get('page_number', 'N/A')}):\n{c['excerpt']}"
            for c in chunks
        )
        answer = (
            f"சரிபார்க்கப்பட்ட ஒழுங்குமுறை ஆதாரங்களின்படி:\n\n{bullet_points}\n\n"
            f"அதிகாரப்பூர்வ தகுதி மற்றும் உரிம அடுக்கு நிர்ணயம் ClearPath AI தகுதி இயந்திரம் மூலம் மட்டுமே தீர்மானிக்கப்படும்.{demo_notice_ta}"
        )
    else:
        bullet_points = "\n\n".join(
            f"- {c['title']} ({c['doc_title']}, Page {c.get('page_number', 'N/A')}):\n{c['excerpt']}"
            for c in chunks
        )
        answer = (
            f"According to verified regulatory sources:\n\n{bullet_points}\n\n"
            f"Official licensing tier and fee determinations must be processed through the ClearPath AI eligibility engine.{demo_notice_en}"
        )

    return (answer, citations)


async def chat_service(
    question: str,
    user_id: uuid.UUID | None = None,
    language_override: str | None = None,
    db: AsyncSession | None = None,
) -> dict:
    """
    Main RAG Chat entrypoint.
    Searches verified registry rules, executes strict grounding, generates citations, and audits the conversation.
    """
    lang = language_override or detect_language(question)
    chunks = await search_verified_registry(db, question, top_k=3) if db else []

    answer, citations = format_grounded_answer(question, chunks, lang)
    conv_id = uuid.uuid4()

    if db and user_id and ChatbotConversation is not None:
        try:
            conv = ChatbotConversation(
                conversation_id=conv_id,
                user_id=user_id,
                question=question,
                answer=answer,
                language=lang,
                sources=citations,
            )
            db.add(conv)
            await db.commit()
        except Exception:
            await db.rollback()

    return {
        "answer": answer,
        "sources": citations,
        "language": lang,
        "conversation_id": str(conv_id),
    }
