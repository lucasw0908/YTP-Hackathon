FROM python:3.12-slim-trixie

COPY . /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
ENV UV_NO_DEV=1

WORKDIR /app
RUN uv sync --locked

# Start the app
CMD ["uv", "run", "fastapi", "run", "main.py", "--workers", "4"]