import uuid
import math
import random
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.entity_repo import EntityRepository, ENTITY_NAME_FIELD
from app.repositories.relationship_repo import RelationshipRepository
from app.schemas.relationship import (
    GraphNode,
    GraphEdge,
    GraphResponse,
    RelationshipResponse,
)
from app.exceptions import DuplicateRelationshipError, EntityNotFoundError


class GraphService:
    """Business logic for knowledge graph and relationship operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.entity_repo = EntityRepository(db)
        self.relationship_repo = RelationshipRepository(db)

    async def create_relationship(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a relationship with validation."""
        # Check for duplicates
        is_duplicate = await self.relationship_repo.check_duplicate(
            source_type=data["source_type"],
            source_id=data["source_id"],
            relationship_type=data["relationship_type"],
            target_type=data["target_type"],
            target_id=data["target_id"],
        )
        if is_duplicate:
            raise DuplicateRelationshipError()

        # Verify source entity exists
        source = await self.entity_repo.get_entity(
            data["source_type"], data["source_id"]
        )
        if source is None:
            raise EntityNotFoundError(data["source_type"], str(data["source_id"]))

        # Verify target entity exists
        target = await self.entity_repo.get_entity(
            data["target_type"], data["target_id"]
        )
        if target is None:
            raise EntityNotFoundError(data["target_type"], str(data["target_id"]))

        # Handle metadata field name mapping
        create_data = {
            "source_type": data["source_type"],
            "source_id": data["source_id"],
            "relationship_type": data["relationship_type"],
            "target_type": data["target_type"],
            "target_id": data["target_id"],
            "metadata_": data.get("metadata"),
        }

        rel = await self.relationship_repo.create(create_data)

        # Enrich with names
        source_name = await self.entity_repo.get_entity_name(
            rel.source_type, rel.source_id
        )
        target_name = await self.entity_repo.get_entity_name(
            rel.target_type, rel.target_id
        )

        return {
            "id": str(rel.id),
            "source_type": rel.source_type,
            "source_id": str(rel.source_id),
            "relationship_type": rel.relationship_type,
            "target_type": rel.target_type,
            "target_id": str(rel.target_id),
            "metadata": rel.metadata_,
            "created_at": rel.created_at.isoformat(),
            "source_name": source_name,
            "target_name": target_name,
        }

    async def delete_relationship(self, rel_id: uuid.UUID) -> bool:
        """Delete a relationship."""
        deleted = await self.relationship_repo.delete(rel_id)
        if not deleted:
            raise EntityNotFoundError("relationship", str(rel_id))
        return True

    async def list_relationships(
        self,
        source_type: str | None = None,
        source_id: uuid.UUID | None = None,
        target_type: str | None = None,
        target_id: uuid.UUID | None = None,
        relationship_type: str | None = None,
    ) -> list[dict[str, Any]]:
        """List relationships with optional filters, enriched with entity names."""
        relationships = await self.relationship_repo.list_relationships(
            source_type=source_type,
            source_id=source_id,
            target_type=target_type,
            target_id=target_id,
            relationship_type=relationship_type,
        )

        entity_refs = []
        for rel in relationships:
            entity_refs.append((rel.source_type, rel.source_id))
            entity_refs.append((rel.target_type, rel.target_id))

        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        results = []
        for rel in relationships:
            source_name = names_map.get((rel.source_type, rel.source_id))
            target_name = names_map.get((rel.target_type, rel.target_id))
            results.append({
                "id": str(rel.id),
                "source_type": rel.source_type,
                "source_id": str(rel.source_id),
                "relationship_type": rel.relationship_type,
                "target_type": rel.target_type,
                "target_id": str(rel.target_id),
                "metadata": rel.metadata_,
                "created_at": rel.created_at.isoformat(),
                "source_name": source_name,
                "target_name": target_name,
            })

        return results

    async def get_full_graph(self) -> GraphResponse:
        """Build the full knowledge graph for React Flow rendering."""
        # Fetch entities and relationships
        all_entities = await self.entity_repo.get_all_entities_for_graph()
        all_relationships = await self.relationship_repo.get_all_relationships()

        # Build nodes with circular layout
        nodes: list[GraphNode] = []
        entity_id_map: dict[str, str] = {}  # maps "type:uuid" -> node_id

        total_nodes = sum(len(entities) for entities in all_entities.values())
        node_index = 0

        for entity_type, entities in all_entities.items():
            name_field = ENTITY_NAME_FIELD[entity_type]
            for entity in entities:
                node_id = f"{entity_type}:{entity.id}"
                entity_id_map[node_id] = node_id

                # Circular layout positioning
                angle = (2 * math.pi * node_index) / max(total_nodes, 1)
                radius = 300 + (node_index % 3) * 100
                x = 500 + radius * math.cos(angle)
                y = 400 + radius * math.sin(angle)

                entity_name = getattr(entity, name_field, "Unknown")

                nodes.append(
                    GraphNode(
                        id=node_id,
                        type=entity_type,
                        data={
                            "label": entity_name,
                            "entityType": entity_type,
                            "entityId": str(entity.id),
                        },
                        position={"x": x, "y": y},
                    )
                )
                node_index += 1

        # Build edges
        edges: list[GraphEdge] = []
        for rel in all_relationships:
            source_node_id = f"{rel.source_type}:{rel.source_id}"
            target_node_id = f"{rel.target_type}:{rel.target_id}"

            # Only include edge if both nodes exist
            if source_node_id in entity_id_map and target_node_id in entity_id_map:
                edges.append(
                    GraphEdge(
                        id=str(rel.id),
                        source=source_node_id,
                        target=target_node_id,
                        label=rel.relationship_type,
                        data={
                            "relationshipType": rel.relationship_type,
                        },
                    )
                )

        return GraphResponse(nodes=nodes, edges=edges)

    async def get_neighbors(
        self, entity_type: str, entity_id: uuid.UUID
    ) -> GraphResponse:
        """Get subgraph around a specific entity (1-hop neighbors)."""
        relationships = await self.relationship_repo.get_entity_relationships(
            entity_type, entity_id
        )

        # Collect all entity references
        entity_refs: list[tuple[str, uuid.UUID]] = [(entity_type, entity_id)]
        for rel in relationships:
            entity_refs.append((rel.source_type, rel.source_id))
            entity_refs.append((rel.target_type, rel.target_id))

        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        # Build nodes
        nodes: list[GraphNode] = []
        node_index = 0
        unique_refs = list(set(entity_refs))
        total = len(unique_refs)

        for ref_type, ref_id in unique_refs:
            name = names_map.get((ref_type, ref_id))
            if name is None:
                continue

            angle = (2 * math.pi * node_index) / max(total, 1)
            radius = 200
            x = 400 + radius * math.cos(angle)
            y = 300 + radius * math.sin(angle)

            # Center the focal entity
            if ref_type == entity_type and ref_id == entity_id:
                x, y = 400, 300

            nodes.append(
                GraphNode(
                    id=f"{ref_type}:{ref_id}",
                    type=ref_type,
                    data={
                        "label": name,
                        "entityType": ref_type,
                        "entityId": str(ref_id),
                        "isFocal": ref_type == entity_type and ref_id == entity_id,
                    },
                    position={"x": x, "y": y},
                )
            )
            node_index += 1

        # Build edges
        edges: list[GraphEdge] = []
        for rel in relationships:
            edges.append(
                GraphEdge(
                    id=str(rel.id),
                    source=f"{rel.source_type}:{rel.source_id}",
                    target=f"{rel.target_type}:{rel.target_id}",
                    label=rel.relationship_type,
                )
            )

        return GraphResponse(nodes=nodes, edges=edges)
