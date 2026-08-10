from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Workflow(BaseModel):
    """Represents a workflow in the organization."""

    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    trigger: Mapped[str | None] = mapped_column(String(255))
    steps: Mapped[dict | None] = mapped_column(JSONB, default=list)
