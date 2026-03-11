from openai import OpenAI
import os
from dotenv import load_dotenv
from app.utils.categories import ALLOWED_CATEGORIES

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_ticket_fields(message):

    categories_str = "\n".join(f"  - {cat}" for cat in ALLOWED_CATEGORIES)

    prompt = f"""
Extract ticket information from the following message.

Fields to extract:
- name
- email
- phone
- issue (a concise description of the problem)
- category (MUST be exactly one of the allowed categories listed below)

ALLOWED CATEGORIES (pick the single best match):
{categories_str}

IMPORTANT: The "category" field MUST be exactly one value from the list above.
Do NOT invent new categories. If unsure, pick the closest match.

Return valid JSON only, with keys: name, email, phone, issue, category.
If a field cannot be determined from the message, set its value to null.

Message:
{message}
"""

    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt
    )

    return response.output_text