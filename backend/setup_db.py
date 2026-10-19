"""Buat database integrity_view_db (jika belum ada) dan terapkan schema.sql.

Jalankan dari folder backend dengan kredensial yang benar:
    $env:DB_PASSWORD = "password_anda"   # PowerShell
    python setup_db.py
"""

import os
import sys

import psycopg2
from psycopg2 import sql

from db_config import DB_CONFIG

DB_NAME = DB_CONFIG["dbname"]
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")


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


if __name__ == "__main__":
    try:
        pastikan_database_ada()
        terapkan_schema()
    except psycopg2.OperationalError as e:
        print(f"Gagal terhubung ke PostgreSQL: {e}")
        sys.exit(1)
