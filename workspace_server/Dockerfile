FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl wget git jq vim nano \
    python3 python3-pip python3-venv python3-dev \
    build-essential unzip tar gzip ripgrep fd-find \
    sqlite3 libsqlite3-dev libssl-dev \
    ffmpeg imagemagick pandoc \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \
    requests httpx aiohttp \
    numpy pandas \
    pipreqs

COPY dist/workspace_server-*.whl /tmp/
RUN pip3 install /tmp/workspace_server-*.whl

RUN mkdir -p /workspace/data /workspace/files /tools
WORKDIR /workspace

VOLUME ["/workspace"]

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD curl -sf http://localhost:8080/api/v1/ws/health || exit 1

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
