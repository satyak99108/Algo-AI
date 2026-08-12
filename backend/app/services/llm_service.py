"""Wrapper around the Google Generative AI SDK (Gemini Flash)."""

import asyncio
import json
import logging
import re
import json_repair

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

# The structured prompt for entity/relationship extraction
EXTRACTION_PROMPT = """You are an AI that extracts structured company/organizational knowledge from text.

Given the following text, extract ALL entities and relationships you can find.

Entity types to look for:
- people: Individuals mentioned (fields: name, role, department, email, status)
- projects: Projects, initiatives, products (fields: name, description, status)
- decisions: Decisions that were made (fields: title, description, rationale, impact)
- tasks: Tasks or action items (fields: title, description, status, priority)
- processes: Business processes or procedures (fields: name, description)
- events: Events that occurred or are planned (fields: title, description, event_type)
- documents: Documents referenced (fields: title, content, doc_type, source)
- workflows: Workflows or sequences of steps (fields: name, description, trigger)

Relationship types to look for:
- owns (Person → Project/Task)
- made (Person → Decision)
- affects (Decision → Project)
- triggers (Event → Workflow)
- creates (Workflow → Task)
- assigned_to (Task → Person)
- participates_in (Person → Project/Event)
- depends_on (Task → Task, Project → Project)
- documents (Document → Project/Process/Decision)
- follows (Process/Workflow step ordering)

Rules:
1. Extract ONLY facts explicitly stated or strongly implied in the text.
2. For each entity, fill in as many fields as the text provides. Use null for unknown fields.
3. Assign a confidence score (0.0 to 1.0) based on how explicitly the information is stated.
4. Keep "evidence" brief (under 150 characters).
5. For relationships, use the entity names to link them.

Return ONLY valid JSON (no markdown, no explanation) in this exact schema:
{
  "entities": [
    {
      "type": "people|projects|decisions|tasks|processes|events|documents|workflows",
      "data": { ... fields for this entity type ... },
      "confidence": 0.0,
      "evidence": "brief quote from the text"
    }
  ],
  "relationships": [
    {
      "source_name": "entity name",
      "source_type": "people|projects|...",
      "relationship_type": "owns|made|affects|...",
      "target_name": "entity name",
      "target_type": "people|projects|...",
      "confidence": 0.0,
      "evidence": "brief quote from the text"
    }
  ]
}

TEXT TO ANALYZE:
---
{text}
---

Return ONLY the JSON object. No other text."""


class LLMService:
    """Async wrapper around Google Gemini for knowledge extraction."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        self._client = None

    def _get_client(self) -> genai.Client:
        """Lazily create the Gemini client."""
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def is_available(self) -> tuple[bool, str]:
        """Check if the Gemini API is configured.
        
        NOTE: This no longer makes a real API call to avoid burning
        free-tier quota on health checks. It only verifies the key is set.
        """
        if not self.api_key:
            return False, "GEMINI_API_KEY is not set in environment variables"

        return True, f"Gemini ({self.model_name}) is configured"

    async def extract_knowledge(self, text: str) -> dict:
        """Send text to Gemini and extract structured entities/relationships.

        Args:
            text: The raw text to analyze.

        Returns:
            Parsed JSON dict with 'entities' and 'relationships' keys.

        Raises:
            ValueError: If the API key is not set.
            RuntimeError: If the LLM response cannot be parsed.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        # Truncate very long texts to avoid hitting token limits
        max_chars = 30000
        if len(text) > max_chars:
            text = text[:max_chars] + "\n\n[... text truncated ...]"

        prompt = EXTRACTION_PROMPT.replace("{text}", text)

        max_retries = 3
        for attempt in range(max_retries):
            try:
                client = self._get_client()
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=8192,
                        temperature=0.1,  # Low temperature for consistent structured output
                        response_mime_type="application/json",
                    ),
                )

                raw_text = response.text.strip()
                logger.info(f"Gemini raw response length: {len(raw_text)} chars")

                # Parse JSON from response
                result = self._parse_json_response(raw_text)
                return result

            except Exception as e:
                error_str = str(e)
                # Retry on rate limit errors
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 10  # 10s, 20s, 30s
                        logger.warning(
                            f"Rate limited (attempt {attempt + 1}/{max_retries}), "
                            f"retrying in {wait_time}s..."
                        )
                        await asyncio.sleep(wait_time)
                        continue
                logger.error(f"Gemini extraction failed: {e}")
                raise RuntimeError(f"AI extraction failed: {error_str}")

    @staticmethod
    def _parse_json_response(text: str) -> dict:
        """Parse JSON from the LLM response, using json_repair for robustness."""
        try:
            parsed = json_repair.repair_json(text, return_objects=True)
            if isinstance(parsed, dict) and ("entities" in parsed or "relationships" in parsed):
                if "entities" not in parsed:
                    parsed["entities"] = []
                if "relationships" not in parsed:
                    parsed["relationships"] = []
                return parsed
        except Exception as e:
            logger.warning(f"json_repair failed: {e}")

        # Fallback: try standard json.loads
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        logger.warning(f"Could not parse LLM response as JSON (len={len(text)}). First 200: {text[:200]!r}")
        return {"entities": [], "relationships": []}
