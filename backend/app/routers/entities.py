import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.entity_service import EntityService
from app.schemas.entity import ENTITY_SCHEMAS

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("/{entity_type}")
async def list_entities(
    entity_type: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
):
    """List entities of a given type with pagination and search."""
    service = EntityService(db)
    return await service.list_entities(
        entity_type=entity_type,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/{entity_type}/{entity_id}")
async def get_entity(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single entity with its relationships."""
    service = EntityService(db)
    return await service.get_entity_detail(entity_type, entity_id)


@router.post("/{entity_type}", status_code=201)
async def create_entity(
    entity_type: str,
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    """Create a new entity of the given type."""
    service = EntityService(db)

    # Validate body against the entity's create schema
    schema_info = ENTITY_SCHEMAS.get(entity_type)
    if schema_info:
        create_schema = schema_info["create"]
        validated = create_schema(**body)
        data = validated.model_dump(exclude_unset=True)
    else:
        data = body

    return await service.create_entity(entity_type, data)


@router.put("/{entity_type}/{entity_id}")
async def update_entity(
    entity_type: str,
    entity_id: uuid.UUID,
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    """Update an existing entity."""
    service = EntityService(db)

    # Validate body against the entity's update schema
    schema_info = ENTITY_SCHEMAS.get(entity_type)
    if schema_info:
        update_schema = schema_info["update"]
        validated = update_schema(**body)
        data = validated.model_dump(exclude_unset=True)
    else:
        data = body

    return await service.update_entity(entity_type, entity_id, data)


@router.delete("/{entity_type}/{entity_id}")
async def delete_entity(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an entity."""
    service = EntityService(db)
    await service.delete_entity(entity_type, entity_id)
    return {"message": f"{entity_type} entity deleted", "success": True}
