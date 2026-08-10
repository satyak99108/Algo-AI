from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

import datetime as dt


class Event(BaseModel):
    """Represents an event that occurred in the organization."""

    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    event_type: Mapped[str | None] = mapped_column(String(100))
    occurred_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
