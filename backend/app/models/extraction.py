import uuid

from sqlalchemy import String, Text, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Extraction(BaseModel):
    """Links a Source to the entities/relationships it produced — the evidence chain."""

    __tablename__ = "extractions"

    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    relationship_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    confidence: Mapped[float] = mapped_column(Float, default=0.0, server_default="0")
    evidence_text: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("idx_extraction_source", "source_id"),
        Index("idx_extraction_entity", "entity_type", "entity_id"),
    )
