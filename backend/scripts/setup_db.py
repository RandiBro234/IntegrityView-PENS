"""Buat database lokal (jika belum ada) dan terapkan schema.sql.

Jalankan dari folder backend dengan kredensial yang benar:
    $env:DB_PASSWORD = "password_anda"   # PowerShell
    python scripts/setup_db.py

Catatan: script ini untuk PostgreSQL lokal. Supabase memakai schema di
supabase/schema.sql (sudah termasuk RLS).
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import psycopg2
from psycopg2 import sql

from app.config import DB_CONFIG

DB_NAME = DB_CONFIG["dbname"]
SCHEMA_FILE = BACKEND_DIR / "schema.sql"


def pastikan_database_ada():
    admin_config = dict(DB_CONFIG)
    admin_config["dbname"] = "postgres"

    conn = psycopg2.connect(**admin_config)
    conn.autocommit = True
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
        if cursor.fetchone() is None:
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME))
            )
            print(f"Database '{DB_NAME}' dibuat.")
        else:
            print(f"Database '{DB_NAME}' sudah ada.")
        cursor.close()
    finally:
        conn.close()


def terapkan_schema():
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        ddl = f.read()

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cursor = conn.cursor()
        cursor.execute(ddl)
        conn.commit()
        cursor.close()
    finally:
        conn.close()
    print("Schema 'survey_responses' siap.")


def main():
    try:
        pastikan_database_ada()
        terapkan_schema()
    except psycopg2.OperationalError as e:
        print(f"Gagal terhubung ke PostgreSQL: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
