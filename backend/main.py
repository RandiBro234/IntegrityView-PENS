"""Entry point kompatibel.

Implementasi aplikasi ada di paket ``app/``. Jalankan dengan:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from app.main import app  # noqa: F401
