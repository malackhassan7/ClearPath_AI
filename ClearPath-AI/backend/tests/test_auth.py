"""
Tests for ClearPathAI Authentication & JWT Token Handling.
"""
from datetime import timedelta
try:
    import pytest
except ImportError:
    pass
from app.api.v1.auth import (
    _hash_password,
    _verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing():
    raw_pass = "DairyFarmer@2026!"
    hashed = _hash_password(raw_pass)
    assert hashed != raw_pass
    assert _verify_password(raw_pass, hashed) is True
    assert _verify_password("WrongPassword123", hashed) is False


def test_jwt_access_token_creation_and_decode():
    user_id = "u1000000-0000-0000-0000-000000000001"
    role = "entrepreneur"
    token = create_access_token(user_id=user_id, role=role)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["type"] == "access"


def test_jwt_refresh_token():
    user_id = "u2000000-0000-0000-0000-000000000002"
    token = create_refresh_token(user_id=user_id)
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"
