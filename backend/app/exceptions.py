from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class EntityNotFoundError(Exception):
    """Raised when an entity is not found."""

    def __init__(self, entity_type: str, entity_id: str):
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.message = f"{entity_type} with id '{entity_id}' not found"
        super().__init__(self.message)


class InvalidEntityTypeError(Exception):
    """Raised when an invalid entity type is provided."""

    def __init__(self, entity_type: str):
        self.entity_type = entity_type
        self.message = f"Invalid entity type: '{entity_type}'"
        super().__init__(self.message)


class DuplicateRelationshipError(Exception):
    """Raised when a duplicate relationship is detected."""

    def __init__(self, message: str = "Relationship already exists"):
        self.message = message
        super().__init__(self.message)


class ValidationError(Exception):
    """Raised for business logic validation failures."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


# --- Exception Handlers ---

async def entity_not_found_handler(request: Request, exc: EntityNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": exc.message,
            "entity_type": exc.entity_type,
            "entity_id": exc.entity_id,
        },
    )


async def invalid_entity_type_handler(request: Request, exc: InvalidEntityTypeError):
    return JSONResponse(
        status_code=400,
        content={
            "error": "invalid_entity_type",
            "message": exc.message,
            "entity_type": exc.entity_type,
        },
    )


async def duplicate_relationship_handler(
    request: Request, exc: DuplicateRelationshipError
):
    return JSONResponse(
        status_code=409,
        content={
            "error": "duplicate_relationship",
            "message": exc.message,
        },
    )


async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": exc.message,
        },
    )


# Map of exception classes to their handlers
exception_handlers = {
    EntityNotFoundError: entity_not_found_handler,
    InvalidEntityTypeError: invalid_entity_type_handler,
    DuplicateRelationshipError: duplicate_relationship_handler,
    ValidationError: validation_error_handler,
}
