"""API endpoints for data ingestion (file upload, text paste, source management)."""

import uuid

from fastapi import APIRouter, Depends, File, UploadFile, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.ingestion import (
    TextIngestRequest,
    SourceResponse,
    SourceDetailResponse,
    ExtractionResponse,
    IngestionResult,
    AIStatusResponse,
)
from app.services.ingestion_service import IngestionService
from app.services.llm_service import LLMService
from app.config import get_settings

router = APIRouter(prefix="/ingest", tags=["ingestion"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload", response_model=IngestionResult)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file (PDF, DOCX, or TXT) for ingestion and AI extraction."""
    # Validate file type
    if file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )

    service = IngestionService(db)
    result = await service.ingest_file(file)

    return IngestionResult(
        source_id=result["source_id"],
        status=result["status"],
        entities_created=result["entities_created"],
        relationships_created=result["relationships_created"],
        extractions=result.get("extractions", []),
        message=result["message"],
    )


@router.post("/text", response_model=IngestionResult)
async def ingest_text(
    body: TextIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest pasted text (e.g., Slack conversations, meeting notes)."""
    service = IngestionService(db)
    result = await service.ingest_text(text=body.text, label=body.label)

    return IngestionResult(
        source_id=result["source_id"],
        status=result["status"],
        entities_created=result["entities_created"],
        relationships_created=result["relationships_created"],
        extractions=result.get("extractions", []),
        message=result["message"],
    )


@router.get("/sources")
async def list_sources(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all ingested sources with pagination."""
    service = IngestionService(db)
    result = await service.list_sources(page=page, page_size=page_size)

    return {
        "items": [SourceResponse.model_validate(s) for s in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/sources/{source_id}")
async def get_source_detail(
    source_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific source with its extraction details."""
    service = IngestionService(db)
    result = await service.get_source_detail(source_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Source not found")

    return SourceDetailResponse(
        source=SourceResponse.model_validate(result["source"]),
        extractions=[ExtractionResponse.model_validate(e) for e in result["extractions"]],
        raw_text_preview=result["raw_text_preview"],
    )


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Check if the AI service (Gemini) is available."""
    settings = get_settings()
    llm = LLMService()
    available, message = await llm.is_available()

    return AIStatusResponse(
        available=available,
        provider="gemini",
        model=settings.gemini_model,
        message=message,
    )
