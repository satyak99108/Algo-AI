import uuid
from typing import Any

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.relationship import Relationship


class RelationshipRepository:
    """Database access layer for entity relationships (knowledge graph edges)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict[str, Any]) -> Relationship:
        """Create a new relationship edge."""
        relationship = Relationship(**data)
        self.db.add(relationship)
        await self.db.flush()
        await self.db.refresh(relationship)
        return relationship

    async def get_by_id(self, rel_id: uuid.UUID) -> Relationship | None:
        """Get a relationship by ID."""
        result = await self.db.execute(
            select(Relationship).where(Relationship.id == rel_id)
        )
        return result.scalar_one_or_none()

    async def delete(self, rel_id: uuid.UUID) -> bool:
        """Delete a relationship. Returns True if deleted."""
        rel = await self.get_by_id(rel_id)
        if rel is None:
            return False
        await self.db.delete(rel)
        await self.db.flush()
        return True

    async def list_relationships(
        self,
        source_type: str | None = None,
        source_id: uuid.UUID | None = None,
        target_type: str | None = None,
        target_id: uuid.UUID | None = None,
        relationship_type: str | None = None,
    ) -> list[Relationship]:
        """List relationships with optional filters."""
        query = select(Relationship)

        if source_type:
            query = query.where(Relationship.source_type == source_type)
        if source_id:
            query = query.where(Relationship.source_id == source_id)
        if target_type:
            query = query.where(Relationship.target_type == target_type)
        if target_id:
            query = query.where(Relationship.target_id == target_id)
        if relationship_type:
            query = query.where(Relationship.relationship_type == relationship_type)

        query = query.order_by(Relationship.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_entity_relationships(
        self, entity_type: str, entity_id: uuid.UUID
    ) -> list[Relationship]:
        """Get all relationships where the entity is either source or target."""
        query = select(Relationship).where(
            or_(
                and_(
                    Relationship.source_type == entity_type,
                    Relationship.source_id == entity_id,
                ),
                and_(
                    Relationship.target_type == entity_type,
                    Relationship.target_id == entity_id,
                ),
            )
        )
        query = query.order_by(Relationship.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all_relationships(self) -> list[Relationship]:
        """Get all relationships for knowledge graph visualization."""
        result = await self.db.execute(
            select(Relationship).order_by(Relationship.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        """Count total relationships."""
        result = await self.db.execute(
            select(func.count()).select_from(Relationship)
        )
        return result.scalar_one()

    async def check_duplicate(
        self,
        source_type: str,
        source_id: uuid.UUID,
        relationship_type: str,
        target_type: str,
        target_id: uuid.UUID,
    ) -> bool:
        """Check if a relationship already exists."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Relationship)
            .where(
                and_(
                    Relationship.source_type == source_type,
                    Relationship.source_id == source_id,
                    Relationship.relationship_type == relationship_type,
                    Relationship.target_type == target_type,
                    Relationship.target_id == target_id,
                )
            )
        )
        return result.scalar_one() > 0
