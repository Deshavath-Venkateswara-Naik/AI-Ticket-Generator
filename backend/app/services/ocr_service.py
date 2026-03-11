from paddleocr import PaddleOCR
from PIL import Image
import numpy as np
import io

# Lazy-loaded PaddleOCR instance
_ocr = None


def _get_ocr():
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr


def extract_text_from_image(image_bytes: bytes) -> str:
    """Run PaddleOCR on raw image bytes and return the extracted text."""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")

    img_array = np.array(image)
    ocr = _get_ocr()
    result = ocr.ocr(img_array, cls=True)

    # result is a list of pages; each page is a list of line results
    # each line result is [bbox, (text, confidence)]
    lines = []
    if result and result[0]:
        # Sort by vertical position (top-left y) for reading order
        sorted_results = sorted(result[0], key=lambda x: x[0][0][1])
        for line in sorted_results:
            text = line[1][0]
            if text.strip():
                lines.append(text.strip())

    return "\n".join(lines)


def split_into_tickets(text: str) -> list[str]:
    """Split OCR text into individual ticket blocks.

    Heuristics:
    - Split on blank-line-separated blocks (double newline).
    - If only one block, treat the whole text as a single ticket.
    - Filter out very short noise fragments (< 15 chars).
    """
    blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
    # Filter noise
    blocks = [b for b in blocks if len(b) >= 15]
    if not blocks:
        return [text.strip()] if text.strip() else []
    return blocks
