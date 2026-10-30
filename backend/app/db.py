"""Helper koneksi dan transaksi database."""

from contextlib import contextmanager

import psycopg2

from .config import DATABASE_URL, DB_CONFIG


def get_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    return psycopg2.connect(**DB_CONFIG)


@contextmanager
def db_cursor(commit: bool = False):
    """Buka cursor, commit bila diminta, rollback saat error, lalu tutup."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
    finally:
        conn.close()
