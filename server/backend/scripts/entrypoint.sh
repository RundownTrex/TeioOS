#!/usr/bin/env bash
set -eo pipefail

echo "[INFO] Running database migrations with Alembic..."
alembic upgrade head
echo "[SUCCESS] Database migrations completed."

echo "[INFO] Seeding initial admin user if needed..."
python scripts/seed_admin.py || echo "[WARNING] Admin seeding completed or skipped."

echo "[INFO] Starting Uvicorn backend server..."
exec "$@"
