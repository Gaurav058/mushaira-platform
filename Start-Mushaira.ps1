param(
  [ValidateSet("web","phone","both")]
  [string]$Mode = "both"
)

$ErrorActionPreference = "SilentlyContinue"
$AppDir = "mushaira-platform\apps\mobile-app"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   🎤  Mushaira — Start Dev Preview   🎤  ║" -ForegroundColor Magenta
Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── Step 1: Dependencies ──────────────────────────────────────────────────────
if (-not (Test-Path "$AppDir\node_modules\expo")) {
  Write-Host "  📦 Installing dependencies..." -ForegroundColor Cyan
  Push-Location $AppDir
    npm install --legacy-peer-deps 2>&1 | Out-Null
  Pop-Location
  Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
}

# ── Step 2: Assets ────────────────────────────────────────────────────────────
if (-not (Test-Path "$AppDir\assets\icon.png")) {
  Write-Host "  🖼  Downloading app icons..." -ForegroundColor Cyan
  Push-Location $AppDir
    node setup-assets.js 2>&1 | Out-Null
  Pop-Location
  Write-Host "  ✅ Assets ready" -ForegroundColor Green
}

# ── Step 3: Set API URL ───────────────────────────────────────────────────────
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -eq "Dhcp" } |
  Select-Object -First 1).IPAddress

if ($ip) {
  $apiUrl = "http://${ip}:3000/api/v1"
} else {
  $apiUrl = "http://localhost:3000/api/v1"
}

Write-Host ""
Write-Host "  🌐 API Server: $apiUrl" -ForegroundColor Yellow
Write-Host "     (Make sure your NestJS backend is running on port 3000)" -ForegroundColor Gray

# Write .env.local for this session
"EXPO_PUBLIC_API_URL=$apiUrl" | Set-Content "$AppDir\.env.local"

# ── Step 4: Launch ────────────────────────────────────────────────────────────
Write-Host ""

switch ($Mode) {
  "web" {
    Write-Host "  🖥  Opening in BROWSER..." -ForegroundColor Green
    Write-Host "  → http://localhost:8081 will open automatically" -ForegroundColor Gray
    Write-Host ""
    Push-Location $AppDir
      npx expo start --web --port 8081
    Pop-Location
  }
  "phone" {
    Write-Host "  📱 Starting EXPO GO mode (scan QR with phone)..." -ForegroundColor Green
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  On your Android phone:" -ForegroundColor Yellow
    Write-Host "    1. Open Google Play → Install 'Expo Go'" -ForegroundColor White
    Write-Host "    2. Make sure phone is on the same WiFi" -ForegroundColor White
    Write-Host "    3. Open Expo Go → Scan the QR code below" -ForegroundColor White
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    Push-Location $AppDir
      npx expo start
    Pop-Location
  }
  default {
    Write-Host "  Starting BOTH web browser + Expo Go QR code..." -ForegroundColor Green
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  VIEW OPTIONS:" -ForegroundColor Yellow
    Write-Host "    Browser : Press 'w' in the terminal below" -ForegroundColor White
    Write-Host "    Android : Install Expo Go → Scan the QR code" -ForegroundColor White
    Write-Host "    Emulator: Press 'a' if Android Studio is running" -ForegroundColor White
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    Push-Location $AppDir
      npx expo start
    Pop-Location
  }
}
