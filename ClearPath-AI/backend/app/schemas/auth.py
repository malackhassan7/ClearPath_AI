"""
Auth Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str  # fallback if email-validator package is not installed


# Roles a person may choose for themselves. officer/admin are granted only by an administrator.
SELF_SERVICE_ROLES = ("user", "farmer", "entrepreneur", "consultant")
VALID_ROLES = SELF_SERVICE_ROLES + ("officer", "admin")
VALID_LANGUAGES = ("en", "ta", "hi")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(None, max_length=15, pattern=r"^\+?[0-9]{7,15}$")
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["user", "farmer", "entrepreneur", "consultant"] = "user"
    preferred_language: str = Field("en", max_length=10)

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in VALID_LANGUAGES:
            return "en"
        return v


class LoginRequest(BaseModel):
    email: str | None = None
    identifier: str | None = None
    password: str = Field(..., min_length=1)

    @field_validator("email", "identifier", mode="before")
    @classmethod
    def normalise_login_identifier(cls, v: str | None) -> str | None:
        return v.strip().lower() if isinstance(v, str) else v


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None
    role: str
    preferred_language: str
    is_active: bool
    email_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
