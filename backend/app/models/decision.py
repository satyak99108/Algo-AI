from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

import datetime as dt


class Decision(BaseModel):
    """Represents a decision made within the organization."""

    __tablename__ = "decisions"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    rationale: Mapped[str | None] = mapped_column(Text)
    made_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    impact: Mapped[str | None] = mapped_column(String(50))
