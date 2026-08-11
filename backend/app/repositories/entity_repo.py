import uuid
import asyncio
from typing import Any

from sqlalchemy import select, func, text, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.person import Person
from app.models.project import Project
from app.models.decision import Decision
from app.models.task import Task
from app.models.process import Process
from app.models.event import Event
from app.models.document import Document
from app.models.workflow import Workflow

# Map entity type strings to their SQLAlchemy model classes
ENTITY_MODEL_MAP = {
    "people": Person,
    "projects": Project,
    "decisions": Decision,
    "tasks": Task,
    "processes": Process,
    "events": Event,
    "documents": Document,
    "workflows": Workflow,
}

# Map entity types to their "name" column for display/search
ENTITY_NAME_FIELD = {
    "people": "name",
    "projects": "name",
    "decisions": "title",
    "tasks": "title",
    "processes": "name",
    "events": "title",
    "documents": "title",
    "workflows": "name",
}


class EntityRepository:
    """Database access layer for all entity types."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_model(self, entity_type: str):
        """Get the SQLAlchemy model class for an entity type."""
        model = ENTITY_MODEL_MAP.get(entity_type)
        if model is None:
            raise ValueError(f"Unknown entity type: {entity_type}")
        return model

    async def list_entities(
        self,
        entity_type: str,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Any], int]:
        """List entities with pagination, search, and sorting. Returns (items, total_count)."""
        model = self._get_model(entity_type)
        name_field = ENTITY_NAME_FIELD[entity_type]

        # Base query
        query = select(model)
        count_query = select(func.count()).select_from(model)

        # Search filter
        if search:
            name_col = getattr(model, name_field)
            search_filter = name_col.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Sorting
        sort_col = getattr(model, sort_by, None) or getattr(model, "created_at")
        if sort_order == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # Get total count
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        items_res = await self.db.execute(query)
        items = list(items_res.scalars().all())

        return items, total

    async def get_entity(self, entity_type: str, entity_id: uuid.UUID) -> Any | None:
        """Get a single entity by type and ID."""
        model = self._get_model(entity_type)
        result = await self.db.execute(select(model).where(model.id == entity_id))
        return result.scalar_one_or_none()

    async def create_entity(self, entity_type: str, data: dict[str, Any]) -> Any:
        """Create a new entity."""
        model = self._get_model(entity_type)
        entity = model(**data)
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update_entity(
        self, entity_type: str, entity_id: uuid.UUID, data: dict[str, Any]
    ) -> Any | None:
        """Update an existing entity. Returns None if not found."""
        entity = await self.get_entity(entity_type, entity_id)
        if entity is None:
            return None

        for key, value in data.items():
            if value is not None:
                setattr(entity, key, value)

        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete_entity(self, entity_type: str, entity_id: uuid.UUID) -> bool:
        """Delete an entity. Returns True if deleted, False if not found."""
        entity = await self.get_entity(entity_type, entity_id)
        if entity is None:
            return False

        await self.db.delete(entity)
        await self.db.flush()
        return True

    async def get_entity_name(self, entity_type: str, entity_id: uuid.UUID) -> str | None:
        """Get just the name/title of an entity for display purposes."""
        model = self._get_model(entity_type)
        name_field = ENTITY_NAME_FIELD[entity_type]
        name_col = getattr(model, name_field)

        result = await self.db.execute(
            select(name_col).where(model.id == entity_id)
        )
        return result.scalar_one_or_none()

    async def get_entity_names_batch(
        self, entity_refs: list[tuple[str, uuid.UUID]]
    ) -> dict[tuple[str, uuid.UUID], str]:
        """Fetch display names for a list of (entity_type, entity_id) pairs in batch."""
        if not entity_refs:
            return {}

        type_to_ids: dict[str, set[uuid.UUID]] = {}
        for etype, eid in entity_refs:
            if etype in ENTITY_MODEL_MAP:
                type_to_ids.setdefault(etype, set()).add(eid)

        merged = {}
        for etype, ids in type_to_ids.items():
            model = self._get_model(etype)
            name_field = ENTITY_NAME_FIELD[etype]
            name_col = getattr(model, name_field)
            stmt = select(model.id, name_col).where(model.id.in_(ids))
            res = await self.db.execute(stmt)
            for row in res.all():
                merged[(etype, row[0])] = row[1]
        return merged

    async def count_entities(self, entity_type: str) -> int:
        """Count total entities of a type."""
        model = self._get_model(entity_type)
        result = await self.db.execute(select(func.count()).select_from(model))
        return result.scalar_one()

    async def get_all_entities_for_graph(self) -> dict[str, list[Any]]:
        """Get all entities for knowledge graph visualization."""
        all_entities = {}
        for entity_type, model in ENTITY_MODEL_MAP.items():
            result = await self.db.execute(select(model))
            all_entities[entity_type] = list(result.scalars().all())
        return all_entities
