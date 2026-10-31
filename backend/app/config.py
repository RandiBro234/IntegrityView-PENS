"""Konfigurasi aplikasi dan koneksi database.

Nilai diambil dari environment variable / file backend/.env agar kredensial
tidak ditulis di kode. Untuk Supabase, isi DATABASE_URL dengan connection
string dari dashboard (Project Settings > Database > Connection string).
Gunakan Session pooler karena Direct connection hanya IPv6.
"""

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _muat_env():
    """Muat variabel dari backend/.env tanpa dependensi tambahan."""
    env_path = BACKEND_DIR / ".env"
    if not env_path.exists():
        return
    for baris in env_path.read_text(encoding="utf-8").splitlines():
        baris = baris.strip()
        if not baris or baris.startswith("#") or "=" not in baris:
            continue
        kunci, _, nilai = baris.partition("=")
        os.environ.setdefault(kunci.strip(), nilai.strip().strip('"').strip("'"))


_muat_env()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "integrity_view_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "sslmode": os.getenv("DB_SSLMODE", "prefer"),
}

APP_NAME = "IntegrityView API"
APP_VERSION = "1.0.0"
CORS_ORIGINS = [
    asal.strip()
    for asal in os.getenv("CORS_ORIGINS", "*").split(",")
    if asal.strip()
]
