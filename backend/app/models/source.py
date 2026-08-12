import enum

from sqlalchemy import String, Text, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SourceType(str, enum.Enum):
    document = "document"
    message = "message"
    text_paste = "text_paste"


class SourceStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Source(BaseModel):
    """Represents an ingested source (document, message, or pasted text)."""

    __tablename__ = "sources"

    filename: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, name="source_type_enum", create_constraint=False),
        nullable=False,
    )
    content_type: Mapped[str | None] = mapped_column(String(100))
    raw_text: Mapped[str | None] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[SourceStatus] = mapped_column(
        SAEnum(SourceStatus, name="source_status_enum", create_constraint=False),
        default=SourceStatus.pending,
        server_default="pending",
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    extracted_entities: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    __table_args__ = (
        Index("idx_source_status", "status"),
        Index("idx_source_type", "source_type"),
    )
