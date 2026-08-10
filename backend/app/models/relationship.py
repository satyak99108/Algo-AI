import uuid

from sqlalchemy import String, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Relationship(BaseModel):
    """Represents a directed relationship (edge) between two entities in the knowledge graph."""

    __tablename__ = "relationships"

    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)

    __table_args__ = (
        # Indexes for efficient graph traversal
        Index("idx_rel_source", "source_type", "source_id"),
        Index("idx_rel_target", "target_type", "target_id"),
        Index("idx_rel_type", "relationship_type"),
        # Prevent duplicate edges
        UniqueConstraint(
            "source_type",
            "source_id",
            "relationship_type",
            "target_type",
            "target_id",
            name="uq_relationship_edge",
        ),
    )
