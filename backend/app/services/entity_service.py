import uuid
import math
import asyncio
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.entity_repo import EntityRepository, ENTITY_MODEL_MAP, ENTITY_NAME_FIELD
from app.repositories.relationship_repo import RelationshipRepository
from app.schemas.common import PaginatedResponse, StatsResponse
from app.schemas.entity import ENTITY_SCHEMAS, RelatedEntity
from app.exceptions import EntityNotFoundError, InvalidEntityTypeError


VALID_ENTITY_TYPES = set(ENTITY_MODEL_MAP.keys())


from sqlalchemy import select, func
from app.models.person import Person
from app.models.project import Project
from app.models.decision import Decision
from app.models.task import Task
from app.models.process import Process
from app.models.event import Event
from app.models.document import Document
from app.models.workflow import Workflow
from app.models.relationship import Relationship


class EntityService:
    """Business logic for entity operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.entity_repo = EntityRepository(db)
        self.relationship_repo = RelationshipRepository(db)

    def _validate_entity_type(self, entity_type: str) -> None:
        """Validate that the entity type is recognized."""
        if entity_type not in VALID_ENTITY_TYPES:
            raise InvalidEntityTypeError(entity_type)

    async def list_entities(
        self,
        entity_type: str,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> PaginatedResponse:
        """List entities with pagination."""
        self._validate_entity_type(entity_type)

        items, total = await self.entity_repo.list_entities(
            entity_type, page, page_size, search, sort_by, sort_order
        )

        response_schema = ENTITY_SCHEMAS[entity_type]["response"]
        serialized = [response_schema.model_validate(item) for item in items]

        return PaginatedResponse(
            items=serialized,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
        )

    async def get_entity(self, entity_type: str, entity_id: uuid.UUID) -> dict[str, Any]:
        """Get a single entity by type and ID."""
        self._validate_entity_type(entity_type)

        entity = await self.entity_repo.get_entity(entity_type, entity_id)
        if entity is None:
            raise EntityNotFoundError(entity_type, str(entity_id))

        response_schema = ENTITY_SCHEMAS[entity_type]["response"]
        return response_schema.model_validate(entity).model_dump(mode="json")

    async def get_entity_detail(
        self, entity_type: str, entity_id: uuid.UUID
    ) -> dict[str, Any]:
        """Get entity with its relationships."""
        self._validate_entity_type(entity_type)

        entity = await self.entity_repo.get_entity(entity_type, entity_id)
        if entity is None:
            raise EntityNotFoundError(entity_type, str(entity_id))

        relationships = await self.relationship_repo.get_entity_relationships(
            entity_type, entity_id
        )

        response_schema = ENTITY_SCHEMAS[entity_type]["response"]
        entity_data = response_schema.model_validate(entity).model_dump(mode="json")

        entity_refs = []
        for rel in relationships:
            if rel.source_type == entity_type and rel.source_id == entity_id:
                entity_refs.append((rel.target_type, rel.target_id))
            else:
                entity_refs.append((rel.source_type, rel.source_id))

        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        related_entities = []
        for rel in relationships:
            if rel.source_type == entity_type and rel.source_id == entity_id:
                direction = "outgoing"
                other_type = rel.target_type
                other_id = rel.target_id
            else:
                direction = "incoming"
                other_type = rel.source_type
                other_id = rel.source_id

            other_name = names_map.get((other_type, other_id)) or f"Unknown {other_type}"

            related_entities.append(
                RelatedEntity(
                    id=other_id,
                    entity_type=other_type,
                    name=other_name,
                    relationship_type=rel.relationship_type,
                    direction=direction,
                )
            )

        return {
            "entity": entity_data,
            "entity_type": entity_type,
            "relationships": [r.model_dump(mode="json") for r in related_entities],
        }

    async def create_entity(self, entity_type: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new entity."""
        self._validate_entity_type(entity_type)

        entity = await self.entity_repo.create_entity(entity_type, data)
        response_schema = ENTITY_SCHEMAS[entity_type]["response"]
        return response_schema.model_validate(entity).model_dump(mode="json")

    async def update_entity(
        self, entity_type: str, entity_id: uuid.UUID, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Update an existing entity."""
        self._validate_entity_type(entity_type)

        entity = await self.entity_repo.update_entity(entity_type, entity_id, data)
        if entity is None:
            raise EntityNotFoundError(entity_type, str(entity_id))

        response_schema = ENTITY_SCHEMAS[entity_type]["response"]
        return response_schema.model_validate(entity).model_dump(mode="json")

    async def delete_entity(self, entity_type: str, entity_id: uuid.UUID) -> bool:
        """Delete an entity."""
        self._validate_entity_type(entity_type)

        deleted = await self.entity_repo.delete_entity(entity_type, entity_id)
        if not deleted:
            raise EntityNotFoundError(entity_type, str(entity_id))
        return True

    async def get_stats(self) -> StatsResponse:
        """Get dashboard statistics in a single optimized query."""
        stmt = select(
            select(func.count()).select_from(Person).scalar_subquery().label("people"),
            select(func.count()).select_from(Project).scalar_subquery().label("projects"),
            select(func.count()).select_from(Decision).scalar_subquery().label("decisions"),
            select(func.count()).select_from(Task).scalar_subquery().label("tasks"),
            select(func.count()).select_from(Process).scalar_subquery().label("processes"),
            select(func.count()).select_from(Event).scalar_subquery().label("events"),
            select(func.count()).select_from(Document).scalar_subquery().label("documents"),
            select(func.count()).select_from(Workflow).scalar_subquery().label("workflows"),
            select(func.count()).select_from(Relationship).scalar_subquery().label("relationships"),
        )
        result = await self.db.execute(stmt)
        row = result.one()._asdict()

        total = sum(v for k, v in row.items() if k != "relationships")

        return StatsResponse(
            people=row.get("people", 0),
            projects=row.get("projects", 0),
            decisions=row.get("decisions", 0),
            tasks=row.get("tasks", 0),
            processes=row.get("processes", 0),
            events=row.get("events", 0),
            documents=row.get("documents", 0),
            workflows=row.get("workflows", 0),
            relationships=row.get("relationships", 0),
            total_entities=total,
        )
