from sqlalchemy import String, Text, Date, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.person import EntityStatus

import datetime as dt


class Project(BaseModel):
    """Represents a project in the organization."""

    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[EntityStatus] = mapped_column(
        SAEnum(EntityStatus, name="entity_status", create_constraint=False),
        default=EntityStatus.active,
        server_default="active",
    )
    start_date: Mapped[dt.date | None] = mapped_column(Date)
    end_date: Mapped[dt.date | None] = mapped_column(Date)
