"""API endpoints for Company Knowledge Copilot (natural language Q&A)."""

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.copilot_service import CopilotService

router = APIRouter(prefix="/copilot", tags=["copilot"])


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural language question about company memory")


@router.post("/ask")
async def ask_copilot(
    body: AskQuestionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ask the Company Knowledge Copilot a question in natural language."""
    service = CopilotService(db)
    return await service.answer_question(body.question)


@router.get("/suggestions")
async def get_copilot_suggestions(
    db: AsyncSession = Depends(get_db),
):
    """Get categorized sample questions for copilot UI suggestions."""
    service = CopilotService(db)
    return await service.get_suggestions()
