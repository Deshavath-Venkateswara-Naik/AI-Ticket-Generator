from fastapi import APIRouter, UploadFile, File
from app.schemas.ticket_schema import MessageInput
from app.services.llm_service import extract_ticket_fields, transcribe_audio
from app.services.ocr_service import extract_text_from_image, split_into_tickets
from app.utils.categories import ALLOWED_CATEGORIES
import json
import re
import difflib
import os
import uuid
import shutil

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


def _process_ticket_text(text: str) -> dict:
    """Run LLM extraction on a single ticket text and validate the category."""
    raw = extract_ticket_fields(text)
    cleaned = _strip_markdown_fences(raw)
    result = json.loads(cleaned)
    result["category"] = _validate_category(result.get("category"))
    return result


@router.post("/generate-ticket")
def generate_ticket(data: MessageInput):
    return _process_ticket_text(data.message)


@router.post("/generate-tickets-from-image")
async def generate_tickets_from_image(file: UploadFile = File(...)):
    """Accept an image upload, run OCR, split into tickets, extract fields."""
    image_bytes = await file.read()

    # Step 1: OCR
    ocr_text = extract_text_from_image(image_bytes)

    # Step 2: Split into individual ticket blocks
    ticket_blocks = split_into_tickets(ocr_text)

    # Step 3: Extract fields from each block via the LLM
    tickets = []
    for block in ticket_blocks:
        try:
            ticket = _process_ticket_text(block)
            ticket["_source_text"] = block
            tickets.append(ticket)
        except Exception:
            tickets.append({
                "name": None,
                "email": None,
                "phone": None,
                "issue": block,
                "category": "platform_tech_issue",
                "_source_text": block,
                "_error": "Failed to parse this ticket block",
            })

    return {
        "ocr_text": ocr_text,
        "ticket_count": len(tickets),
        "tickets": tickets,
    }


@router.get("/categories")
def get_categories():
    return {"categories": ALLOWED_CATEGORIES}


@router.post("/generate-ticket-audio")
async def generate_ticket_audio(file: UploadFile = File(...)):
    """Transcribe audio file then extract ticket fields."""
    print(f"\n--- [ROUTER] POST /generate-ticket-audio received ---")
    print(f"Incoming file: {file.filename}, Content-Type: {file.content_type}")

    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] or ".webm"
    temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}{file_ext}")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        transcript = transcribe_audio(temp_file_path)
        ticket_data = _process_ticket_text(transcript)
        ticket_data["_transcript"] = transcript

        print(f"Success: Ticket generated from audio.")
        return ticket_data

    except Exception as e:
        print(f"Error in generate_ticket_audio: {e}")
        return {"error": str(e)}
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print(f"Cleaned up temp file: {temp_file_path}")