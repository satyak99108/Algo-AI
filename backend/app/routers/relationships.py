import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.graph_service import GraphService
from app.schemas.relationship import RelationshipCreate

router = APIRouter(prefix="/relationships", tags=["relationships"])


@router.get("")
async def list_relationships(
    source_type: str | None = Query(default=None),
    source_id: uuid.UUID | None = Query(default=None),
    target_type: str | None = Query(default=None),
    target_id: uuid.UUID | None = Query(default=None),
    relationship_type: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """List relationships with optional filters."""
    service = GraphService(db)
    return await service.list_relationships(
        source_type=source_type,
        source_id=source_id,
        target_type=target_type,
        target_id=target_id,
        relationship_type=relationship_type,
    )


@router.post("", status_code=201)
async def create_relationship(
    body: RelationshipCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new relationship between two entities."""
    service = GraphService(db)
    return await service.create_relationship(body.model_dump())


@router.delete("/{relationship_id}")
async def delete_relationship(
    relationship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a relationship."""
    service = GraphService(db)
    await service.delete_relationship(relationship_id)
    return {"message": "Relationship deleted", "success": True}


@router.get("/{entity_type}/{entity_id}")
async def get_entity_relationships(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all relationships for a specific entity."""
    service = GraphService(db)
    return await service.list_relationships(
        source_type=entity_type,
        source_id=entity_id,
    )
