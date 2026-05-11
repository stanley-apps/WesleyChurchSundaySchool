import base64
import io
import os
import re
from typing import Any

import fitz
import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image


MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
SPARSE_TEXT_THRESHOLD = int(os.getenv("SPARSE_TEXT_THRESHOLD", "80"))
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")
RENDER_DPI = int(os.getenv("RENDER_DPI", "180"))


def parse_cors_origins() -> list[str]:
  raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
  return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="PDF to Markdown Service", version="1.0.0")
app.add_middleware(
  CORSMiddleware,
  allow_origins=parse_cors_origins(),
  allow_credentials=False,
  allow_methods=["GET", "POST", "OPTIONS"],
  allow_headers=["*"],
)


def clean_text(text: str) -> str:
  text = text.replace("\x00", "")
  text = re.sub(r"[ \t]+", " ", text)
  text = re.sub(r"\n{3,}", "\n\n", text)
  return text.strip()


def text_to_markdown(text: str) -> str:
  paragraphs = [clean_text(part) for part in re.split(r"\n\s*\n", text) if clean_text(part)]
  return "\n\n".join(paragraphs)


def render_page_to_image(page: fitz.Page) -> Image.Image:
  zoom = RENDER_DPI / 72
  pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
  return Image.open(io.BytesIO(pixmap.tobytes("png")))


def extract_images(page: fitz.Page, document: fitz.Document, page_number: int) -> list[str]:
  image_markdown: list[str] = []

  for image_index, image_info in enumerate(page.get_images(full=True), start=1):
    xref = image_info[0]
    try:
      image = document.extract_image(xref)
      image_bytes = image["image"]
      extension = image.get("ext", "png")
      encoded = base64.b64encode(image_bytes).decode("ascii")
      image_markdown.append(
        f"![Extracted image page {page_number}.{image_index}](data:image/{extension};base64,{encoded})"
      )
    except Exception:
      image_markdown.append(f"<!-- Could not extract image {page_number}.{image_index} -->")

  return image_markdown


def convert_pdf_to_markdown(pdf_bytes: bytes, filename: str) -> dict[str, Any]:
  try:
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
  except Exception as exc:
    raise HTTPException(status_code=400, detail=f"Could not open PDF: {exc}") from exc

  markdown_sections: list[str] = [f"# {filename}\n"]
  text_pages = 0
  ocr_pages = 0
  warnings: list[str] = []

  for page_index, page in enumerate(document, start=1):
    extracted_text = clean_text(page.get_text("text"))
    used_ocr = False

    if len(extracted_text) < SPARSE_TEXT_THRESHOLD:
      try:
        image = render_page_to_image(page)
        extracted_text = clean_text(pytesseract.image_to_string(image, lang=OCR_LANGUAGE))
        used_ocr = True
      except Exception as exc:
        warnings.append(f"Page {page_index}: OCR failed ({exc}).")

    if used_ocr:
      ocr_pages += 1
    elif extracted_text:
      text_pages += 1

    markdown_sections.append(f"\n\n## Page {page_index}\n")

    if extracted_text:
      markdown_sections.append(text_to_markdown(extracted_text))
    else:
      markdown_sections.append("_No readable text found on this page._")

    images = extract_images(page, document, page_index)
    if images:
      markdown_sections.append("\n\n### Images\n")
      markdown_sections.append("\n\n".join(images))

  return {
    "markdown": clean_text("\n".join(markdown_sections)) + "\n",
    "filename": filename,
    "page_count": document.page_count,
    "text_pages": text_pages,
    "ocr_pages": ocr_pages,
    "warnings": warnings,
  }


@app.get("/health")
def health() -> dict[str, str]:
  return {"status": "ok"}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> dict[str, Any]:
  if file.content_type != "application/pdf":
    raise HTTPException(status_code=400, detail="Only PDF files are supported.")

  pdf_bytes = await file.read()
  max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024

  if len(pdf_bytes) > max_bytes:
    raise HTTPException(status_code=413, detail=f"PDF must be {MAX_FILE_SIZE_MB} MB or smaller.")

  if not pdf_bytes:
    raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

  return convert_pdf_to_markdown(pdf_bytes, file.filename or "converted.pdf")
