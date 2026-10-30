"""Ekstraksi email responden dari payload Google Forms."""

from typing import Any, Optional

PRIORITAS_KOLOM_EMAIL = (
    "email address",
    "email",
    "alamat email",
    "email responden",
    "surel",
    "respondent email",
    "__respondent_email",
)


def pertama(nilai: Any) -> Optional[str]:
    """Google Forms mengirim jawaban sebagai list."""
    if isinstance(nilai, list):
        if not nilai or nilai[0] is None:
            return None
        return str(nilai[0])
    if nilai is None:
        return None
    return str(nilai)


def ambil_email(jawaban: dict[str, Any]) -> Optional[str]:
    """Cari email dari nama kolom umum, lalu fallback ke kolom berisi 'email'."""
    for target in PRIORITAS_KOLOM_EMAIL:
        for kunci, nilai in jawaban.items():
            if kunci.strip().lower() == target:
                email = pertama(nilai)
                if email:
                    return email

    for kunci, nilai in jawaban.items():
        if "email" in kunci.lower():
            email = pertama(nilai)
            if email:
                return email
    return None
