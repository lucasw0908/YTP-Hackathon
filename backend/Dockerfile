FROM python:3.12-slim-trixie

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    ca-certificates \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
ENV UV_NO_DEV=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --locked

COPY . .

RUN uv pip install --no-cache-dir gunicorn

CMD ["uv", "run", "gunicorn", "-t", "120", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8080", "main:app"]