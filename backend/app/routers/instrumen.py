"""Endpoint ringkasan instrumen."""

from fastapi import APIRouter

from ..schemas import InstrumenRingkas
from ..services import survey_service

router = APIRouter(prefix="/api", tags=["instrumen"])


@router.get("/instrumen", response_model=list[InstrumenRingkas])
def get_instrumen():
    return survey_service.ringkasan_instrumen()
