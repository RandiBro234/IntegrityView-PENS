"""Logika bisnis survei: validasi payload dan orkestrasi repository."""

from __future__ import annotations

from typing import Any, Optional

from ..repositories import survey_repository
from .email import ambil_email
from .privasi import hash_email, sanitasi_data_jawaban


class PayloadKosong(ValueError):
    """Payload webhook tidak berisi jawaban."""


def simpan_webhook(instrumen: str, data: dict[str, Any]) -> dict[str, str]:
    if not isinstance(data, dict) or not data:
        raise PayloadKosong("Data jawaban kosong. Cek trigger Google Form.")

    email = ambil_email(data)
    responden_hash = hash_email(email) if email else None
    survey_repository.simpan_jawaban(
        instrumen, responden_hash, sanitasi_data_jawaban(data)
    )
    return {
        "status": "success",
        "message": f"Data {instrumen} tersimpan.",
    }


def daftar_survei(
    instrumen: Optional[str] = None, limit: Optional[int] = None
) -> list[dict[str, Any]]:
    return survey_repository.daftar_survei(instrumen, limit)


def ringkasan_instrumen() -> list[dict[str, Any]]:
    return survey_repository.ringkasan_per_instrumen()
