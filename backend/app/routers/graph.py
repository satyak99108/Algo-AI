import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("")
async def get_full_graph(db: AsyncSession = Depends(get_db)):
    """Get the full knowledge graph data for React Flow visualization."""
    service = GraphService(db)
    return await service.get_full_graph()


@router.get("/neighbors/{entity_type}/{entity_id}")
async def get_neighbors(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get the subgraph around a specific entity (1-hop neighbors)."""
    service = GraphService(db)
    return await service.get_neighbors(entity_type, entity_id)
