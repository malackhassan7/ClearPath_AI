"""Detect an upload's real type from its first bytes (the browser-supplied Content-Type is not trusted)."""
from __future__ import annotations

_SIGNATURES: tuple[tuple[bytes, str], ...] = (
    (b"%PDF-", "application/pdf"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
)
_EXTENSIONS = {"application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg"}


def detect_mime(content: bytes) -> str | None:
    """Return the real MIME type for PDF/PNG/JPEG content, or None if it is anything else."""
    for magic, mime in _SIGNATURES:
        if content.startswith(magic):
            return mime
    return None


def extension_for(mime: str) -> str:
    return _EXTENSIONS.get(mime, ".bin")
