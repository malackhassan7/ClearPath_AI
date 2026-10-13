"""
Chatbot Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatSource(BaseModel):
    document_title: str
    page_number: int | None = None
    source_url: str | None = None


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    language: Literal["en", "ta"] = "en"
    conversation_id: uuid.UUID | None = None  # for follow-up questions


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    language: str
    conversation_id: uuid.UUID


class ConversationResponse(BaseModel):
    model_config = {"from_attributes": True}

    conversation_id: uuid.UUID
    question: str
    answer: str
    sources: list | None
    language: str
    created_at: datetime
