"""Quick test to debug Gemini API response for extraction."""
import sys
import json
sys.path.insert(0, ".")

from app.config import get_settings
from google import genai
from google.genai import types

settings = get_settings()
print(f"API Key (first 10): {settings.gemini_api_key[:10]}...")
print(f"Model: {settings.gemini_model}")

client = genai.Client(api_key=settings.gemini_api_key)

# Test 1: Simple test
print("\n--- Test 1: Simple ping ---")
try:
    r = client.models.generate_content(
        model=settings.gemini_model,
        contents="Reply with only the word: OK",
        config=types.GenerateContentConfig(max_output_tokens=10, temperature=0.0),
    )
    print(f"Response text: {repr(r.text)}")
    print(f"Parts: {[p.thought for p in r.candidates[0].content.parts] if r.candidates else 'no candidates'}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: JSON extraction with response_mime_type
print("\n--- Test 2: JSON extraction ---")
test_text = "Sarah Jenkins is a Product Manager in the Product Department."
prompt = f"""Extract entities from this text as JSON:
{test_text}

Return JSON: {{"entities": [{{"type": "people", "data": {{"name": "...", "role": "..."}}, "confidence": 0.9}}]}}"""

try:
    r = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=2048,
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
    print(f"Response text: {repr(r.text[:500])}")
    print(f"Number of parts: {len(r.candidates[0].content.parts) if r.candidates else 0}")
    for i, part in enumerate(r.candidates[0].content.parts):
        print(f"  Part {i}: thought={part.thought}, text={repr(part.text[:200] if part.text else None)}")
    
    # Try to parse
    parsed = json.loads(r.text)
    print(f"Parsed JSON: {json.dumps(parsed, indent=2)[:500]}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Without response_mime_type
print("\n--- Test 3: Without response_mime_type ---")
try:
    r = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=2048,
            temperature=0.1,
        ),
    )
    print(f"Response text: {repr(r.text[:500])}")
    
    # Try to parse
    try:
        parsed = json.loads(r.text.strip())
        print(f"Direct parse OK: {len(parsed.get('entities', []))} entities")
    except json.JSONDecodeError:
        # Try extracting from code blocks
        import re
        matches = re.findall(r"```(?:json)?\s*\n?(.*?)\n?```", r.text, re.DOTALL)
        if matches:
            parsed = json.loads(matches[-1])
            print(f"Code block parse OK: {len(parsed.get('entities', []))} entities")
        else:
            print("Could not parse JSON from response")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
