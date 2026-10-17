"""IntegrityView backend.

Bertindak sebagai penerima webhook Google Forms dan penyedia API untuk
frontend React. Jalankan dengan:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from typing import Any, Optional

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import Json

from db_config import DB_CONFIG, get_db_connection

app = FastAPI(title="IntegrityView API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pertama(nilai: Any) -> Optional[str]:
    """Google Forms (e.namedValues) mengirim tiap jawaban sebagai list."""
    if isinstance(nilai, list):
        return nilai[0] if nilai else None
    if nilai is None:
        return None
    return str(nilai)


def _ambil_email(jawaban: dict) -> Optional[str]:
    for kunci in ("Email Address", "Email", "email"):
        if kunci in jawaban:
            email = _pertama(jawaban[kunci])
            if email:
                return email
    return None


@app.get("/")
def beranda():
    return {"status": "ok", "service": "IntegrityView API"}


@app.post("/api/webhook/survei")
async def terima_webhook(request: Request):
    data = await request.json()

    instrumen = data.get("instrumen", "UNKNOWN")
    jawaban_raw = data.get("data", {}) or {}
    email = _ambil_email(jawaban_raw)

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO survey_responses (nama_instrumen, email_responden, data_jawaban)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (instrumen, email, Json(jawaban_raw)))
        conn.commit()
        cursor.close()
    finally:
        conn.close()

    return {"status": "success", "message": f"Data {instrumen} saved."}


@app.get("/api/survei")
def get_survei(
    instrumen: Optional[str] = Query(default=None, description="Filter nama instrumen"),
    limit: Optional[int] = Query(default=None, ge=1, description="Batasi jumlah baris"),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        sql = "SELECT nama_instrumen, email_responden, data_jawaban, created_at FROM survey_responses"
        params: list = []
        if instrumen:
            sql += " WHERE nama_instrumen = %s"
            params.append(instrumen)
        sql += " ORDER BY created_at DESC"
        if limit:
            sql += " LIMIT %s"
            params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        cursor.close()
    finally:
        conn.close()

    return [
        {
            "nama_instrumen": row[0],
            "email_responden": row[1],
            "data_jawaban": row[2],
            "timestamp": row[3].isoformat() if row[3] else None,
        }
        for row in rows
    ]


@app.get("/api/instrumen")
def get_instrumen():
    """Ringkasan daftar instrumen yang sudah punya data."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT nama_instrumen, COUNT(*), MAX(created_at)
            FROM survey_responses
            GROUP BY nama_instrumen
            ORDER BY nama_instrumen
            """
        )
        rows = cursor.fetchall()
        cursor.close()
    finally:
        conn.close()

    return [
        {
            "nama_instrumen": row[0],
            "jumlah": row[1],
            "terakhir": row[2].isoformat() if row[2] else None,
        }
        for row in rows
    ]
