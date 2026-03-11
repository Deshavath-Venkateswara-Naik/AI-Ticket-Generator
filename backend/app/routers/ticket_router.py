from fastapi import APIRouter
from app.schemas.ticket_schema import MessageInput
from app.services.llm_service import extract_ticket_fields
from app.utils.categories import ALLOWED_CATEGORIES
import json
import re
import difflib

router = APIRouter()


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from LLM output."""
    text = text.strip()
    # Remove opening fence like ```json or ```
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    # Remove closing fence
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _validate_category(category: str | None) -> str:
    """Ensure the category is one of the allowed values.
    Falls back to fuzzy matching, then to 'platform_tech_issue'."""
    if not category:
        return "platform_tech_issue"

    normalized = category.strip().lower().replace(" ", "_").replace("-", "_")

    if normalized in ALLOWED_CATEGORIES:
        return normalized

    # Fuzzy match – pick the closest allowed category
    matches = difflib.get_close_matches(normalized, ALLOWED_CATEGORIES, n=1, cutoff=0.4)
    if matches:
        return matches[0]

    return "platform_tech_issue"


@router.post("/generate-ticket")
def generate_ticket(data: MessageInput):
    raw = extract_ticket_fields(data.message)
    cleaned = _strip_markdown_fences(raw)
    result = json.loads(cleaned)
    result["category"] = _validate_category(result.get("category"))
    return result


@router.get("/categories")
def get_categories():
    return {"categories": ALLOWED_CATEGORIES}