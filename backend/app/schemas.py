"""Model request/response API."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class WebhookPayload(BaseModel):
    instrumen: str = "UNKNOWN"
    data: dict[str, Any] = Field(default_factory=dict)


class WebhookResponse(BaseModel):
    status: str
    message: str


class SurveiItem(BaseModel):
    nama_instrumen: str
    email_responden: Optional[str] = None
    data_jawaban: dict[str, Any]
    timestamp: Optional[str] = None


class InstrumenRingkas(BaseModel):
    nama_instrumen: str
    jumlah: int
    terakhir: Optional[str] = None
