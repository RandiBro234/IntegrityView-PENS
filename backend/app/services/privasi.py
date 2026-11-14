"""Utilitas privasi email responden untuk backend legacy."""

import hashlib
import hmac
import os
from typing import Any

KOLOM_EMAIL = {
    "email",
    "email address",
    "alamat email",
    "email responden",
    "surel",
    "respondent email",
    "__respondent_email",
}


def kunci_email(kunci: str) -> bool:
    bersih = kunci.replace("\ufeff", "").strip().lower()
    return bersih in KOLOM_EMAIL or "email" in bersih


def sanitasi_data_jawaban(data: dict[str, Any]) -> dict[str, Any]:
    """Buang kunci email dari payload sebelum disimpan."""
    return {kunci: nilai for kunci, nilai in data.items() if not kunci_email(kunci)}


def hash_email(email: str) -> str:
    """Hash email dengan pepper server-side; email asli tidak disimpan."""
    pepper = os.environ.get("RESPONDENT_HASH_PEPPER")
    if not pepper:
        raise RuntimeError(
            "RESPONDENT_HASH_PEPPER belum diset. Tambahkan ke environment backend."
        )
    return hmac.new(
        pepper.encode("utf-8"),
        str(email).strip().lower().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
