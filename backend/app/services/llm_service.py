from openai import OpenAI
import os
from dotenv import load_dotenv
from app.utils.categories import ALLOWED_CATEGORIES

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_ticket_fields(message):
    categories_str = "\n".join(f"  - {cat}" for cat in ALLOWED_CATEGORIES)

    prompt = f"""
You are an intelligent information extraction assistant.

The following message was extracted from an image using OCR. 
OCR text may contain:
- spelling mistakes
- broken words
- missing punctuation
- random line breaks
- extra symbols
- partially recognized names, emails, or phone numbers
- messy formatting

Your job is to carefully understand the meaning of the text and reconstruct the correct information.

If the OCR text is messy, try to intelligently infer the correct values based on context.

Extract ticket information from the message below.

If the message contains multiple distinct issues or requests, extract EACH as a separate ticket.

Fields for each ticket:
- name
- email
- phone
- issue (a short and clear description of the problem)
- category (MUST be exactly one of the allowed categories listed below)

ALLOWED CATEGORIES (pick the single best match):
{categories_str}

IMPORTANT RULES:
- The "category" field MUST be exactly one value from the allowed list.
- Do NOT invent new categories.
- If text is messy because of OCR errors, interpret it intelligently.
- Correct obvious OCR spelling mistakes when extracting fields.
- If multiple issues exist, create multiple ticket objects.
- If a field cannot be determined confidently, set its value to null.

Return ONLY valid JSON in the following format:

{{
  "tickets": [
    {{
      "name": "...",
      "email": "...",
      "phone": "...",
      "issue": "...",
      "category": "..."
    }}
  ]
}}

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