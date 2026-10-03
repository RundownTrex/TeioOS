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

# Stage 2: Fetch the offline speech-to-text model (Vosk, small English, ~40 MB)
# Bundled into the image so dictation works on air-gapped exam networks without
# any manual setup by the administrator. The archive is checksum-verified.
FROM python:3.12-slim AS stt-model

COPY scripts/fetch_model.py /tmp/fetch_model.py
RUN python3 /tmp/fetch_model.py && rm /tmp/fetch_model.py

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

# Copy application source code
COPY . .

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
