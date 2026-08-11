#!/usr/bin/env bash
# ==============================================================================
# TeioOS Database Backup Script
# ==============================================================================
# Takes a timestamped PostgreSQL database dump from the running teioos-db
# container without interrupting active application services.
#
# Output Format: Compressed plain SQL (.sql.gz) with --clean --if-exists
# Storage Location: backups/teioos_backup_YYYYMMDD_HHMMSS.sql.gz
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment configuration if available
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        # Ignore comments and empty lines
        [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
        # Strip surrounding quotes if present
        value="$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
        export "$key=$value"
    done < "$PROJECT_ROOT/.env"
fi

POSTGRES_DB="${POSTGRES_DB:-teioos}"
POSTGRES_USER="${POSTGRES_USER:-teioos_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="$BACKUP_DIR/teioos_backup_${TIMESTAMP}.sql.gz"

echo "[INFO] Creating database backup for database '$POSTGRES_DB'..."

# Execute pg_dump inside running db container with --clean --if-exists for seamless restoration
docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T \
    -e PGPASSWORD="$POSTGRES_PASSWORD" \
    db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
    | gzip > "$BACKUP_FILE"

if [[ -f "$BACKUP_FILE" && -s "$BACKUP_FILE" ]]; then
    SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
    echo "[SUCCESS] Backup completed successfully."
    echo "  File: $BACKUP_FILE"
    echo "  Size: $SIZE"
else
    echo "[ERROR] Backup failed or generated an empty file." >&2
    exit 1
fi
