"""Endpoint kesehatan layanan."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def beranda():
    return {"status": "ok", "service": "IntegrityView API"}
