# TeioOS

## Project Description

TeioOS is an open-source examination platform and custom Linux-based operating system designed for computer-based testing. The platform integrates a Debian-based client operating system, a FastAPI backend server, a PostgreSQL database, a React-based administrator dashboard, and a React-based student examination client. The platform provides a secure examination environment alongside built-in accessibility features for candidates with diverse requirements.

## Key Features

- Server-authoritative examination timing managed via a background session sweeper that automatically pauses inactive sessions, auto-submits expired active exams, and finalizes overdue paused sessions.
- Academic hierarchy management covering Departments, Subjects, Classes, Students, and System Users.
- Support for Multiple Choice Questions (MCQ) with single or multiple correct options, and Descriptive text-response questions.
- Automated instant scoring for MCQ items and a manual evaluation interface for grading descriptive answers.
- Built-in accessibility controls including screen reader compatibility (Orca), high-contrast display modes, font size scaling, reduced motion support, ARIA landmarks, and keyboard-only navigation.
- Automated developer setup scripts for Linux (`setup.sh`) and Windows (`setup.ps1`) environments.

## Technology Stack

### Operating System and Desktop Environment
- Operating System: Debian Linux
- Window Manager: Openbox
- Display Manager: LightDM
- Browser: Mozilla Firefox (Kiosk Mode)

### Backend and Database
- Programming Language: Python 3.12+
- Web Framework: FastAPI
- ORM: SQLAlchemy 2.0
- Data Validation: Pydantic v2, Pydantic Settings
- Database Engine: PostgreSQL 14+
- Password Hashing: Argon2id (`pwdlib`)
- Token Authentication: PyJWT

### Frontend Applications
- Framework: React 18
- Build Tool: Vite
- Styling: TailwindCSS
- State and Data Fetching: TanStack Query v5, Axios
- Iconography: Lucide React

### Automation
- Linux Scripting: Bash
- Windows Scripting: PowerShell

## High-Level System Architecture

The system consists of two main units:

1. TeioOS Exam Server (`server/`): Contains the FastAPI REST backend service, PostgreSQL database instance, React Administrator Dashboard, and React Student Examination Client.
2. TeioOS Client OS (`teioos/`): A Debian-based Linux distribution configured with LightDM auto-login, Openbox window manager, and Firefox running in kiosk mode, connecting to the examination server.

## Repository Structure

```text
TeioOS/
├── AGENTS.md
├── README.md
├── setup.ps1
├── setup.sh
├── assets/
├── database/
├── server/
│   ├── admin/
│   ├── backend/
│   ├── exam-client/
│   └── nginx/
└── teioos/
```

## Backend Overview

The backend (`server/backend/`) follows a layered architecture comprising:

- API Routes (`app/api/`): HTTP endpoints categorized under `/api/v1/admin/*` and `/api/v1/student/*`.
- Service Layer (`app/services/`): Business logic, evaluation, result calculation, and background session sweeping.
- Repository Layer (`app/repositories/`): Data access isolation using SQLAlchemy query abstractions.
- Database Models (`app/models/`): Declarative SQLAlchemy models.
- Schemas (`app/schemas/`): Pydantic models for request validation and response formatting.

The backend includes a continuous background task (`_run_auto_submit_sweeper`) that monitors active exam sessions, enforcing server-authoritative timer expiration and inactivity timeouts.

## Administrator Dashboard Overview

The Administrator Dashboard (`server/admin/`) is a React single-page application providing administrative management tools:

- User authentication for administrators and teachers.
- Academic structure configuration for departments, subjects, classes, and student rosters.
- Exam authoring with MCQ and descriptive question bank management.
- Exam scheduling for assigned classes.
- Manual evaluation interface for grading descriptive answers.
- Performance reporting, analytics, and system settings.

## Student Examination Client Overview

The Student Examination Client (`server/exam-client/`) is a React single-page application built for candidate test-taking:

- Student authentication using Roll Number and Password.
- Exam dashboard listing assigned, active, and completed examinations.
- Instructions page displaying exam rules and timing details.
- Active examination interface featuring question rendering, navigation palette, countdown timer, and automated answer persistence.
- Exam review page allowing candidates to review answer status prior to submission.
- Offline status detection and session expiration views.

## Accessibility Features

The system implements accessible design practices:

- Keyboard Navigation: All interactive elements are focusable and operable using standard keyboard inputs (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow keys`).
- Visible Focus Indicators: High-contrast focus outlines across interactive controls.
- Screen Reader Support: Tested with the Orca screen reader on Linux using semantic HTML5 elements and ARIA roles and labels.
- Candidate Profiles: Student records contain an `accessibility_profile` JSON object storing font size, high-contrast, text-to-speech, and speech-to-text settings.
- Speech-to-Text and Text-to-Speech: Integrated TTS speaker and STT dictation controls for accessible question reading and answer entry.
- Reduced Motion: CSS styles respect `prefers-reduced-motion` browser settings.

## Project Setup

### Prerequisites
- Operating System: Linux (Debian, Ubuntu, Arch Linux, Fedora) or Windows 10/11 (PowerShell / WSL2)
- Python 3.12+
- Node.js 18.0.0+ and npm
- PostgreSQL 14+
- Git

### Linux Setup
Run the setup script from the repository root:

```bash
chmod +x setup.sh
./setup.sh
```

### Windows Setup
Run the PowerShell setup script from a PowerShell terminal:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\setup.ps1
```

The setup scripts check system prerequisites, create Python virtual environments, generate `.env` files, install frontend npm packages, provision the PostgreSQL user and database, execute database migrations, and seed the default administrator account (`admin` / `admin123`).

## Containerized Production Deployment

TeioOS can be deployed as a single integrated container stack using Docker and Docker Compose. The central Nginx gateway serves as the single public entry point for both frontend React applications and the FastAPI backend.

### Container Prerequisites

- Docker Engine (v24.0+)
- Docker Compose (v2.20+)

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/RundownTrex/TeioOS.git
   cd TeioOS
   ```

2. Prepare environment configuration:
   Copy `.env.example` to `.env` at the repository root:
   ```bash
   cp .env.example .env
   ```

3. Generate a secure `SECRET_KEY`:
   Run the following Python command to generate a 64-character hex secret key:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

4. Configure required secrets in `.env`:
   Edit `.env` and set non-default values for the following required variables:
   - `SECRET_KEY`: Paste the generated hex key.
   - `DATABASE_PASSWORD`: Set a secure database user password.
   - `POSTGRES_PASSWORD`: Set to match `DATABASE_PASSWORD`.
   - `ADMIN_PASSWORD`: Set the initial administrator password.
   - `CORS_ORIGINS`: Set to match the gateway public origin (e.g. `http://localhost:8080` or `http://<SERVER_IP>:8080`).

5. Launch the container stack:
   ```bash
   docker compose up -d
   ```
   The stack automatically initializes PostgreSQL, executes database schema migrations via Alembic, seeds the initial administrator account, and starts the Nginx gateway.


### Backup & Restore

TeioOS includes automated database backup and restore scripts independent of container lifecycles.

#### Taking a Database Backup
To take a live, non-disruptive database backup from the running `teioos-db` container:
```bash
./scripts/backup.sh
```
- **Storage Location:** Backups are saved in `backups/teioos_backup_YYYYMMDD_HHMMSS.sql.gz`.
- **Format:** Gzip-compressed SQL dump generated with `pg_dump --clean --if-exists`.

#### Restoring a Database Backup
To restore a backup file into the running `teioos-db` container:
```bash
./scripts/restore.sh backups/teioos_backup_20260811_120000.sql.gz
```
- **Warning:** Restoring is a destructive operation that will drop and replace existing data in the target database. Interactive confirmation is required unless `--yes` is specified.
- **Automated / Non-interactive Restore:**
  ```bash
  ./scripts/restore.sh backups/teioos_backup_20260811_120000.sql.gz --yes
  ```

#### Examination Deployment Backup Recommendations
- **Before Exam Sessions:** Take a backup immediately prior to opening an examination window to preserve pre-exam configuration and candidate assignments.
- **After Exam Sessions:** Take a backup immediately following exam completion to secure candidate answer submissions and evaluation results.
- **Before Upgrades/Migrations:** Take a backup prior to applying system updates or Alembic migrations.

### Local Area Network (LAN) Deployment

To allow candidate client devices and administrator workstations on the local network to access the TeioOS Exam Server:

#### 1. Identify Server LAN IP Address
Find the server host machine's LAN IP address:
```bash
ip -4 addr show
```
*(Identify the IP under the primary active network interface, e.g. `10.182.180.124` or `192.168.1.50`).*

#### 2. Configure CORS in `.env`
Update `CORS_ORIGINS` in `.env` to include the server's LAN IP origin alongside `localhost`:
```ini
CORS_ORIGINS=http://localhost:8080,http://10.182.180.124:8080
```
Restart the backend to apply changes:
```bash
docker compose restart backend
```
*Note: Hardcoding dynamic DHCP LAN IPs is sensitive to network changes. For production institutional deployments, assign a static IP address or static DHCP reservation to the server machine.*

#### 3. Firewall Configuration
Ensure inbound TCP connections to port `8080` are allowed through any active host firewall:
```bash
# Example for UFW
sudo ufw allow in on wlan0 to any port 8080 proto tcp
```

#### 4. LAN Access Endpoints
Client devices on the same local network can connect using the server's LAN IP:
- Candidate Examination Client: `http://<LAN_IP>:8080/exam/`
- Administrator Dashboard: `http://<LAN_IP>:8080/admin/`
- API Health Check: `http://<LAN_IP>:8080/api/v1/health`

## Required Environment Variables

Backend environment configuration is stored in `server/backend/.env`:

```ini
APP_NAME=TeioOS Exam Server
APP_ENV=development
DEBUG=True

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=teioos
DATABASE_USER=teioos_user
DATABASE_PASSWORD=your_password_here

SECRET_KEY=generate_a_random_secure_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Running the Backend

To start the FastAPI backend server manually:

```bash
cd server/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

On Windows PowerShell:
```powershell
cd server\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

## Running the Administrator Dashboard

To start the Administrator Dashboard development server:

```bash
cd server/admin
npm run dev
```

## Running the Student Examination Client

To start the Student Examination Client development server:

```bash
cd server/exam-client
npm run dev
```

## API Documentation

When the backend server is running, interactive API documentation is accessible at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

