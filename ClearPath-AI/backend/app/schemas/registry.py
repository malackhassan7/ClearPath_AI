import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, AwareDatetime

State = Literal["DRAFT", "NEEDS_REVIEW", "VERIFIED", "DISABLED", "SUPERSEDED"]
Activity = Literal["manufacturing", "retail", "distribution"]
Kind = Literal["eligibility", "checklist", "application_form"]


class SourceMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=300)
    issuer: str = Field(min_length=2, max_length=200)
    canonical_url: HttpUrl | None = None
    retrieved_at: AwareDatetime | None = None
    published_on: date | None = None
    effective_on: date | None = None
    provenance_note: str = Field(min_length=10, max_length=4000)
    conflict_note: str | None = Field(None, min_length=10, max_length=4000)


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    source_key: str
    version: int
    title: str
    issuer: str
    canonical_url: str | None
    filename: str
    sha256: str
    page_count: int
    received_at: datetime
    retrieved_at: datetime | None
    published_on: date | None
    effective_on: date | None
    provenance_note: str
    state: State
    conflict_note: str | None
    created_by: uuid.UUID | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    review_note: str | None


class RuleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    rule_key: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]{1,99}$")
    activity: Activity
    kind: Kind
    source_version_id: uuid.UUID
    title: str = Field(min_length=3, max_length=300)
    page_start: int = Field(ge=1)
    page_end: int = Field(ge=1)
    excerpt: str = Field(min_length=10, max_length=30000)
    conflict_note: str | None = Field(None, min_length=10, max_length=4000)


class RuleResponse(RuleCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    version: int
    state: State
    created_by: uuid.UUID | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    review_note: str | None


class ReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_state: State
    state: State
    reason: str = Field(min_length=10, max_length=4000)


class ConflictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    conflict_note: str | None = Field(None, min_length=10, max_length=4000)
    reason: str = Field(min_length=10, max_length=4000)


class SourcePageResponse(BaseModel):
    source_version_id: uuid.UUID
    sha256: str
    page: int
    text: str
