"""Konfigurasi koneksi database terpusat.

Dipakai oleh script manual (mis. migrasi.py) untuk mengisi Supabase.
Nilai diambil dari environment variable / file .env agar kredensial tidak
ditulis di kode.

Cara termudah untuk Supabase: isi DATABASE_URL dengan connection string
dari dashboard (Project Settings > Database > Connection string).
"""

import os
from pathlib import Path


def _muat_env():
    """Muat variabel dari file .env di folder ini (tanpa dependensi tambahan)."""
    env_path = Path(__file__).with_name(".env")
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


def get_db_connection():
    import psycopg2

    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    return psycopg2.connect(**DB_CONFIG)
