"""Company Knowledge Copilot service — uses operational memory & LLM to answer questions with evidence."""

import logging
import json
from typing import Any
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.extraction import Extraction
from app.models.source import Source
from app.models.relationship import Relationship
from app.repositories.entity_repo import EntityRepository, ENTITY_MODEL_MAP, ENTITY_NAME_FIELD
from app.services.llm_service import LLMService
from app.config import get_settings

logger = logging.getLogger(__name__)

COPILOT_PROMPT = """You are the Company Knowledge Copilot — an AI assistant that understands how a company works based strictly on its operational memory.

USER QUESTION:
"{question}"

OPERATIONAL MEMORY CONTEXT:
---
{context}
---

INSTRUCTIONS:
1. Answer the question clearly, concisely, and accurately based ONLY on the operational memory context provided above.
2. Every main fact in your answer MUST be backed by evidence from the context.
3. If the operational memory does not contain enough context to answer, state clearly what is known and what is missing.
4. Estimate an overall confidence score (0.0 to 1.0) for your answer.
5. Extract the specific evidence items (source document name, quote, confidence) used to formulate the answer.
6. Return ONLY a valid JSON object in this exact schema:

{{
  "answer": "Clear concise answer explaining who handles what, why a decision was made, status of a project, etc.",
  "confidence": 0.94,
  "evidence": [
    {{
      "source_name": "Slack discussion or Document name",
      "source_type": "message|document|text_paste",
      "quote": "Exact snippet quote from context",
      "confidence": 0.94
    }}
  ],
  "mentioned_entities": [
    {{
      "type": "people|projects|decisions|tasks|processes|events|documents|workflows",
      "id": "uuid string if known, else null",
      "name": "Entity Name"
    }}
  ]
}}

Return ONLY the JSON object. No extra text."""


class CopilotService:
    """Service handling company knowledge copilot natural language Q&A."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.entity_repo = EntityRepository(db)
        self.llm = LLMService()

    async def answer_question(self, question: str) -> dict[str, Any]:
        """Answer a natural language question using company operational memory and LLM."""
        if not question or not question.strip():
            return {
                "answer": "Please ask a question about your company's people, decisions, projects, or processes.",
                "confidence": 0.0,
                "evidence": [],
                "mentioned_entities": [],
            }

        # 1. Retrieve relevant operational context from database
        context_items, evidence_records, entity_map = await self._retrieve_context(question)

        # 2. Format context text
        context_str = self._format_context_string(context_items)

        # 3. Call LLM to synthesize answer
        try:
            available, _ = await self.llm.is_available()
            if available and context_items:
                prompt = COPILOT_PROMPT.format(
                    question=question.strip(),
                    context=context_str if context_str else "No explicit extractions found in DB.",
                )

                client = self.llm._get_client()
                response = client.models.generate_content(
                    model=self.llm.model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.1,
                        "response_mime_type": "application/json",
                    },
                )
                parsed = self.llm._parse_json_response(response.text)

                if parsed and "answer" in parsed:
                    # Enrich mentioned entities with real IDs if matching entity_map
                    enriched_entities = []
                    for me in parsed.get("mentioned_entities", []):
                        ent_name = me.get("name", "").strip().lower()
                        ent_type = me.get("type", "").strip().lower()
                        found = entity_map.get((ent_type, ent_name))
                        if found:
                            enriched_entities.append({
                                "type": ent_type,
                                "id": str(found["id"]),
                                "name": found["name"],
                            })
                        else:
                            enriched_entities.append(me)

                    return {
                        "answer": parsed["answer"],
                        "confidence": float(parsed.get("confidence", 0.9)),
                        "evidence": parsed.get("evidence", evidence_records[:3]),
                        "mentioned_entities": enriched_entities,
                    }

        except Exception as e:
            logger.warning(f"LLM generation failed, using rule-based operational memory fallback: {e}")

        # 4. Fallback synthesis directly from DB extractions & relationships if LLM is offline/rate limited
        return self._synthesize_fallback_answer(question, context_items, evidence_records, entity_map)

    async def _retrieve_context(
        self, question: str
    ) -> tuple[list[dict], list[dict], dict[tuple[str, str], dict]]:
        """Retrieve relevant extractions, relationships, and entities for a question."""
        terms = [t.lower() for t in question.split() if len(t) > 2]

        stmt = select(Extraction, Source).join(Source, Extraction.source_id == Source.id)
        if terms:
            or_conditions = []
            for term in terms[:5]:
                or_conditions.append(Extraction.evidence_text.ilike(f"%{term}%"))
                or_conditions.append(Source.filename.ilike(f"%{term}%"))
                or_conditions.append(Source.raw_text.ilike(f"%{term}%"))
            stmt = stmt.where(or_(*or_conditions))

        stmt = stmt.order_by(Extraction.confidence.desc()).limit(15)
        res = await self.db.execute(stmt)
        rows = res.all()

        # Batch fetch entity names & map
        entity_refs = [(ex.entity_type, ex.entity_id) for ex, _ in rows]
        names_map = await self.entity_repo.get_entity_names_batch(entity_refs)

        entity_name_lookup: dict[tuple[str, str], dict] = {}
        for (etype, eid), name in names_map.items():
            entity_name_lookup[(etype, name.lower())] = {"type": etype, "id": eid, "name": name}

        context_items = []
        evidence_records = []

        for ex, source in rows:
            ename = names_map.get((ex.entity_type, ex.entity_id)) or "Unknown Entity"
            context_items.append({
                "entity_type": ex.entity_type,
                "entity_name": ename,
                "confidence": ex.confidence,
                "evidence_text": ex.evidence_text,
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
            })
            evidence_records.append({
                "source_name": source.filename,
                "source_type": source.source_type.value if hasattr(source.source_type, "value") else str(source.source_type),
                "quote": ex.evidence_text or "Recorded operational fact",
                "confidence": ex.confidence,
            })

        return context_items, evidence_records, entity_name_lookup

    @staticmethod
    def _format_context_string(context_items: list[dict]) -> str:
        """Format list of retrieved context items into prompt text."""
        lines = []
        for item in context_items:
            lines.append(
                f"- Entity: {item['entity_name']} ({item['entity_type']})\n"
                f"  Evidence Quote: \"{item['evidence_text']}\"\n"
                f"  Source: {item['source_name']} (Confidence: {int(item['confidence']*100)}%)"
            )
        return "\n".join(lines)

    @staticmethod
    def _synthesize_fallback_answer(
        question: str,
        context_items: list[dict],
        evidence_records: list[dict],
        entity_map: dict,
    ) -> dict[str, Any]:
        """Build structured response directly from database facts when LLM is unavailable."""
        if not context_items:
            return {
                "answer": f"I searched the company's operational memory for '{question}', but did not find direct evidence matching your query. Try ingesting relevant documents or messages first.",
                "confidence": 0.2,
                "evidence": [],
                "mentioned_entities": [],
            }

        top = context_items[0]
        answer = f"Based on operational memory records in {top['source_name']}, {top['entity_name']} ({top['entity_type']}) is directly associated with this request: \"{top['evidence_text']}\"."

        mentioned = []
        for item in context_items[:3]:
            found = entity_map.get((item["entity_type"], item["entity_name"].lower()))
            if found:
                mentioned.append(found)

        return {
            "answer": answer,
            "confidence": top["confidence"],
            "evidence": evidence_records[:3],
            "mentioned_entities": mentioned,
        }

    async def get_suggestions(self) -> list[dict[str, str]]:
        """Return categorized example questions for company copilot UI."""
        return [
            {
                "category": "People",
                "question": "Who handles client onboarding?",
                "description": "Find responsibility owners and assigned managers",
            },
            {
                "category": "Decisions",
                "question": "Why did we choose React?",
                "description": "Understand architectural decisions and rationale",
            },
            {
                "category": "Processes",
                "question": "What happens after a customer complaint?",
                "description": "Discover standard operating procedures and workflows",
            },
            {
                "category": "Projects",
                "question": "What's the current status of Project X?",
                "description": "Track active initiatives, timelines, and owners",
            },
            {
                "category": "Historical Knowledge",
                "question": "Have we faced this issue before?",
                "description": "Search past cases, incident records, and solutions",
            },
        ]
