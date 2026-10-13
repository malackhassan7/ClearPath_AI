"""
Chatbot API router for DairySetu-TN.
Provides high-quality, grounded RAG Q&A in English and Tamil with source citations and SSE streaming.
"""
from __future__ import annotations

import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user_optional
from app.database import get_db
from app.models.chatbot import ChatbotConversation
from app.models.user import User
from app.schemas.admin import ConversationResponse
from app.services.rag_service import chat_service, detect_language, format_grounded_answer, hybrid_search

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)
    language: str | None = Field(None, description="'en' or 'ta'")


@router.post("/chat", summary="Query the dairy compliance RAG chatbot")
async def chat_endpoint(
    payload: ChatRequest,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns an answer grounded strictly in official government reference documents,
    along with source citations (document title, page number, and source URL).
    """
    user_id = current_user.user_id if current_user else None
    return await chat_service(
        question=payload.question,
        user_id=user_id,
        language_override=payload.language,
        db=db,
    )


@router.get("/chat/stream", summary="SSE Streaming response for chatbot")
async def stream_chat(
    q: str = Query(..., min_length=2, max_length=500),
    lang: str | None = Query(None),
):
    """
    Streams the AI response token-by-token via Server-Sent Events (SSE).
    """
    language = lang or detect_language(q)
    chunks = hybrid_search(q, top_k=3)
    answer, citations = format_grounded_answer(q, chunks, language)

    async def event_generator():
        words = answer.split(" ")
        for i, word in enumerate(words):
            chunk_data = json.dumps({"token": word + " ", "done": False})
            yield f"data: {chunk_data}\n\n"
            await asyncio.sleep(0.02)

        final_data = json.dumps({
            "done": True,
            "sources": citations,
            "language": language,
        })
        yield f"data: {final_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", summary="Get previous chatbot conversations for current user", response_model=list[ConversationResponse])
async def get_conversations(
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        return []

    stmt = (
        select(ChatbotConversation)
        .where(ChatbotConversation.user_id == current_user.user_id)
        .order_by(desc(ChatbotConversation.created_at))
        .limit(20)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    return records
