# Stage 1: Build dependencies and install wheels
FROM python:3.12-slim AS builder

WORKDIR /build

# Install compilation dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into temporary prefix directory
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Unpack the offline speech-to-text model (Vosk, small English, ~40 MB)
# The zip is checked into the build context so the model is baked into the image
# without a network download at build time.  Re-download only when upgrading the
# model by replacing vosk-model-small-en-us-0.15.zip in server/backend/.
FROM python:3.12-slim AS stt-model

COPY vosk-model-small-en-us-0.15.zip /tmp/vosk-model.zip
COPY scripts/fetch_model.py /tmp/fetch_model.py
# fetch_model.py consumes and deletes /tmp/vosk-model.zip itself, so only the
# script is left to clean up here.
RUN python3 /tmp/fetch_model.py && rm -f /tmp/fetch_model.py

# Stage 3: Minimal runtime image
FROM python:3.12-slim AS runner

WORKDIR /app

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Copy the offline speech recognition model (path matches STT_MODEL_PATH default)
COPY --from=stt-model /opt/vosk-model /opt/vosk-model

# Create non-root user and group
RUN groupadd -r teioos -g 10001 && \
    useradd -r -g teioos -u 10001 -d /app -s /sbin/nologin teioos

# Copy application source code. Paths are listed explicitly so the 41 MB Vosk
# model zip in the build context does not end up in the runtime image.
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY scripts/entrypoint.sh scripts/seed_admin.py ./scripts/

# Ensure entrypoint script is executable and set ownership
RUN chmod +x /app/scripts/entrypoint.sh && \
    chown -R teioos:teioos /app

# Switch to non-root user
USER teioos

# Expose backend server port
EXPOSE 8000

# Set entrypoint and default execution command
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
