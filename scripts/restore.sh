#!/usr/bin/env bash
# ==============================================================================
# TeioOS Database Restore Script
# ==============================================================================
# Restores a PostgreSQL database dump (.sql or .sql.gz) into the running
# teioos-db container.
#
# WARNING: Restoring is a DESTRUCTIVE operation that will drop and replace
# existing tables and data in the target database.
#
# Usage:
#   ./scripts/restore.sh <path-to-backup-file> [--yes]
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
BACKUP_FILE=""
AUTO_CONFIRM=false

for arg in "$@"; do
    case "$arg" in
        -y|--yes)
            AUTO_CONFIRM=true
            ;;
        *)
            if [[ -z "$BACKUP_FILE" ]]; then
                BACKUP_FILE="$arg"
            fi
            ;;
    esac
done

if [[ -z "$BACKUP_FILE" ]]; then
    echo "Usage: $0 <path-to-backup-file> [--yes]" >&2
    echo "Example: $0 backups/teioos_backup_20260811_120000.sql.gz" >&2
    exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "[ERROR] Backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

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

# Explicit confirmation step
if [[ "$AUTO_CONFIRM" != true ]]; then
    echo "=============================================================================="
    echo "                              WARNING: DESTRUCTIVE ACTION                    "
    echo "=============================================================================="
    echo "Restoring database backup:"
    echo "  Backup File: $BACKUP_FILE"
    echo "  Target Database: $POSTGRES_DB (Container: teioos-db)"
    echo ""
    echo "This operation will DROP and OVERWRITE existing database schema and data."
    echo "=============================================================================="
    read -r -p "Are you sure you want to proceed? (y/N): " CONFIRMATION
    if [[ "$CONFIRMATION" != "y" && "$CONFIRMATION" != "Y" && "$CONFIRMATION" != "yes" ]]; then
        echo "[ABORTED] Database restore operation cancelled by user."
        exit 0
    fi
fi

echo "[INFO] Restoring database '$POSTGRES_DB' from '$BACKUP_FILE'..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T \
        -e PGPASSWORD="$POSTGRES_PASSWORD" \
        db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null
else
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T \
        -e PGPASSWORD="$POSTGRES_PASSWORD" \
        db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_FILE" > /dev/null
fi

echo "[SUCCESS] Database restored successfully from '$BACKUP_FILE'."
