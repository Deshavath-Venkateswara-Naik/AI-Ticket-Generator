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
    
    print("\n--- [BACKEND] Extracting Ticket Fields ---")
    print(f"Prompt length: {len(prompt)} characters")
    print(f"Extracting from message: {message[:100]}...")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts ticket information into JSON format."},
            {"role": "user", "content": prompt}
        ]
    )

    result = response.choices[0].message.content
    print("LLM Response received.")
    print(f"Raw Output: {result}")
    print("--- [BACKEND] Extraction Complete ---\n")
    return result


def transcribe_audio(audio_file_path: str) -> str:
    """Transcribe an audio file using OpenAI Whisper API."""
    print(f"\n--- [BACKEND] Transcribing Audio: {audio_file_path} ---")
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        print(f"Transcription result: {transcript.text[:100]}...")
        print("--- [BACKEND] Transcription Complete ---\n")
        return transcript.text
    except Exception as e:
        print(f"Transcription error: {e}")
        raise e