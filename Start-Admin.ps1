# ═══════════════════════════════════════════════════════════════════════════
#  Start-Admin.ps1  —  Full setup + start for Mushaira Admin Panels
#
#  What this does:
#   1. Installs PostgreSQL 16 + Memurai Redis (if missing)
#   2. Creates database user + database
#   3. Writes .env file for the API server
#   4. Installs npm dependencies
#   5. Runs Prisma migrations + seed
#   6. Opens 3 terminal windows:
#        API Server    → http://localhost:3000
#        Super Admin   → http://localhost:3002
#        Org Admin     → http://localhost:3001
#
#  RUN AS ADMINISTRATOR
# ═══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference    = "SilentlyContinue"
$Root      = $PSScriptRoot
$ApiDir    = Join-Path $Root "mushaira-platform\services\api-server"
$SuperDir  = Join-Path $Root "mushaira-platform\apps\super-admin"
$OrgDir    = Join-Path $Root "mushaira-platform\apps\organiser-admin"
$TOTAL     = 8

# ── DB config (local dev) ────────────────────────────────────────────────────
$DB_USER   = "mushaira_user"
$DB_PASS   = "mushaira_dev_pass"
$DB_NAME   = "mushaira_db"
$DB_PORT   = "5432"
$REDIS_PORT = "6379"

function Banner {
  Write-Host ""
  Write-Host "  ╔═══════════════════════════════════════════════════╗" -ForegroundColor Magenta
  Write-Host "  ║  🎤  Mushaira Platform  —  Admin Panel Setup  🎤  ║" -ForegroundColor Magenta
  Write-Host "  ╚═══════════════════════════════════════════════════╝" -ForegroundColor Magenta
  Write-Host ""
}
function Step($n,$msg)  { Write-Host "`n  [$n/$TOTAL] $msg" -ForegroundColor Cyan  }
function OK($msg)       { Write-Host "  ✅ $msg"            -ForegroundColor Green  }
function Warn($msg)     { Write-Host "  ⚠️  $msg"           -ForegroundColor Yellow }
function Info($msg)     { Write-Host "     $msg"            -ForegroundColor Gray   }

Banner

# ════════════════════════════════════════════════════════
#  [1] Install PostgreSQL 16
# ════════════════════════════════════════════════════════
Step 1 "Checking PostgreSQL..."
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
  )
  $found = $pgPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($found) {
    $pgBin = Split-Path $found
    $env:PATH = "$pgBin;$env:PATH"
    OK "PostgreSQL found at $pgBin"
  } else {
    Warn "PostgreSQL not found. Installing via winget (~500 MB)..."
    winget install PostgreSQL.PostgreSQL.16 --silent --accept-package-agreements --accept-source-agreements
    # Re-check
    $pgBin = "C:\Program Files\PostgreSQL\16\bin"
    if (Test-Path "$pgBin\psql.exe") {
      $env:PATH = "$pgBin;$env:PATH"
      OK "PostgreSQL 16 installed"
    } else {
      Warn "Auto-install may need a restart. If this fails, download from:"
      Info "https://www.postgresql.org/download/windows/"
    }
  }
} else {
  OK "PostgreSQL already installed: $(psql --version 2>&1 | Select-Object -First 1)"
}

# Find pg bin
$pgBin = (Get-Command psql -ErrorAction SilentlyContinue)?.Source | Split-Path
if (-not $pgBin) {
  @("16","17","15","14") | ForEach-Object {
    $p = "C:\Program Files\PostgreSQL\$_\bin"
    if (Test-Path "$p\psql.exe" -and -not $pgBin) { $pgBin = $p; $env:PATH = "$p;$env:PATH" }
  }
}

# ════════════════════════════════════════════════════════
#  [2] Install Memurai (Redis for Windows)
# ════════════════════════════════════════════════════════
Step 2 "Checking Redis (Memurai)..."
$memurai = Get-Service "Memurai" -ErrorAction SilentlyContinue
$redisCli = Get-Command redis-cli -ErrorAction SilentlyContinue
if ($memurai -or $redisCli) {
  OK "Redis/Memurai already installed"
  if ($memurai -and $memurai.Status -ne "Running") {
    Start-Service "Memurai" -ErrorAction SilentlyContinue
    OK "Memurai service started"
  }
} else {
  Info "Installing Memurai (Redis for Windows)..."
  winget install Memurai.MemuraiDeveloper --silent --accept-package-agreements --accept-source-agreements
  Start-Sleep -Seconds 5
  Start-Service "Memurai" -ErrorAction SilentlyContinue
  OK "Memurai installed and started"
}

# ════════════════════════════════════════════════════════
#  [3] Create PostgreSQL DB + User
# ════════════════════════════════════════════════════════
Step 3 "Setting up database..."
$pgBinFull = if ($pgBin) { $pgBin } else { "C:\Program Files\PostgreSQL\16\bin" }
$psqlExe   = "$pgBinFull\psql.exe"
$pgData    = "C:\Program Files\PostgreSQL\16\data"

# Start PostgreSQL service
$pgSvc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgSvc) {
  if ($pgSvc.Status -ne "Running") { Start-Service $pgSvc.Name }
  OK "PostgreSQL service running: $($pgSvc.Name)"
}

if (Test-Path $psqlExe) {
  # Create user (ignore error if exists)
  $env:PGPASSWORD = "postgres"
  $createUser = "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' CREATEDB; END IF; END `$`$;"
  & $psqlExe -U postgres -c $createUser 2>&1 | Out-Null

  # Create database (ignore error if exists)
  $createDb = "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'"
  $dbExists = & $psqlExe -U postgres -t -c $createDb 2>&1
  if ($dbExists -notmatch "1") {
    & $psqlExe -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>&1 | Out-Null
  }
  OK "Database '$DB_NAME' ready, user '$DB_USER' ready"
} else {
  Warn "psql not found at $psqlExe — DB setup skipped"
  Info "Manually create: CREATE DATABASE mushaira_db; CREATE USER mushaira_user WITH PASSWORD 'mushaira_dev_pass';"
}

# ════════════════════════════════════════════════════════
#  [4] Write .env file
# ════════════════════════════════════════════════════════
Step 4 "Writing API server .env file..."
$envPath = Join-Path $ApiDir ".env"
if (-not (Test-Path $envPath)) {
  $envContent = @"
# ─── Application ────────────────────────────────────────
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
APP_NAME="Mushaira Platform API"

# ─── Database ────────────────────────────────────────────
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?schema=public"

# ─── Redis ───────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=
REDIS_DB=0

# ─── JWT ─────────────────────────────────────────────────
JWT_SECRET=mushaira_dev_jwt_secret_key_min_32_chars_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=mushaira_dev_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# ─── QR Pass ─────────────────────────────────────────────
QR_SECRET=mushaira_dev_qr_signing_secret_min_32_chars
QR_EXPIRY_HOURS=48

# ─── WhatsApp (dry-run for dev) ───────────────────────────
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=dev_phone_number_id
WHATSAPP_ACCESS_TOKEN=dev_access_token
WHATSAPP_TEMPLATE_OTP=otp_verification
WHATSAPP_TEMPLATE_RECEIVED=registration_received
WHATSAPP_TEMPLATE_APPROVAL=registration_approved
WHATSAPP_TEMPLATE_REJECTION=registration_rejected
WHATSAPP_TEMPLATE_REMINDER=event_reminder
WHATSAPP_TEMPLATE_EVENT_LIVE=event_live
WHATSAPP_TEMPLATE_THANK_YOU=event_thank_you

# ─── Email (dry-run for dev) ──────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dev@example.com
SMTP_PASS=dev_password
SMTP_FROM="Mushaira Platform <noreply@jashneurdu.org>"

# ─── Notifications ───────────────────────────────────────
NOTIFICATION_DRY_RUN=true

# ─── OTP ─────────────────────────────────────────────────
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

# ─── Rate Limiting ───────────────────────────────────────
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_OTP_TTL=300
THROTTLE_OTP_LIMIT=5

# ─── Storage ─────────────────────────────────────────────
STORAGE_PROVIDER=local
AWS_S3_BUCKET=mushaira-assets
AWS_S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=dev_key
AWS_SECRET_ACCESS_KEY=dev_secret
CLOUDFRONT_URL=http://localhost:3000

# ─── Super Admin Seed ────────────────────────────────────
SUPER_ADMIN_MOBILE=+919999999999
SUPER_ADMIN_NAME="Platform Admin"
"@
  $envContent | Set-Content $envPath
  OK ".env written to $envPath"
} else {
  OK ".env already exists — skipping"
}

# ════════════════════════════════════════════════════════
#  [5] Install npm dependencies
# ════════════════════════════════════════════════════════
Step 5 "Installing npm dependencies..."

# API Server
if (-not (Test-Path "$ApiDir\node_modules\@nestjs")) {
  Info "API server dependencies..."
  Push-Location $ApiDir; npm install --legacy-peer-deps 2>&1 | Out-Null; Pop-Location
}
OK "API server dependencies ready"

# Super Admin
if (-not (Test-Path "$SuperDir\node_modules\next")) {
  Info "Super Admin dependencies..."
  Push-Location $SuperDir; npm install --legacy-peer-deps 2>&1 | Out-Null; Pop-Location
}
OK "Super Admin dependencies ready"

# Organiser Admin
if (-not (Test-Path "$OrgDir\node_modules\next")) {
  Info "Organiser Admin dependencies..."
  Push-Location $OrgDir; npm install --legacy-peer-deps 2>&1 | Out-Null; Pop-Location
}
OK "Organiser Admin dependencies ready"

# ════════════════════════════════════════════════════════
#  [6] Prisma generate + migrate + seed
# ════════════════════════════════════════════════════════
Step 6 "Setting up database schema + seed data..."
Push-Location $ApiDir
  Info "Generating Prisma client..."
  npx prisma generate 2>&1 | Out-Null
  Info "Running migrations..."
  npx prisma migrate deploy 2>&1 | Write-Host
  Info "Seeding database (super admin account)..."
  npx prisma db seed 2>&1 | Write-Host
Pop-Location
OK "Database schema and seed complete"

# ════════════════════════════════════════════════════════
#  [7] Write admin .env files
# ════════════════════════════════════════════════════════
Step 7 "Writing admin panel .env files..."
$adminEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
"@

$superEnvPath = Join-Path $SuperDir ".env.local"
if (-not (Test-Path $superEnvPath)) { $adminEnv | Set-Content $superEnvPath }

$orgEnvPath = Join-Path $OrgDir ".env.local"
if (-not (Test-Path $orgEnvPath)) { $adminEnv | Set-Content $orgEnvPath }
OK "Admin .env files ready"

# ════════════════════════════════════════════════════════
#  [8] Launch all servers in new terminals
# ════════════════════════════════════════════════════════
Step 8 "Launching servers..."

# API Server
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$ApiDir'; Write-Host '`n  [API SERVER] Starting on http://localhost:3000`n' -ForegroundColor Green; npm run start:dev`"" -WindowStyle Normal

Start-Sleep -Seconds 3

# Super Admin
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$SuperDir'; Write-Host '`n  [SUPER ADMIN] Starting on http://localhost:3002`n' -ForegroundColor Cyan; npm run dev`"" -WindowStyle Normal

Start-Sleep -Seconds 2

# Organiser Admin
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$OrgDir'; Write-Host '`n  [ORGANISER ADMIN] Starting on http://localhost:3001`n' -ForegroundColor Magenta; npm run dev`"" -WindowStyle Normal

Start-Sleep -Seconds 8

# Open browsers
Start-Process "http://localhost:3002"
Start-Sleep -Seconds 1
Start-Process "http://localhost:3001"

# ── Final Summary ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔═════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║         ✅  ALL SERVERS LAUNCHED!                       ║" -ForegroundColor Green
Write-Host "  ╚═════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 API Server      → http://localhost:3000/api/v1"      -ForegroundColor White
Write-Host "  📄 API Docs        → http://localhost:3000/api/v1/docs"  -ForegroundColor White
Write-Host "  👑 Super Admin     → http://localhost:3002"              -ForegroundColor Cyan
Write-Host "  🗂  Organiser Admin → http://localhost:3001"             -ForegroundColor Magenta
Write-Host ""
Write-Host "  ── Login credentials (seeded) ───────────────────────────" -ForegroundColor DarkGray
Write-Host "  Super Admin mobile : +919999999999"                      -ForegroundColor Yellow
Write-Host "  OTP (dry-run)      : Check the API server terminal"      -ForegroundColor Yellow
Write-Host ""
Write-Host "  ── Stop all servers ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Close the 3 PowerShell windows that opened"              -ForegroundColor Gray
Write-Host ""
