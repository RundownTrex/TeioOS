#!/usr/bin/env bash

# ==============================================================================
# TeioOS Linux Environment Automated Setup Script
# ==============================================================================
# Design and Development of TeioOS: An Accessible and Secure Linux-Based
# Operating System for Computer-Based Examinations
# ==============================================================================

set -eo pipefail

# --- Color Formatting ---
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
header() {
    echo -e "\n${BOLD}${CYAN}====================================================================${NC}"
    echo -e "${BOLD}${CYAN} $1${NC}"
    echo -e "${BOLD}${CYAN}====================================================================${NC}\n"
}

# --- Script Directory ---
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${ROOT_DIR}/server"
BACKEND_DIR="${SERVER_DIR}/backend"
ADMIN_DIR="${SERVER_DIR}/admin"
EXAM_CLIENT_DIR="${SERVER_DIR}/exam-client"

# --- Defaults ---
SKIP_NPM=false
SKIP_VENV=false
SKIP_DB=false
ADMIN_PASS="admin123"

show_help() {
    cat << EOF
TeioOS Linux Automated Setup Script

Usage: ./setup.sh [OPTIONS]

Options:
  -h, --help            Show this help message and exit
  --skip-npm            Skip installing Node.js / npm frontend dependencies
  --skip-venv           Skip setting up Python virtual environment and dependencies
  --skip-db             Skip PostgreSQL setup, database creation & migrations
  --admin-pass PASS     Set custom password for initial admin user (default: admin123)

Examples:
  ./setup.sh                       Full setup of backend, database, admin user & frontends
  ./setup.sh --admin-pass Secret1  Setup environment with custom admin password
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --skip-npm)
            SKIP_NPM=true
            shift
            ;;
        --skip-venv)
            SKIP_VENV=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --admin-pass)
            ADMIN_PASS="$2"
            shift 2
            ;;
        *)
            error "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

header "TeioOS Environment Setup"
info "Working directory: ${ROOT_DIR}"

# --- Step 1: Check System Prerequisites ---
header "Step 1: Checking System Dependencies"

MISSING_DEPS=()

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        MISSING_DEPS+=("$1")
    else
        success "Found: $1 ($(command -v "$1"))"
    fi
}

check_cmd python3
check_cmd node
check_cmd npm
check_cmd git

if ! python3 -m venv --help &> /dev/null; then
    warn "python3-venv module appears to be missing or incomplete."
    MISSING_DEPS+=("python3-venv")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    error "Missing required dependencies: ${MISSING_DEPS[*]}"
    echo ""
    info "To install missing dependencies, run the command for your Linux distribution:"
    
    if command -v pacman &> /dev/null; then
        echo -e "${BOLD}  sudo pacman -S python nodejs npm git postgresql${NC}"
    elif command -v apt-get &> /dev/null; then
        echo -e "${BOLD}  sudo apt update && sudo apt install -y python3 python3-venv python3-pip nodejs npm git postgresql${NC}"
    elif command -v dnf &> /dev/null; then
        echo -e "${BOLD}  sudo dnf install python3 nodejs npm git postgresql${NC}"
    elif command -v zypper &> /dev/null; then
        echo -e "${BOLD}  sudo zypper install python3 nodejs npm git postgresql${NC}"
    else
        echo -e "${BOLD}  Please install Python 3 (with venv), Node.js, npm, and git manually.${NC}"
    fi
    echo ""
    exit 1
fi

# --- Step 2: Backend Setup ---
header "Step 2: TeioOS Backend Setup (FastAPI)"

if [ "$SKIP_VENV" = true ]; then
    warn "Skipping Python virtual environment setup (--skip-venv passed)."
else
    cd "${BACKEND_DIR}"

    VENV_DIR="${BACKEND_DIR}/.venv"
    if [ ! -d "${VENV_DIR}" ]; then
        info "Creating Python virtual environment at server/backend/.venv..."
        python3 -m venv "${VENV_DIR}"
        success "Virtual environment created."
    else
        info "Python virtual environment already exists at server/backend/.venv."
    fi

    # Activate virtual environment
    # shellcheck disable=SC1091
    source "${VENV_DIR}/bin/activate"

    info "Upgrading pip and installing Python dependencies..."
    pip install --upgrade pip --quiet
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        success "Python dependencies installed successfully."
    else
        warn "requirements.txt not found in ${BACKEND_DIR}!"
    fi

    # Handle .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            info "Copying .env.example to .env..."
            cp .env.example .env
            
            # Generate a secure secret key
            SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32 2>/dev/null || echo "dev_secret_key_change_me_in_production")
            if grep -q "SECRET_KEY=" .env; then
                sed -i "s|^SECRET_KEY=.*|SECRET_KEY=${SECRET_KEY}|" .env
            fi
            success ".env file created with generated SECRET_KEY."
        else
            warn ".env.example not found in ${BACKEND_DIR}."
        fi
    else
        info ".env file already exists in ${BACKEND_DIR}. Preserving existing configuration."
    fi
fi

# --- Step 3: Admin Dashboard Setup ---
header "Step 3: React Admin Dashboard Setup"

if [ "$SKIP_NPM" = true ]; then
    warn "Skipping Frontend Node package installation (--skip-npm passed)."
else
    cd "${ADMIN_DIR}"
    
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        info "Creating server/admin/.env from .env.example..."
        cp .env.example .env
    fi

    if [ -f "package.json" ]; then
        info "Installing Admin Dashboard dependencies with npm..."
        npm install
        success "Admin Dashboard dependencies installed successfully."
    else
        warn "package.json not found in ${ADMIN_DIR}!"
    fi
fi

# --- Step 4: Exam Client Setup ---
header "Step 4: React Student Exam Client Setup"

if [ "$SKIP_NPM" = true ]; then
    warn "Skipping Frontend Node package installation (--skip-npm passed)."
else
    cd "${EXAM_CLIENT_DIR}"
    
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        info "Creating server/exam-client/.env from .env.example..."
        cp .env.example .env
    fi

    if [ -f "package.json" ]; then
        info "Installing Exam Client dependencies with npm..."
        npm install
        success "Exam Client dependencies installed successfully."
    else
        warn "package.json not found in ${EXAM_CLIENT_DIR}!"
    fi
fi

# --- Step 5: PostgreSQL Database Initialization & Admin Setup ---
header "Step 5: PostgreSQL Setup, Database Creation & Seed Admin"

if [ "$SKIP_DB" = true ]; then
    warn "Skipping PostgreSQL setup and database migrations (--skip-db passed)."
else
    # Read database credentials from backend .env
    cd "${BACKEND_DIR}"
    if [ -f ".env" ]; then
        DB_HOST=$(grep "^DATABASE_HOST=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "localhost")
        DB_PORT=$(grep "^DATABASE_PORT=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "5432")
        DB_NAME=$(grep "^DATABASE_NAME=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "teioos")
        DB_USER=$(grep "^DATABASE_USER=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "teioos_user")
        DB_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "password123")
    else
        DB_HOST="localhost"
        DB_PORT="5432"
        DB_NAME="teioos"
        DB_USER="teioos_user"
        DB_PASS="password123"
    fi

    info "PostgreSQL Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

    # 1. Initialize PostgreSQL cluster if required
    if command -v initdb &> /dev/null; then
        PG_DATA_DIR=""
        if [ -d "/var/lib/postgres/data" ]; then
            PG_DATA_DIR="/var/lib/postgres/data"
        elif [ -d "/var/lib/postgresql/data" ]; then
            PG_DATA_DIR="/var/lib/postgresql/data"
        fi

        if [ -n "$PG_DATA_DIR" ] && [ ! -f "${PG_DATA_DIR}/PG_VERSION" ]; then
            info "Initializing PostgreSQL database cluster with initdb..."
            sudo -u postgres initdb -D "$PG_DATA_DIR" 2>/dev/null || warn "initdb skipped or already initialized."
        fi
    fi

    # 2. Ensure PostgreSQL service is running
    if command -v systemctl &> /dev/null; then
        info "Ensuring PostgreSQL systemd service is active..."
        sudo systemctl start postgresql 2>/dev/null || warn "Could not start postgresql via systemctl (might already be running or unneeded)."
    fi

    # 3. Create Database Role and Database if postgres superuser is accessible
    info "Provisioning PostgreSQL user '${DB_USER}' and database '${DB_NAME}'..."

    SQL_COMMANDS="DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' SUPERUSER CREATEDB; ELSE ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}'; END IF; END \$\$;"

    if command -v sudo &> /dev/null; then
        sudo -u postgres psql -c "$SQL_COMMANDS" 2>/dev/null || true
        sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1 || \
            sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}" 2>/dev/null || true
    fi

    # 4. Run Alembic Migrations
    info "Running Alembic migrations..."
    if [ -d ".venv" ]; then
        # shellcheck disable=SC1091
        source .venv/bin/activate
    fi

    if alembic upgrade head; then
        success "Alembic database migrations applied successfully."
    else
        error "Alembic migrations failed. Check PostgreSQL connection settings in server/backend/.env."
    fi

    # 5. Seed Initial Admin User
    info "Seeding initial admin user..."
    ADMIN_PASSWORD="${ADMIN_PASS}" python scripts/seed_admin.py || warn "Failed to seed admin user automatically."
fi

# --- Final Summary ---
header "TeioOS Setup Completed Successfully!"

cat << EOF
${GREEN}${BOLD}Next steps to run TeioOS components locally:${NC}

${BOLD}Quick Start (All Services in tmux):${NC}
   ${CYAN}./dev.sh${NC}

${BOLD}Or start services individually:${NC}
1. ${BOLD}Start TeioOS FastAPI Backend:${NC}
   ${CYAN}cd server/backend${NC}
   ${CYAN}source .venv/bin/activate${NC}
   ${CYAN}uvicorn app.main:app --reload --port 8000${NC}

2. ${BOLD}Start Admin Dashboard (React + Vite):${NC}
   ${CYAN}cd server/admin${NC}
   ${CYAN}npm run dev${NC}

3. ${BOLD}Start Student Exam Client (React + Vite):${NC}
   ${CYAN}cd server/exam-client${NC}
   ${CYAN}npm run dev${NC}

4. ${BOLD}Admin Credentials:${NC}
   Username: ${BOLD}admin${NC}
   Password: ${BOLD}${ADMIN_PASS}${NC}

EOF
