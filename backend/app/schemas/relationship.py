from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Any


class RelationshipCreate(BaseModel):
    """Schema for creating a new relationship."""

    source_type: str = Field(..., description="Source entity type (e.g., 'people')")
    source_id: UUID = Field(..., description="Source entity UUID")
    relationship_type: str = Field(
        ..., description="Relationship type (e.g., 'owns', 'made', 'affects')"
    )
    target_type: str = Field(..., description="Target entity type (e.g., 'projects')")
    target_id: UUID = Field(..., description="Target entity UUID")
    metadata: dict[str, Any] | None = None


class RelationshipResponse(BaseModel):
    """Schema for relationship in API responses."""

    id: UUID
    source_type: str
    source_id: UUID
    relationship_type: str
    target_type: str
    target_id: UUID
    metadata: dict[str, Any] | None = None
    created_at: datetime

    # Enriched fields (populated by service layer)
    source_name: str | None = None
    target_name: str | None = None

    model_config = {"from_attributes": True}


class GraphNode(BaseModel):
    """A node in the knowledge graph (for React Flow)."""

    id: str
    type: str  # entity type
    data: dict[str, Any]
    position: dict[str, float] | None = None


class GraphEdge(BaseModel):
    """An edge in the knowledge graph (for React Flow)."""

    id: str
    source: str
    target: str
    label: str
    data: dict[str, Any] | None = None


class GraphResponse(BaseModel):
    """Full knowledge graph data for React Flow rendering."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]
