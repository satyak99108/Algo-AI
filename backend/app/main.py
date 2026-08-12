from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exceptions import exception_handlers
from app.routers import entities, relationships, graph, stats, ingestion

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    print(f"Starting {settings.app_name} ({settings.app_env})")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name}")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered operational memory that understands how a company works and helps execute its workflows.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
for exc_class, handler in exception_handlers.items():
    app.add_exception_handler(exc_class, handler)

# Register routers under /api/v1
app.include_router(entities.router, prefix="/api/v1")
app.include_router(relationships.router, prefix="/api/v1")
app.include_router(graph.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(ingestion.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check / root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
