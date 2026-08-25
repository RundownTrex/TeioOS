#!/usr/bin/env bash

# ==============================================================================
# TeioOS Local Development Environment (tmux Launcher)
# ==============================================================================
# Design and Development of TeioOS: An Accessible and Secure Linux-Based
# Operating System for Computer-Based Examinations
# ==============================================================================
# Launches all three core TeioOS development servers in a split tmux session:
#   - FastAPI Backend Server       (Port 8000)
#   - React Administrator Dashboard (Port 3001)
#   - React Student Exam Client     (Port 3000)
# ==============================================================================

set -eo pipefail

SESSION_NAME="teioos"

# --- Color Formatting ---
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

# --- Project Paths ---
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${ROOT_DIR}/server"
BACKEND_DIR="${SERVER_DIR}/backend"
ADMIN_DIR="${SERVER_DIR}/admin"
EXAM_CLIENT_DIR="${SERVER_DIR}/exam-client"

# --- Help Display ---
show_help() {
    echo -e "${BOLD}TeioOS Development Server Launcher (tmux)${NC}

Usage:
  ./dev.sh [COMMAND|OPTION]

Commands:
  start            Start all services in a tmux session and attach (default)
  stop             Stop all running development services and kill tmux session
  restart          Restart all development services in tmux
  status           Check if the TeioOS tmux development session is running
  attach           Attach to existing running tmux session

Options:
  -d, --detach     Start services in background without attaching immediately
  -k, --kill       Kill existing session before starting
  -r, --restart    Restart existing session
  -s, --stop       Stop running session
  -a, --attach     Attach to existing session
  -h, --help       Display this help message

Endpoints launched:
  - ${BOLD}FastAPI Backend:${NC}       http://localhost:8000  (API Docs: http://localhost:8000/docs)
  - ${BOLD}Admin Dashboard:${NC}       http://localhost:3001/admin/
  - ${BOLD}Student Exam Client:${NC}   http://localhost:3000/exam/

Switching Between Panes (No prefix needed!):
  - ${CYAN}Alt + <Arrow Keys>${NC}  Switch pane directly (Left/Right/Up/Down)
  - ${CYAN}Ctrl + Tab${NC}          Cycle between panels

Close Everything at Once:
  - ${CYAN}Alt + q${NC}             Close all services & quit tmux immediately (No prefix needed!)
  - ${CYAN}Ctrl+b k${NC}            Close all services & quit tmux
  - ${CYAN}./dev.sh stop${NC}       Stop all services from regular terminal

Other tmux Shortcuts:
  - ${CYAN}Ctrl+b d${NC}            Detach from session (keeps services running in background)
  - ${CYAN}Ctrl+b z${NC}            Toggle full-screen zoom on active pane"
}

# --- Check tmux Dependency ---
check_tmux() {
    if ! command -v tmux &> /dev/null; then
        error "tmux is not installed on this system."
        echo ""
        info "Please install tmux using your system package manager:"
        if command -v pacman &> /dev/null; then
            echo -e "${BOLD}  sudo pacman -S tmux${NC}"
        elif command -v apt-get &> /dev/null; then
            echo -e "${BOLD}  sudo apt update && sudo apt install -y tmux${NC}"
        elif command -v dnf &> /dev/null; then
            echo -e "${BOLD}  sudo dnf install tmux${NC}"
        elif command -v zypper &> /dev/null; then
            echo -e "${BOLD}  sudo zypper install tmux${NC}"
        else
            echo -e "${BOLD}  Please install tmux using your OS package manager.${NC}"
        fi
        echo ""
        exit 1
    fi
}

# --- Locate Python Virtual Environment ---
detect_venv() {
    VENV_ACTIVATE=""
    if [ -f "${BACKEND_DIR}/.venv/bin/activate" ]; then
        VENV_ACTIVATE="${BACKEND_DIR}/.venv/bin/activate"
    elif [ -f "${ROOT_DIR}/.venv/bin/activate" ]; then
        VENV_ACTIVATE="${ROOT_DIR}/.venv/bin/activate"
    elif [ -f "${BACKEND_DIR}/venv/bin/activate" ]; then
        VENV_ACTIVATE="${BACKEND_DIR}/venv/bin/activate"
    elif [ -f "${ROOT_DIR}/venv/bin/activate" ]; then
        VENV_ACTIVATE="${ROOT_DIR}/venv/bin/activate"
    fi

    if [ -z "$VENV_ACTIVATE" ]; then
        warn "Python virtual environment not found in server/backend/.venv or root .venv!"
        warn "You may need to run ./setup.sh first to set up dependencies."
    fi
}

# --- Stop Session ---
stop_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        info "Stopping TeioOS tmux session '${SESSION_NAME}'..."
        tmux kill-session -t "$SESSION_NAME"
        success "TeioOS development session stopped."
    else
        info "No active TeioOS tmux session found."
    fi
}

# --- Status of Session ---
status_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        success "TeioOS dev session '${SESSION_NAME}' is currently RUNNING."
        echo ""
        tmux list-windows -t "$SESSION_NAME" -F "  Window: #W (Panes: #{window_panes})"
        tmux list-panes -t "$SESSION_NAME" -F "    Pane #P: #{pane_title} [#{pane_width}x#{pane_height}]"
        echo ""
        info "Attach with: ./dev.sh attach (or tmux attach -t ${SESSION_NAME})"
        info "Stop with:   ./dev.sh stop   (or tmux kill-session -t ${SESSION_NAME})"
    else
        info "TeioOS dev session '${SESSION_NAME}' is NOT running."
        info "Start with:  ./dev.sh"
    fi
}

# --- Attach to Session ---
attach_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        info "Attaching to TeioOS tmux session '${SESSION_NAME}'..."
        if [ -n "${TMUX:-}" ]; then
            tmux switch-client -t "$SESSION_NAME"
        else
            tmux attach-session -t "$SESSION_NAME"
        fi
    else
        error "No active TeioOS tmux session to attach to."
        info "Start a new session with: ./dev.sh"
        exit 1
    fi
}

# --- Start Session ---
start_session() {
    local DETACH_MODE="$1"

    # If session already exists
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        warn "TeioOS tmux session '${SESSION_NAME}' is already running."
        if [ "$DETACH_MODE" = true ]; then
            info "Services are active in the background. Use './dev.sh attach' to view."
            exit 0
        else
            info "Attaching to existing session..."
            attach_session
            exit 0
        fi
    fi

    # Check environment requirements
    check_tmux
    detect_venv

    # Check for backend .env
    if [ ! -f "${BACKEND_DIR}/.env" ]; then
        if [ -f "${BACKEND_DIR}/.env.example" ]; then
            warn "server/backend/.env not found! Copying from .env.example..."
            cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
        fi
    fi

    # Check node_modules
    if [ ! -d "${ADMIN_DIR}/node_modules" ]; then
        warn "server/admin/node_modules not found. Run ./setup.sh or 'npm install' inside server/admin."
    fi
    if [ ! -d "${EXAM_CLIENT_DIR}/node_modules" ]; then
        warn "server/exam-client/node_modules not found. Run ./setup.sh or 'npm install' inside server/exam-client."
    fi

    header "Launching TeioOS Development Environment (tmux)"

    info "1. Creating tmux session '${SESSION_NAME}'..."
    # Create detached session with first window 'services', starting in backend directory
    tmux new-session -d -s "$SESSION_NAME" -n "services" -c "$BACKEND_DIR"

    # Configure session options: mouse on, pane titles visible on top border, extended keys for Ctrl+Tab
    tmux set-option -s extended-keys on 2>/dev/null || true
    tmux set-option -t "$SESSION_NAME" mouse on 2>/dev/null || true
    tmux set-option -t "$SESSION_NAME" pane-border-status top 2>/dev/null || true
    tmux set-option -t "$SESSION_NAME" pane-border-format " [ #{pane_title} ] " 2>/dev/null || true
    tmux set-window-option -t "${SESSION_NAME}:services" allow-rename off 2>/dev/null || true
    tmux set-window-option -t "${SESSION_NAME}:services" automatic-rename off 2>/dev/null || true

    # 1. Switch / cycle panes with Ctrl+Tab (no prefix needed)
    tmux bind-key -n C-Tab select-pane -t :.+ 2>/dev/null || true
    tmux bind-key -n C-S-Tab select-pane -t :.- 2>/dev/null || true
    tmux bind-key -n C-BTab select-pane -t :.- 2>/dev/null || true

    # 2. Switch panes with Alt + Arrow Keys (no prefix needed)
    tmux bind-key -n M-Left select-pane -L 2>/dev/null || true
    tmux bind-key -n M-Right select-pane -R 2>/dev/null || true
    tmux bind-key -n M-Up select-pane -U 2>/dev/null || true
    tmux bind-key -n M-Down select-pane -D 2>/dev/null || true

    # 3. Simple shortcuts to close all services at once
    tmux bind-key -n M-q kill-session 2>/dev/null || true
    tmux bind-key -T prefix k kill-session 2>/dev/null || true

    # Pane 0: FastAPI Backend (Left 50%)
    tmux select-pane -t "${SESSION_NAME}:services.0" -T "FastAPI Backend (:8000)"

    # Split horizontally (creates Pane 1 on right)
    tmux split-window -h -t "${SESSION_NAME}:services.0" -c "$ADMIN_DIR"
    tmux select-pane -t "${SESSION_NAME}:services.1" -T "Admin Dashboard (:3001)"

    # Split Pane 1 vertically (creates Pane 2 on bottom right)
    tmux split-window -v -t "${SESSION_NAME}:services.1" -c "$EXAM_CLIENT_DIR"
    tmux select-pane -t "${SESSION_NAME}:services.2" -T "Student Exam Client (:3000)"

    # Command for Pane 0 (FastAPI Backend)
    info "2. Starting FastAPI Backend on port 8000..."
    if [ -n "$VENV_ACTIVATE" ]; then
        tmux send-keys -t "${SESSION_NAME}:services.0" "cd '${BACKEND_DIR}' && source '${VENV_ACTIVATE}' && uvicorn app.main:app --reload --port 8000" C-m
    else
        tmux send-keys -t "${SESSION_NAME}:services.0" "cd '${BACKEND_DIR}' && uvicorn app.main:app --reload --port 8000" C-m
    fi

    # Command for Pane 1 (Admin Dashboard)
    info "3. Starting Admin Dashboard on port 3001..."
    tmux send-keys -t "${SESSION_NAME}:services.1" "cd '${ADMIN_DIR}' && npm run dev" C-m

    # Command for Pane 2 (Student Exam Client)
    info "4. Starting Student Exam Client on port 3000..."
    tmux send-keys -t "${SESSION_NAME}:services.2" "cd '${EXAM_CLIENT_DIR}' && npm run dev" C-m

    # Focus back on Pane 0 (Backend)
    tmux select-pane -t "${SESSION_NAME}:services.0"

    success "All TeioOS services launched successfully!"
    echo ""
    echo -e "  ${BOLD}Services Summary:${NC}"
    echo -e "  - ${CYAN}FastAPI Backend:${NC}       http://localhost:8000  (Docs: http://localhost:8000/docs)"
    echo -e "  - ${CYAN}Admin Dashboard:${NC}       http://localhost:3001/admin/"
    echo -e "  - ${CYAN}Student Exam Client:${NC}   http://localhost:3000/exam/"
    echo ""
    echo -e "  ${BOLD}Panel Navigation (No prefix needed):${NC}"
    echo -e "  - ${YELLOW}Alt + <Arrow Keys>${NC}  Switch pane directly (Left/Right/Up/Down)"
    echo -e "  - ${YELLOW}Ctrl + Tab${NC}          Cycle between panels"
    echo ""
    echo -e "  ${BOLD}Close / Stop:${NC}"
    echo -e "  - ${YELLOW}Alt + q${NC}             Close all services & quit tmux immediately"
    echo -e "  - ${YELLOW}Ctrl+b k${NC}            Close all services & quit tmux"
    echo -e "  - ${YELLOW}Ctrl+b d${NC}            Detach session (keeps services running in background)"
    echo -e "  - ${YELLOW}./dev.sh stop${NC}       Stop all services from regular terminal"
    echo ""

    if [ "$DETACH_MODE" = true ]; then
        info "Session started in detached mode. Use './dev.sh attach' to open dashboard."
    else
        info "Attaching to tmux session..."
        attach_session
    fi
}

# --- Main CLI Argument Parsing ---
ACTION="start"
DETACH=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help|help)
            show_help
            exit 0
            ;;
        -d|--detach)
            DETACH=true
            shift
            ;;
        -s|--stop|stop)
            ACTION="stop"
            shift
            ;;
        -k|--kill|-r|--restart|restart)
            ACTION="restart"
            shift
            ;;
        -a|--attach|attach)
            ACTION="attach"
            shift
            ;;
        --status|status)
            ACTION="status"
            shift
            ;;
        start)
            ACTION="start"
            shift
            ;;
        *)
            error "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

case "$ACTION" in
    stop)
        stop_session
        ;;
    status)
        status_session
        ;;
    attach)
        attach_session
        ;;
    restart)
        stop_session
        sleep 1
        start_session "$DETACH"
        ;;
    start)
        start_session "$DETACH"
        ;;
esac
