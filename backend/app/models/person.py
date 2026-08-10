from sqlalchemy import String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

import enum


class EntityStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"


class Person(BaseModel):
    """Represents a person in the organization."""

    __tablename__ = "people"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str | None] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    status: Mapped[EntityStatus] = mapped_column(
        SAEnum(EntityStatus, name="entity_status", create_constraint=False),
        default=EntityStatus.active,
        server_default="active",
    )
