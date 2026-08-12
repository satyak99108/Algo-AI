"""Operational Memory service for evidence provenance, memory search, and timeline."""

import uuid
import math
from typing import Any

from sqlalchemy import select, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.extraction import Extraction
from app.models.source import Source
from app.models.relationship import Relationship
from app.repositories.entity_repo import EntityRepository, ENTITY_NAME_FIELD, ENTITY_MODEL_MAP


class MemoryService:
    """Service handling operational memory exploration, evidence lookup, and learning timeline."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.entity_repo = EntityRepository(db)

    async def get_entity_evidence(
        self, entity_type: str, entity_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Get all evidence records (extractions + sources) for a specific entity."""
        stmt = (
            select(Extraction, Source)
            .join(Source, Extraction.source_id == Source.id)
            .where(
                Extraction.entity_type == entity_type,
                Extraction.entity_id == entity_id,
            )
            .order_by(desc(Extraction.created_at))
        )
        res = await self.db.execute(stmt)
        rows = res.all()

        evidence_list = []
        for extraction, source in rows:
            evidence_list.append({
                "id": str(extraction.id),
                "source_id": str(source.id),
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
                "confidence": extraction.confidence,
                "evidence_text": extraction.evidence_text or "No snippet text recorded",
                "created_at": extraction.created_at.isoformat(),
            })

        return evidence_list

    async def get_relationship_evidence(
        self, relationship_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Get evidence records for a specific relationship."""
        stmt = (
            select(Extraction, Source)
            .join(Source, Extraction.source_id == Source.id)
            .where(Extraction.relationship_id == relationship_id)
            .order_by(desc(Extraction.created_at))
        )
        res = await self.db.execute(stmt)
        rows = res.all()

        evidence_list = []
        for extraction, source in rows:
            evidence_list.append({
                "id": str(extraction.id),
                "source_id": str(source.id),
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
                "confidence": extraction.confidence,
                "evidence_text": extraction.evidence_text or "No snippet text recorded",
                "created_at": extraction.created_at.isoformat(),
            })

        return evidence_list

    async def search_memory(
        self,
        query: str | None = None,
        min_confidence: float = 0.0,
        entity_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """Search operational memory extractions with filtering."""
        stmt = select(Extraction, Source).join(Source, Extraction.source_id == Source.id)

        # Filters
        if min_confidence > 0:
            stmt = stmt.where(Extraction.confidence >= min_confidence)

        if entity_type and entity_type in ENTITY_MODEL_MAP:
            stmt = stmt.where(Extraction.entity_type == entity_type)

        if query and query.strip():
            q = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(
                    Extraction.evidence_text.ilike(q),
                    Source.filename.ilike(q),
                    Source.raw_text.ilike(q),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar_one()

        # Order & Paginate
        stmt = stmt.order_by(desc(Extraction.confidence), desc(Extraction.created_at))
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        res = await self.db.execute(stmt)
        rows = res.all()

        # Batch fetch entity names
        entity_refs = [(ex.entity_type, ex.entity_id) for ex, _ in rows]
        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        # Also fetch relationship details if relationship_id is set
        rel_ids = [ex.relationship_id for ex, _ in rows if ex.relationship_id]
        rel_map = {}
        if rel_ids:
            rel_stmt = select(Relationship).where(Relationship.id.in_(rel_ids))
            rel_res = await self.db.execute(rel_stmt)
            rels = rel_res.scalars().all()
            for r in rels:
                rel_map[r.id] = r

        items = []
        for extraction, source in rows:
            entity_name = names_map.get((extraction.entity_type, extraction.entity_id)) or "Unknown Entity"

            rel_data = None
            if extraction.relationship_id and extraction.relationship_id in rel_map:
                rel = rel_map[extraction.relationship_id]
                source_name = names_map.get((rel.source_type, rel.source_id)) or "Unknown Source Entity"
                target_name = names_map.get((rel.target_type, rel.target_id)) or "Unknown Target Entity"
                rel_data = {
                    "id": str(rel.id),
                    "source_type": rel.source_type,
                    "source_name": source_name,
                    "relationship_type": rel.relationship_type,
                    "target_type": rel.target_type,
                    "target_name": target_name,
                }

            items.append({
                "id": str(extraction.id),
                "entity_type": extraction.entity_type,
                "entity_id": str(extraction.entity_id),
                "entity_name": entity_name,
                "relationship": rel_data,
                "confidence": extraction.confidence,
                "evidence_text": extraction.evidence_text,
                "source_id": str(source.id),
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
                "created_at": extraction.created_at.isoformat(),
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total > 0 else 0,
        }

    async def get_memory_timeline(self, limit: int = 50) -> list[dict[str, Any]]:
        """Get chronological learning timeline of operational memory."""
        stmt = (
            select(Extraction, Source)
            .join(Source, Extraction.source_id == Source.id)
            .order_by(desc(Extraction.created_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        rows = res.all()

        entity_refs = [(ex.entity_type, ex.entity_id) for ex, _ in rows]
        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        timeline = []
        for extraction, source in rows:
            entity_name = names_map.get((extraction.entity_type, extraction.entity_id)) or "Unknown"
            timeline.append({
                "id": str(extraction.id),
                "entity_type": extraction.entity_type,
                "entity_id": str(extraction.entity_id),
                "entity_name": entity_name,
                "confidence": extraction.confidence,
                "evidence_text": extraction.evidence_text,
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
                "timestamp": extraction.created_at.isoformat(),
            })

        return timeline
