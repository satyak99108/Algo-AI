"""API endpoints for Operational Memory (search, evidence, timeline)."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/search")
async def search_memory(
    query: str | None = Query(default=None),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0),
    entity_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search operational memory extractions with confidence & entity type filters."""
    service = MemoryService(db)
    return await service.search_memory(
        query=query,
        min_confidence=min_confidence,
        entity_type=entity_type,
        page=page,
        page_size=page_size,
    )


@router.get("/entity/{entity_type}/{entity_id}/evidence")
async def get_entity_evidence(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all evidence records for a specific entity."""
    service = MemoryService(db)
    return await service.get_entity_evidence(entity_type, entity_id)


@router.get("/relationship/{relationship_id}/evidence")
async def get_relationship_evidence(
    relationship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get evidence records for a specific relationship."""
    service = MemoryService(db)
    return await service.get_relationship_evidence(relationship_id)


@router.get("/timeline")
async def get_memory_timeline(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get chronological learning timeline of operational memory."""
    service = MemoryService(db)
    return await service.get_memory_timeline(limit=limit)
