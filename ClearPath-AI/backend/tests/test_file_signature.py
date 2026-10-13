"""Unit tests for upload content detection (no database needed)."""
from app.services.file_signature import detect_mime, extension_for


def test_detects_real_types():
    assert detect_mime(b"%PDF-1.7 ...") == "application/pdf"
    assert detect_mime(b"\x89PNG\r\n\x1a\nxxxx") == "image/png"
    assert detect_mime(b"\xff\xd8\xff\xe0xxxx") == "image/jpeg"


def test_rejects_disguised_files():
    assert detect_mime(b"MZ\x90\x00 executable pretending to be a pdf") is None
    assert detect_mime(b"<html><script>alert(1)</script>") is None
    assert detect_mime(b"") is None


def test_extension_is_server_chosen():
    assert extension_for("application/pdf") == ".pdf"
    assert extension_for("text/html") == ".bin"
