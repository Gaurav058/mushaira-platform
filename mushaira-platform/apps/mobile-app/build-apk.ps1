# ──────────────────────────────────────────────────────────────────────────────
#  build-apk.ps1  —  Mushaira Android APK Builder (Windows)
#  Run from: mushaira-platform\apps\mobile-app\
#  Requirements: Node.js 20+, JDK 17+, Android Studio + SDK
# ──────────────────────────────────────────────────────────────────────────────
param (
  [string]$ApiUrl = ""
)

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

function Write-Step($n, $msg) {
  Write-Host ""
  Write-Host "  [$n/5] $msg" -ForegroundColor Cyan
}

function Write-OK($msg)  { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info($msg){ Write-Host "     $msg" -ForegroundColor Gray }

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║    🎤  Mushaira APK Builder  🎤           ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Magenta

# ── Pre-flight checks ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Pre-flight checks..." -ForegroundColor Yellow

# Java
try {
  $jv = (java -version 2>&1)[0].ToString()
  Write-OK "Java: $jv"
} catch {
  Write-Err "Java not found. Install JDK 17 from https://adoptium.net"
  exit 1
}

# Node
try {
  $nv = node --version
  Write-OK "Node.js: $nv"
} catch {
  Write-Err "Node.js not found. Install from https://nodejs.org"
  exit 1
}

# ANDROID_HOME
if (-not $env:ANDROID_HOME) {
  $defaultSdk = "$env:LOCALAPPDATA\Android\Sdk"
  if (Test-Path $defaultSdk) {
    $env:ANDROID_HOME = $defaultSdk
    Write-OK "ANDROID_HOME auto-detected: $defaultSdk"
  } else {
    Write-Err "ANDROID_HOME is not set."
    Write-Info "1. Install Android Studio: https://developer.android.com/studio"
    Write-Info "2. Open SDK Manager and install 'Android 14 (API 34)'"
    Write-Info "3. Then run:"
    Write-Info "   [Environment]::SetEnvironmentVariable('ANDROID_HOME', `"$env:LOCALAPPDATA\Android\Sdk`", 'User')"
    exit 1
  }
}

# API URL
if ($ApiUrl -ne "") {
  Write-Info "API URL override: $ApiUrl"
  $env:EXPO_PUBLIC_API_URL = $ApiUrl
} elseif ($env:EXPO_PUBLIC_API_URL) {
  Write-OK "EXPO_PUBLIC_API_URL: $env:EXPO_PUBLIC_API_URL"
} else {
  # Try to read from .env.local
  if (Test-Path ".env.local") {
    $envLine = Get-Content ".env.local" | Where-Object { $_ -match "EXPO_PUBLIC_API_URL" } | Select-Object -First 1
    if ($envLine) {
      $env:EXPO_PUBLIC_API_URL = ($envLine -split "=", 2)[1].Trim()
      Write-OK "EXPO_PUBLIC_API_URL loaded from .env.local: $env:EXPO_PUBLIC_API_URL"
    }
  }
  if (-not $env:EXPO_PUBLIC_API_URL) {
    Write-Host ""
    Write-Host "  ⚠️  EXPO_PUBLIC_API_URL is not set." -ForegroundColor Yellow
    Write-Info "  Create .env.local with your API server address, e.g.:"
    Write-Info "  EXPO_PUBLIC_API_URL=http://192.168.0.103:3000/api/v1"
    Write-Host ""
    $confirm = Read-Host "  Continue with localhost? (not recommended) [y/N]"
    if ($confirm -ne "y") { exit 1 }
    $env:EXPO_PUBLIC_API_URL = "http://localhost:3000/api/v1"
  }
}

# ── Step 1: Assets ─────────────────────────────────────────────────────────────
Write-Step 1 "Downloading placeholder assets..."
node setup-assets.js
Write-OK "Assets ready"

# ── Step 2: Install deps ───────────────────────────────────────────────────────
Write-Step 2 "Installing npm dependencies..."
npm install --legacy-peer-deps
Write-OK "Dependencies installed"

# ── Step 3: Prebuild ──────────────────────────────────────────────────────────
Write-Step 3 "Generating native Android project (expo prebuild)..."
Write-Info "This modifies/creates the android/ folder"
npx expo prebuild --platform android --clean
Write-OK "Native project generated"

# ── Step 4: Gradle build ──────────────────────────────────────────────────────
Write-Step 4 "Building APK with Gradle (this takes 3–8 minutes on first run)..."
Push-Location android
  .\gradlew.bat assembleDebug --no-daemon
Pop-Location
Write-OK "Gradle build complete"

# ── Step 5: Copy APK ──────────────────────────────────────────────────────────
Write-Step 5 "Packaging final APK..."

$apkSrc  = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDst  = "Mushaira-debug.apk"

if (Test-Path $apkSrc) {
  Copy-Item $apkSrc $apkDst -Force
  $sizeMb  = [math]::Round((Get-Item $apkDst).Length / 1MB, 1)
  $elapsed = [math]::Round(((Get-Date) - $StartTime).TotalMinutes, 1)
  $fullPath = (Get-Item $apkDst).FullName

  Write-Host ""
  Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "  ║       ✅  APK BUILT SUCCESSFULLY          ║" -ForegroundColor Green
  Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Green
  Write-Host ""
  Write-Host "  📱 File  :  $fullPath" -ForegroundColor White
  Write-Host "  📦 Size  :  ${sizeMb} MB" -ForegroundColor White
  Write-Host "  ⏱  Time  :  ${elapsed} min" -ForegroundColor White
  Write-Host ""
  Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
  Write-Host "  To install via USB:" -ForegroundColor Yellow
  Write-Host "    adb install $apkDst" -ForegroundColor White
  Write-Host ""
  Write-Host "  To share via WhatsApp:" -ForegroundColor Yellow
  Write-Host "    Send the file: $fullPath" -ForegroundColor White
  Write-Host "    (Receiver must allow 'Install unknown apps' in Android settings)" -ForegroundColor Gray
  Write-Host ""
} else {
  Write-Err "APK not found at expected path: $apkSrc"
  Write-Info "Check the Gradle output above for errors."
  exit 1
}
