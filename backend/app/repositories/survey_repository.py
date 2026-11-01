"""Query tabel survey_responses."""

from __future__ import annotations

from typing import Any, Optional

from psycopg2.extras import Json

from ..db import db_cursor


def simpan_jawaban(
    instrumen: str, email: Optional[str], data: dict[str, Any]
) -> None:
    with db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO survey_responses (nama_instrumen, email_responden, data_jawaban)
            VALUES (%s, %s, %s)
            """,
            (instrumen, email, Json(data)),
        )


def daftar_survei(
    instrumen: Optional[str] = None, limit: Optional[int] = None
) -> list[dict[str, Any]]:
    sql = (
        "SELECT nama_instrumen, email_responden, data_jawaban, created_at "
        "FROM survey_responses"
    )
    params: list[Any] = []

    if instrumen:
        sql += " WHERE nama_instrumen = %s"
        params.append(instrumen)

    sql += " ORDER BY created_at DESC"

    if limit:
        sql += " LIMIT %s"
        params.append(limit)

    with db_cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()

    return [
        {
            "nama_instrumen": row[0],
            "email_responden": row[1],
            "data_jawaban": row[2],
            "timestamp": row[3].isoformat() if row[3] else None,
        }
        for row in rows
    ]


def ringkasan_per_instrumen() -> list[dict[str, Any]]:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT nama_instrumen, COUNT(*), MAX(created_at)
            FROM survey_responses
            GROUP BY nama_instrumen
            ORDER BY nama_instrumen
            """
        )
        rows = cursor.fetchall()

    return [
        {
            "nama_instrumen": row[0],
            "jumlah": row[1],
            "terakhir": row[2].isoformat() if row[2] else None,
        }
        for row in rows
    ]
