"""Endpoint penerima webhook Google Forms."""

from fastapi import APIRouter, HTTPException

from ..schemas import WebhookPayload, WebhookResponse
from ..services import survey_service

router = APIRouter(prefix="/api/webhook", tags=["webhook"])


@router.post("/survei", response_model=WebhookResponse)
def terima_webhook(payload: WebhookPayload):
    try:
        return survey_service.simpan_webhook(payload.instrumen, payload.data)
    except survey_service.PayloadKosong as error:
        raise HTTPException(status_code=400, detail=str(error))
