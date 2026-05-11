# PDF Markdown Service

FastAPI service used by the Lessons Hub PDF to Markdown tool.

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Tesseract must be installed locally for OCR:

```bash
brew install tesseract
```

## Docker Run

```bash
docker build -t pdf-markdown-service .
docker run --rm -p 8000:8000 -e CORS_ORIGINS=http://localhost:5174 pdf-markdown-service
```

## Render

Create a Render Web Service using this folder as the Docker build context.

Environment variables:

- `CORS_ORIGINS`: comma-separated allowed origins, for example `http://localhost:5174,https://your-netlify-site.netlify.app`
- `MAX_FILE_SIZE_MB`: default `25`
- `SPARSE_TEXT_THRESHOLD`: default `80`
- `OCR_LANGUAGE`: default `eng`
- `RENDER_DPI`: default `180`

Frontend environment variable:

- `VITE_PDF_MARKDOWN_API_URL`: Render service URL, for example `https://your-service.onrender.com`
