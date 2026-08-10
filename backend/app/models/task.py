from sqlalchemy import String, Text, Date, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

import enum


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Task(BaseModel):
    """Represents a task in the organization."""

    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="task_status", create_constraint=False),
        default=TaskStatus.pending,
        server_default="pending",
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="task_priority", create_constraint=False),
        default=TaskPriority.medium,
        server_default="medium",
    )
    due_date: Mapped[str | None] = mapped_column(Date)
