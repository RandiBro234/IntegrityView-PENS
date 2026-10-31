"""Shim kompatibilitas impor lama.

Implementasi sekarang ada di ``app/config.py`` dan ``app/db.py``.
"""

from app.config import DATABASE_URL, DB_CONFIG
from app.db import get_connection as get_db_connection

__all__ = ["DATABASE_URL", "DB_CONFIG", "get_db_connection"]
