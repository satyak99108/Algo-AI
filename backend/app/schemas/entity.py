from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime, date
from typing import Any


# --- Base Entity Schema ---

class EntityBase(BaseModel):
    """Base response schema for all entities."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Person ---

class PersonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    role: str | None = None
    department: str | None = None
    email: str | None = None
    status: str = "active"


class PersonUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    department: str | None = None
    email: str | None = None
    status: str | None = None


class PersonResponse(EntityBase):
    name: str
    role: str | None = None
    department: str | None = None
    email: str | None = None
    status: str


# --- Project ---

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: str = "active"
    start_date: date | None = None
    end_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectResponse(EntityBase):
    name: str
    description: str | None = None
    status: str
    start_date: date | None = None
    end_date: date | None = None


# --- Decision ---

class DecisionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    rationale: str | None = None
    made_at: datetime | None = None
    impact: str | None = None


class DecisionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    rationale: str | None = None
    made_at: datetime | None = None
    impact: str | None = None


class DecisionResponse(EntityBase):
    title: str
    description: str | None = None
    rationale: str | None = None
    made_at: datetime | None = None
    impact: str | None = None


# --- Task ---

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: str = "pending"
    priority: str = "medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: date | None = None


class TaskResponse(EntityBase):
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: date | None = None


# --- Process ---

class ProcessCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    steps: list[dict[str, Any]] | None = None


class ProcessUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    steps: list[dict[str, Any]] | None = None


class ProcessResponse(EntityBase):
    name: str
    description: str | None = None
    steps: list[dict[str, Any]] | None = None


# --- Event ---

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    event_type: str | None = None
    occurred_at: datetime | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: str | None = None
    occurred_at: datetime | None = None


class EventResponse(EntityBase):
    title: str
    description: str | None = None
    event_type: str | None = None
    occurred_at: datetime | None = None


# --- Document ---

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str | None = None
    doc_type: str = "other"
    source: str | None = None
    file_path: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    doc_type: str | None = None
    source: str | None = None
    file_path: str | None = None


class DocumentResponse(EntityBase):
    title: str
    content: str | None = None
    doc_type: str
    source: str | None = None
    file_path: str | None = None


# --- Workflow ---

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    trigger: str | None = None
    steps: list[dict[str, Any]] | None = None


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    trigger: str | None = None
    steps: list[dict[str, Any]] | None = None


class WorkflowResponse(EntityBase):
    name: str
    description: str | None = None
    trigger: str | None = None
    steps: list[dict[str, Any]] | None = None


# --- Entity with Relationships ---

class RelatedEntity(BaseModel):
    """A related entity reference shown on detail pages."""

    id: UUID
    entity_type: str
    name: str
    relationship_type: str
    direction: str  # "outgoing" or "incoming"

    model_config = {"from_attributes": True}


class EntityDetailResponse(BaseModel):
    """Entity detail with its relationships."""

    entity: dict[str, Any]
    entity_type: str
    relationships: list[RelatedEntity] = []


# --- Schema Registry ---
# Maps entity type strings to their schema classes for dynamic routing

ENTITY_SCHEMAS = {
    "people": {
        "create": PersonCreate,
        "update": PersonUpdate,
        "response": PersonResponse,
        "name_field": "name",
    },
    "projects": {
        "create": ProjectCreate,
        "update": ProjectUpdate,
        "response": ProjectResponse,
        "name_field": "name",
    },
    "decisions": {
        "create": DecisionCreate,
        "update": DecisionUpdate,
        "response": DecisionResponse,
        "name_field": "title",
    },
    "tasks": {
        "create": TaskCreate,
        "update": TaskUpdate,
        "response": TaskResponse,
        "name_field": "title",
    },
    "processes": {
        "create": ProcessCreate,
        "update": ProcessUpdate,
        "response": ProcessResponse,
        "name_field": "name",
    },
    "events": {
        "create": EventCreate,
        "update": EventUpdate,
        "response": EventResponse,
        "name_field": "title",
    },
    "documents": {
        "create": DocumentCreate,
        "update": DocumentUpdate,
        "response": DocumentResponse,
        "name_field": "title",
    },
    "workflows": {
        "create": WorkflowCreate,
        "update": WorkflowUpdate,
        "response": WorkflowResponse,
        "name_field": "name",
    },
}
