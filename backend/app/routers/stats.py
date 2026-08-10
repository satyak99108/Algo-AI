from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.entity_service import EntityService

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics (entity counts)."""
    service = EntityService(db)
    return await service.get_stats()
