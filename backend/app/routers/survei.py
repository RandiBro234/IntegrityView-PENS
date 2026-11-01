"""Endpoint daftar jawaban survei."""

from typing import Optional

from fastapi import APIRouter, Query

from ..schemas import SurveiItem
from ..services import survey_service

router = APIRouter(prefix="/api", tags=["survei"])


@router.get("/survei", response_model=list[SurveiItem])
def get_survei(
    instrumen: Optional[str] = Query(default=None, description="Filter nama instrumen"),
    limit: Optional[int] = Query(default=None, ge=1, description="Batasi jumlah baris"),
):
    return survey_service.daftar_survei(instrumen, limit)
