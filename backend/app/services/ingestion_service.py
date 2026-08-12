"""Orchestrates the full ingestion pipeline: receive → parse → extract → persist."""

import logging
import os
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.source import Source, SourceType, SourceStatus
from app.models.extraction import Extraction
from app.services.parser_service import ParserService
from app.services.extraction_service import ExtractionService

logger = logging.getLogger(__name__)
settings = get_settings()


class IngestionService:
    """Orchestrates document/text ingestion through the full pipeline."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.parser = ParserService()
        self.extraction_service = ExtractionService(db)

    async def ingest_file(self, file: UploadFile) -> dict:
        """Ingest an uploaded file (PDF/DOCX/TXT).

        1. Save the file to disk
        2. Extract text via ParserService
        3. Create Source record
        4. Run AI extraction
        5. Return summary
        """
        # Ensure upload directory exists
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file with a unique name
        file_ext = Path(file.filename or "upload.txt").suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        file_path = upload_dir / unique_name

        content = await file.read()
        file_path.write_bytes(content)

        # Determine content type
        content_type = file.content_type or "text/plain"

        # Extract text
        try:
            raw_text = await self.parser.extract_text(
                file_path=str(file_path),
                content_type=content_type,
            )
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            # Still create the source record but mark as failed
            source = Source(
                filename=file.filename or "upload",
                source_type=SourceType.document,
                content_type=content_type,
                file_path=str(file_path),
                status=SourceStatus.failed,
                error_message=f"Text extraction failed: {str(e)}",
            )
            self.db.add(source)
            await self.db.flush()
            await self.db.refresh(source)
            return {
                "source_id": source.id,
                "status": "failed",
                "message": f"Text extraction failed: {str(e)}",
                "entities_created": 0,
                "relationships_created": 0,
                "extractions": [],
            }

        # Create source record
        source = Source(
            filename=file.filename or "upload",
            source_type=SourceType.document,
            content_type=content_type,
            raw_text=raw_text,
            file_path=str(file_path),
            status=SourceStatus.pending,
        )
        self.db.add(source)
        await self.db.flush()
        await self.db.refresh(source)

        # Run extraction
        result = await self.extraction_service.extract_and_persist(source)

        return {
            "source_id": source.id,
            "status": source.status.value,
            "message": f"Successfully extracted {result['entities_created']} entities and {result['relationships_created']} relationships",
            **result,
        }

    async def ingest_text(self, text: str, label: str = "Pasted text") -> dict:
        """Ingest pasted text (e.g. Slack conversation).

        1. Create Source record with raw text
        2. Run AI extraction
        3. Return summary
        """
        source = Source(
            filename=label,
            source_type=SourceType.text_paste,
            content_type="text/plain",
            raw_text=text,
            status=SourceStatus.pending,
        )
        self.db.add(source)
        await self.db.flush()
        await self.db.refresh(source)

        # Run extraction
        result = await self.extraction_service.extract_and_persist(source)

        return {
            "source_id": source.id,
            "status": source.status.value,
            "message": f"Successfully extracted {result['entities_created']} entities and {result['relationships_created']} relationships",
            **result,
        }

    async def list_sources(
        self, page: int = 1, page_size: int = 20
    ) -> dict:
        """List all ingested sources with pagination."""
        from sqlalchemy import func

        count_result = await self.db.execute(
            select(func.count()).select_from(Source)
        )
        total = count_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Source)
            .order_by(desc(Source.created_at))
            .offset(offset)
            .limit(page_size)
        )
        sources = list(result.scalars().all())

        total_pages = max(1, -(-total // page_size))  # Ceiling division

        return {
            "items": sources,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_source_detail(self, source_id: uuid.UUID) -> dict | None:
        """Get a source with its extractions."""
        result = await self.db.execute(
            select(Source).where(Source.id == source_id)
        )
        source = result.scalar_one_or_none()
        if not source:
            return None

        extractions_result = await self.db.execute(
            select(Extraction)
            .where(Extraction.source_id == source_id)
            .order_by(Extraction.created_at)
        )
        extractions = list(extractions_result.scalars().all())

        # Preview of raw text (first 1000 chars)
        preview = source.raw_text[:1000] if source.raw_text else None

        return {
            "source": source,
            "extractions": extractions,
            "raw_text_preview": preview,
        }
