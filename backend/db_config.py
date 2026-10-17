"""Konfigurasi koneksi database terpusat.

Nilai diambil dari environment variable agar kredensial tidak ditulis di kode.
Contoh (PowerShell):
    $env:DB_PASSWORD = "arekpens"
    $env:DB_USER = "postgres"
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

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "integrity_view_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}


def get_db_connection():
    import psycopg2

    return psycopg2.connect(**DB_CONFIG)
