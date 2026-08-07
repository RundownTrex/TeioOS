<#
.SYNOPSIS
    TeioOS Windows Environment Automated Setup Script
.DESCRIPTION
    Automates dependency verification, virtual environment creation, npm package installation,
    database provisioning, Alembic migrations, and admin seeding on Windows PowerShell.
.EXAMPLE
    .\setup.ps1
.EXAMPLE
    .\setup.ps1 -AdminPass "MySecurePass123"
#>

[CmdletBinding()]
param (
    [switch]$SkipNpm,
    [switch]$SkipVenv,
    [switch]$SkipDb,
    [string]$AdminPass = "admin123"
)

$ErrorActionPreference = "Stop"

function Write-Info    { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warn    { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Err     { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Write-Header {
    param([string]$Title)
    Write-Host "`n====================================================================" -ForegroundColor DarkCyan
    Write-Host " $Title" -ForegroundColor DarkCyan
    Write-Host "====================================================================`n" -ForegroundColor DarkCyan
}

$RootDir = $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$BackendDir = Join-Path $ServerDir "backend"
$AdminDir = Join-Path $ServerDir "admin"
$ExamClientDir = Join-Path $ServerDir "exam-client"

Write-Header "TeioOS Windows Environment Setup"
Write-Info "Working directory: $RootDir"

# --- Step 1: Check Prerequisites ---
Write-Header "Step 1: Checking System Dependencies"

$MissingDeps = @()

function Test-Command {
    param([string]$Cmd)
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        $script:MissingDeps += $Cmd
    } else {
        $cmdPath = (Get-Command $Cmd).Source
        Write-Success "Found: $Cmd ($cmdPath)"
    }
}

Test-Command "python"
Test-Command "node"
Test-Command "npm"
Test-Command "git"

if ($MissingDeps.Count -gt 0) {
    Write-Err "Missing required dependencies: $($MissingDeps -join ', ')"
    Write-Host ""
    Write-Info "Please install missing software on Windows using winget or manual installers:"
    Write-Host "  winget install Python.Python.3.12 OpenJS.NodeJS.LTS Git.Git PostgreSQL.PostgreSQL" -ForegroundColor Bold
    Write-Host ""
    exit 1
}

# --- Step 2: Backend Setup ---
Write-Header "Step 2: TeioOS Backend Setup (FastAPI)"

if ($SkipVenv) {
    Write-Warn "Skipping Python virtual environment setup (-SkipVenv passed)."
} else {
    Set-Location $BackendDir

    $VenvDir = Join-Path $BackendDir ".venv"
    if (-not (Test-Path $VenvDir)) {
        Write-Info "Creating Python virtual environment at server\backend\.venv..."
        python -m venv $VenvDir
        Write-Success "Virtual environment created."
    } else {
        Write-Info "Python virtual environment already exists at server\backend\.venv."
    }

    $VenvActivate = Join-Path $VenvDir "Scripts\Activate.ps1"
    if (Test-Path $VenvActivate) {
        & $VenvActivate
    }

    Write-Info "Upgrading pip and installing Python dependencies..."
    python -m pip install --upgrade pip --quiet
    if (Test-Path "requirements.txt") {
        python -m pip install -r requirements.txt
        Write-Success "Python dependencies installed successfully."
    } else {
        Write-Warn "requirements.txt not found in $BackendDir!"
    }

    # Handle .env
    $EnvFile = Join-Path $BackendDir ".env"
    $EnvExample = Join-Path $BackendDir ".env.example"

    if (-not (Test-Path $EnvFile)) {
        if (Test-Path $EnvExample) {
            Write-Info "Copying .env.example to .env..."
            Copy-Item $EnvExample $EnvFile
            
            # Generate random secret key
            $Bytes = New-Object Byte[] 32
            (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($Bytes)
            $SecretKey = ($Bytes | ForEach-Object { $_.ToString("x2") }) -join ""

            (Get-Content $EnvFile) -replace '^SECRET_KEY=.*', "SECRET_KEY=$SecretKey" | Set-Content $EnvFile
            Write-Success ".env file created with generated SECRET_KEY."
        }
    } else {
        Write-Info ".env file already exists in $BackendDir. Preserving existing configuration."
    }
}

# --- Step 3: Admin Dashboard Setup ---
Write-Header "Step 3: React Admin Dashboard Setup"

if ($SkipNpm) {
    Write-Warn "Skipping Frontend Node package installation (-SkipNpm passed)."
} else {
    Set-Location $AdminDir

    $AdminEnv = Join-Path $AdminDir ".env"
    $AdminEnvEx = Join-Path $AdminDir ".env.example"
    if ((-not (Test-Path $AdminEnv)) -and (Test-Path $AdminEnvEx)) {
        Write-Info "Creating server\admin\.env from .env.example..."
        Copy-Item $AdminEnvEx $AdminEnv
    }

    if (Test-Path "package.json") {
        Write-Info "Installing Admin Dashboard dependencies with npm..."
        npm install
        Write-Success "Admin Dashboard dependencies installed successfully."
    }
}

# --- Step 4: Exam Client Setup ---
Write-Header "Step 4: React Student Exam Client Setup"

if ($SkipNpm) {
    Write-Warn "Skipping Frontend Node package installation (-SkipNpm passed)."
} else {
    Set-Location $ExamClientDir

    $ExamEnv = Join-Path $ExamClientDir ".env"
    $ExamEnvEx = Join-Path $ExamClientDir ".env.example"
    if ((-not (Test-Path $ExamEnv)) -and (Test-Path $ExamEnvEx)) {
        Write-Info "Creating server\exam-client\.env from .env.example..."
        Copy-Item $ExamEnvEx $ExamEnv
    }

    if (Test-Path "package.json") {
        Write-Info "Installing Exam Client dependencies with npm..."
        npm install
        Write-Success "Exam Client dependencies installed successfully."
    }
}

# --- Step 5: Database & Admin User Setup ---
Write-Header "Step 5: PostgreSQL Setup, Database Creation & Seed Admin"

if ($SkipDb) {
    Write-Warn "Skipping PostgreSQL setup and database migrations (-SkipDb passed)."
} else {
    Set-Location $BackendDir

    $VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

    # Start Windows PostgreSQL Service if available
    $PgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($PgService) {
        if ($PgService.Status -ne 'Running') {
            Write-Info "Starting Windows PostgreSQL service ($($PgService.Name))..."
            try {
                Start-Service -Name $PgService.Name -ErrorAction SilentlyContinue
            } catch {
                Write-Warn "Could not start PostgreSQL service automatically. Ensure PostgreSQL is running."
            }
        } else {
            Write-Success "PostgreSQL service ($($PgService.Name)) is running."
        }
    }

    # Run Alembic Migrations
    Write-Info "Running Alembic migrations..."
    try {
        & $VenvPython -m alembic upgrade head
        Write-Success "Alembic database migrations applied successfully."
    } catch {
        Write-Warn "Alembic migrations warning. Ensure PostgreSQL database and user exist."
    }

    # Seed Admin User
    Write-Info "Seeding initial admin user..."
    try {
        $env:ADMIN_PASSWORD = $AdminPass
        & $VenvPython scripts/seed_admin.py
    } catch {
        Write-Warn "Failed to seed admin user automatically. Run 'python scripts/seed_admin.py' after starting PostgreSQL."
    }
}

# --- Final Summary ---
Write-Header "TeioOS Windows Setup Completed Successfully!"

Write-Host "Next steps to run TeioOS components locally on Windows:`n" -ForegroundColor Green

Write-Host "1. Start TeioOS FastAPI Backend:" -ForegroundColor White
Write-Host "   cd server\backend" -ForegroundColor Cyan
Write-Host "   .\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Start Admin Dashboard (React + Vite):" -ForegroundColor White
Write-Host "   cd server\admin" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Start Student Exam Client (React + Vite):" -ForegroundColor White
Write-Host "   cd server\exam-client" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Admin Credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Yellow
Write-Host "   Password: $AdminPass" -ForegroundColor Yellow
Write-Host ""
