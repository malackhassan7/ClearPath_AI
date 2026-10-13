# syntax=docker/dockerfile:1
FROM python:3.12-slim

ARG INSTALL_ML=0
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Optional OCR runtime, only when the ML extras are requested
RUN if [ "$INSTALL_ML" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends tesseract-ocr \
      && rm -rf /var/lib/apt/lists/*; \
    fi

# Dependencies first so this layer is cached until requirements change
COPY requirements.txt requirements-ml.txt ./
RUN if [ "$INSTALL_ML" = "1" ]; then pip install -r requirements-ml.txt; \
    else pip install -r requirements.txt; fi

COPY . .

# Run as non-root; uploads is a mounted volume
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app
USER app

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
