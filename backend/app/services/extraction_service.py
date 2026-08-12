"""Core AI extraction pipeline — takes LLM output and persists entities/relationships."""

import logging
import uuid
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source import Source, SourceStatus
from app.models.extraction import Extraction
from app.models.relationship import Relationship
from app.repositories.entity_repo import ENTITY_MODEL_MAP, ENTITY_NAME_FIELD
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class ExtractionService:
    """Processes LLM extraction output and persists entities/relationships to the DB."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = LLMService()

    async def extract_and_persist(self, source: Source) -> dict[str, Any]:
        """Run AI extraction on a source's raw text and persist results.

        Args:
            source: A Source record with raw_text populated.

        Returns:
            Summary dict with counts of created entities and relationships.
        """
        if not source.raw_text:
            return {"entities_created": 0, "relationships_created": 0, "extractions": []}

        # Update source status to processing
        source.status = SourceStatus.processing
        await self.db.flush()

        try:
            # Call the LLM
            llm_result = await self.llm.extract_knowledge(source.raw_text)
            logger.info(
                f"LLM returned {len(llm_result.get('entities', []))} entities, "
                f"{len(llm_result.get('relationships', []))} relationships"
            )

            # Process entities
            entity_name_to_record = {}
            entities_created = 0
            extraction_details = []

            for entity_data in llm_result.get("entities", []):
                result = await self._create_or_match_entity(entity_data, source.id)
                if result:
                    entity_name_to_record[result["key"]] = result
                    entities_created += 1
                    extraction_details.append({
                        "type": "entity",
                        "entity_type": result["entity_type"],
                        "name": result["name"],
                        "confidence": result["confidence"],
                        "action": result["action"],
                    })

            # Process relationships
            relationships_created = 0
            for rel_data in llm_result.get("relationships", []):
                created = await self._create_relationship(
                    rel_data, entity_name_to_record, source.id
                )
                if created:
                    relationships_created += 1
                    extraction_details.append({
                        "type": "relationship",
                        "source_name": rel_data.get("source_name"),
                        "relationship_type": rel_data.get("relationship_type"),
                        "target_name": rel_data.get("target_name"),
                        "confidence": rel_data.get("confidence", 0.0),
                    })

            # Update source status
            source.status = SourceStatus.completed
            source.extracted_entities = {
                "entities_created": entities_created,
                "relationships_created": relationships_created,
                "details": extraction_details,
            }
            await self.db.flush()

            return {
                "entities_created": entities_created,
                "relationships_created": relationships_created,
                "extractions": extraction_details,
            }

        except Exception as e:
            logger.error(f"Extraction failed for source {source.id}: {e}")
            source.status = SourceStatus.failed
            source.error_message = str(e)
            await self.db.flush()
            raise

    async def _create_or_match_entity(
        self, entity_data: dict, source_id: uuid.UUID
    ) -> dict[str, Any] | None:
        """Create a new entity or match an existing one by name.

        Returns a dict with entity info, or None if the entity couldn't be processed.
        """
        entity_type = entity_data.get("type", "").strip().lower()
        data = entity_data.get("data", {})
        confidence = entity_data.get("confidence", 0.5)
        evidence = entity_data.get("evidence", "")

        if entity_type not in ENTITY_MODEL_MAP:
            logger.warning(f"Skipping unknown entity type: {entity_type}")
            return None

        # Determine the name field and value
        name_field = ENTITY_NAME_FIELD[entity_type]
        entity_name = data.get(name_field, "").strip()

        if not entity_name:
            # Try common fallbacks
            entity_name = data.get("name", "").strip() or data.get("title", "").strip()
            if not entity_name:
                logger.warning(f"Skipping entity with no name: {entity_data}")
                return None
            data[name_field] = entity_name

        # Check for existing entity with the same name (deduplication)
        model = ENTITY_MODEL_MAP[entity_type]
        name_col = getattr(model, name_field)
        existing = await self.db.execute(
            select(model).where(func.lower(name_col) == entity_name.lower())
        )
        existing_entity = existing.scalar_one_or_none()

        if existing_entity:
            action = "matched"
            entity_id = existing_entity.id
        else:
            # Filter data to only include valid model columns
            valid_fields = {c.name for c in model.__table__.columns} - {"id", "created_at", "updated_at"}
            clean_data = {}
            for k, v in data.items():
                if k in valid_fields and v is not None:
                    col = model.__table__.columns[k]
                    # If column is an Enum, validate the value
                    if hasattr(col.type, 'enums'):
                        valid_enums = col.type.enums
                        if v not in valid_enums:
                            logger.warning(f"Invalid enum value '{v}' for {model.__name__}.{k}. Expected one of {valid_enums}. Skipping field.")
                            continue
                    clean_data[k] = v

            new_entity = model(**clean_data)
            self.db.add(new_entity)
            await self.db.flush()
            await self.db.refresh(new_entity)
            entity_id = new_entity.id
            action = "created"

        # Record the extraction (evidence chain)
        extraction = Extraction(
            source_id=source_id,
            entity_type=entity_type,
            entity_id=entity_id,
            confidence=confidence,
            evidence_text=evidence[:2000] if evidence else None,
        )
        self.db.add(extraction)
        await self.db.flush()

        return {
            "key": f"{entity_type}:{entity_name.lower()}",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "name": entity_name,
            "confidence": confidence,
            "action": action,
        }

    async def _create_relationship(
        self,
        rel_data: dict,
        entity_map: dict[str, dict],
        source_id: uuid.UUID,
    ) -> bool:
        """Create a relationship between two extracted entities.

        Returns True if created, False if skipped.
        """
        source_name = rel_data.get("source_name", "").strip().lower()
        source_type = rel_data.get("source_type", "").strip().lower()
        target_name = rel_data.get("target_name", "").strip().lower()
        target_type = rel_data.get("target_type", "").strip().lower()
        rel_type = rel_data.get("relationship_type", "").strip().lower()
        confidence = rel_data.get("confidence", 0.5)
        evidence = rel_data.get("evidence", "")

        if not all([source_name, source_type, target_name, target_type, rel_type]):
            return False

        # Look up entities from our extraction map
        source_key = f"{source_type}:{source_name}"
        target_key = f"{target_type}:{target_name}"

        source_info = entity_map.get(source_key)
        target_info = entity_map.get(target_key)

        if not source_info or not target_info:
            # Try to find by querying the DB directly
            if not source_info:
                source_info = await self._find_entity_by_name(source_type, source_name)
            if not target_info:
                target_info = await self._find_entity_by_name(target_type, target_name)

        if not source_info or not target_info:
            logger.warning(
                f"Skipping relationship: could not resolve "
                f"'{source_name}' ({source_type}) or '{target_name}' ({target_type})"
            )
            return False

        # Check for duplicate relationship
        existing = await self.db.execute(
            select(Relationship).where(
                Relationship.source_type == source_info["entity_type"],
                Relationship.source_id == source_info["entity_id"],
                Relationship.relationship_type == rel_type,
                Relationship.target_type == target_info["entity_type"],
                Relationship.target_id == target_info["entity_id"],
            )
        )
        if existing.scalar_one_or_none():
            return False

        # Create the relationship
        relationship = Relationship(
            source_type=source_info["entity_type"],
            source_id=source_info["entity_id"],
            relationship_type=rel_type,
            target_type=target_info["entity_type"],
            target_id=target_info["entity_id"],
        )
        self.db.add(relationship)
        await self.db.flush()
        await self.db.refresh(relationship)

        # Record extraction evidence for the relationship
        extraction = Extraction(
            source_id=source_id,
            entity_type=source_info["entity_type"],
            entity_id=source_info["entity_id"],
            relationship_id=relationship.id,
            confidence=confidence,
            evidence_text=evidence[:2000] if evidence else None,
        )
        self.db.add(extraction)
        await self.db.flush()

        return True

    async def _find_entity_by_name(
        self, entity_type: str, name: str
    ) -> dict[str, Any] | None:
        """Try to find an entity by name in the DB."""
        if entity_type not in ENTITY_MODEL_MAP:
            return None

        model = ENTITY_MODEL_MAP[entity_type]
        name_field = ENTITY_NAME_FIELD[entity_type]
        name_col = getattr(model, name_field)

        result = await self.db.execute(
            select(model).where(func.lower(name_col) == name.lower())
        )
        entity = result.scalar_one_or_none()
        if entity:
            return {
                "entity_type": entity_type,
                "entity_id": entity.id,
                "name": getattr(entity, name_field),
            }
        return None
