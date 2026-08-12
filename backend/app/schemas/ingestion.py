from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Any


class TextIngestRequest(BaseModel):
    """Request to ingest raw text (e.g. pasted Slack conversation)."""

    text: str = Field(..., min_length=1, description="The raw text to ingest")
    label: str = Field(
        default="Pasted text",
        max_length=500,
        description="A label/name for this source",
    )


class SourceResponse(BaseModel):
    """Response schema for a Source record."""

    id: UUID
    filename: str
    source_type: str
    content_type: str | None = None
    status: str
    error_message: str | None = None
    extracted_entities: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExtractionResponse(BaseModel):
    """Response schema for an Extraction record."""

    id: UUID
    source_id: UUID
    entity_type: str
    entity_id: UUID
    relationship_id: UUID | None = None
    confidence: float
    evidence_text: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceDetailResponse(BaseModel):
    """Source with its extractions."""

    source: SourceResponse
    extractions: list[ExtractionResponse] = []
    raw_text_preview: str | None = None


class IngestionResult(BaseModel):
    """Summary returned after ingestion completes."""

    source_id: UUID
    status: str
    entities_created: int = 0
    relationships_created: int = 0
    extractions: list[dict[str, Any]] = []
    message: str = ""


class AIStatusResponse(BaseModel):
    """Health check response for the AI service."""

    available: bool
    provider: str = "gemini"
    model: str = ""
    message: str = ""
