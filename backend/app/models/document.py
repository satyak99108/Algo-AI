from sqlalchemy import String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

import enum


class DocType(str, enum.Enum):
    pdf = "pdf"
    docx = "docx"
    txt = "txt"
    other = "other"


class Document(BaseModel):
    """Represents a document in the organization."""

    __tablename__ = "documents"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content: Mapped[str | None] = mapped_column(Text)
    doc_type: Mapped[DocType] = mapped_column(
        SAEnum(DocType, name="doc_type", create_constraint=False),
        default=DocType.other,
        server_default="other",
    )
    source: Mapped[str | None] = mapped_column(String(500))
    file_path: Mapped[str | None] = mapped_column(String(500))
