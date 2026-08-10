from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Process(BaseModel):
    """Represents a business process in the organization."""

    __tablename__ = "processes"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    steps: Mapped[dict | None] = mapped_column(JSONB, default=list)
