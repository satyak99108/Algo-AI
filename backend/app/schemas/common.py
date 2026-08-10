from pydantic import BaseModel, Field
from typing import Generic, TypeVar
from uuid import UUID
from datetime import datetime

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for paginated list endpoints."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: str | None = Field(default=None, description="Search query")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order: asc or desc")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class SuccessResponse(BaseModel):
    """Standard success response."""

    message: str
    success: bool = True


class StatsResponse(BaseModel):
    """Dashboard statistics."""

    people: int = 0
    projects: int = 0
    decisions: int = 0
    tasks: int = 0
    processes: int = 0
    events: int = 0
    documents: int = 0
    workflows: int = 0
    relationships: int = 0
    total_entities: int = 0
