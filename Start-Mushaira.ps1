# ═══════════════════════════════════════════════════════════════════════════
#  Start-Mushaira.ps1  —  Run Mushaira mobile app on any target
#
#  USAGE:
#    .\Start-Mushaira.ps1                       → menu to pick a target
#    .\Start-Mushaira.ps1 -Mode android         → Android emulator (AVD)
#    .\Start-Mushaira.ps1 -Mode web             → Browser (instant, no install)
#    .\Start-Mushaira.ps1 -Mode phone           → Expo Go QR scan on real device
#    .\Start-Mushaira.ps1 -Mode ios             → iOS (macOS + Xcode only)
# ═══════════════════════════════════════════════════════════════════════════
param(
  [ValidateSet("android","ios","web","phone","")]
  [string]$Mode = ""
)

$ErrorActionPreference = "SilentlyContinue"
$Root   = $PSScriptRoot
$AppDir = Join-Path $Root "mushaira-platform\apps\mobile-app"

function Header {
  Write-Host ""
  Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
  Write-Host "  ║   🎤  Mushaira Platform  —  Mobile App  🎤   ║" -ForegroundColor Magenta
  Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
  Write-Host ""
}

function Warn($msg)  { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function OK($msg)    { Write-Host "  ✅ $msg" -ForegroundColor Green  }
function Info($msg)  { Write-Host "     $msg" -ForegroundColor Gray   }
function Step($msg)  { Write-Host "  ▶  $msg" -ForegroundColor Cyan   }

# ── Detect ANDROID_HOME ───────────────────────────────────────────────────────
function Get-AndroidHome {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
  $defaults = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
  )
  foreach ($p in $defaults) { if (Test-Path $p) { return $p } }
  return $null
}

# ── Check Android emulator is running ────────────────────────────────────────
function Test-EmulatorRunning {
  $ah = Get-AndroidHome
  if (-not $ah) { return $false }
  $adb = "$ah\platform-tools\adb.exe"
  if (-not (Test-Path $adb)) { return $false }
  $devices = & $adb devices 2>&1 | Select-String "emulator.*device$"
  return ($null -ne $devices)
}

# ── Ensure dependencies ───────────────────────────────────────────────────────
function Ensure-Deps {
  if (-not (Test-Path "$AppDir\node_modules\expo")) {
    Step "Installing npm dependencies..."
    Push-Location $AppDir
      npm install --legacy-peer-deps 2>&1 | Out-Null
    Pop-Location
    OK "Dependencies installed"
  }
  if (-not (Test-Path "$AppDir\assets\icon.png")) {
    Step "Downloading app icons..."
    Push-Location $AppDir; node setup-assets.js 2>&1 | Out-Null; Pop-Location
    OK "Assets ready"
  }
}

# ── Set API URL ───────────────────────────────────────────────────────────────
function Set-ApiUrl([string]$target) {
  if ($target -eq "android-emulator") {
    # Android emulator uses 10.0.2.2 to reach host machine
    $url = "http://10.0.2.2:3000/api/v1"
  } else {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -eq "Dhcp" } |
      Select-Object -First 1).IPAddress
    $url = if ($ip) { "http://${ip}:3000/api/v1" } else { "http://localhost:3000/api/v1" }
  }
  "EXPO_PUBLIC_API_URL=$url" | Set-Content "$AppDir\.env.local"
  Write-Host "  🌐 API URL  : $url" -ForegroundColor Yellow
  Info "(Backend must be running: cd mushaira-platform\services\api-server && npm run start:dev)"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════
Header

# ── Interactive menu if no mode given ────────────────────────────────────────
if ($Mode -eq "") {
  Write-Host "  Select how you want to run the app:" -ForegroundColor White
  Write-Host ""
  Write-Host "    [1]  Android Emulator  (requires Android Studio + AVD)" -ForegroundColor Cyan
  Write-Host "    [2]  Web Browser       (instant — no install needed)"    -ForegroundColor Green
  Write-Host "    [3]  Real Phone        (Expo Go app — QR scan)"          -ForegroundColor Blue
  Write-Host "    [4]  iOS Simulator     (macOS + Xcode only)"             -ForegroundColor DarkGray
  Write-Host ""
  $choice = Read-Host "  Enter choice [1-4]"
  switch ($choice) {
    "1" { $Mode = "android" }
    "2" { $Mode = "web"     }
    "3" { $Mode = "phone"   }
    "4" { $Mode = "ios"     }
    default { $Mode = "web"; Warn "Invalid choice — defaulting to Web" }
  }
}

Ensure-Deps

# ═══════════ ANDROID EMULATOR ════════════════════════════════════════════════
if ($Mode -eq "android") {
  Write-Host ""
  Write-Host "  ── Android Emulator ────────────────────────────────────" -ForegroundColor Cyan

  $ah = Get-AndroidHome
  if (-not $ah) {
    Write-Host ""
    Warn "Android Studio / SDK not found."
    Write-Host ""
    Write-Host "  Install Android Studio first:" -ForegroundColor Yellow
    Write-Host "    winget install Google.AndroidStudio" -ForegroundColor White
    Write-Host ""
    Write-Host "  Then run this script from:" -ForegroundColor Yellow
    Write-Host "    .\install-android-emulator.ps1   (auto-setup AVD)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or run the app in browser right now:" -ForegroundColor Green
    Write-Host "    .\Start-Mushaira.ps1 -Mode web" -ForegroundColor White
    exit 1
  }

  OK "Android SDK found: $ah"
  $env:ANDROID_HOME = $ah
  $env:PATH = "$ah\platform-tools;$ah\emulator;$ah\tools;$env:PATH"

  # Check if emulator is already running
  if (Test-EmulatorRunning) {
    OK "Android emulator is already running"
  } else {
    # List available AVDs
    $emulatorExe = "$ah\emulator\emulator.exe"
    if (Test-Path $emulatorExe) {
      $avds = & $emulatorExe -list-avds 2>&1 | Where-Object { $_ -notmatch "^$" }
      if ($avds) {
        $avd = $avds | Select-Object -First 1
        Write-Host "  🚀 Starting emulator: $avd" -ForegroundColor Cyan
        Start-Process $emulatorExe -ArgumentList "-avd `"$avd`" -gpu auto -no-snapshot-save" -WindowStyle Normal
        Write-Host "  ⏳ Waiting for emulator to boot (30s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
      } else {
        Warn "No AVDs found. Create one in Android Studio → Device Manager."
        Info "Then re-run this script."
        exit 1
      }
    }
  }

  Set-ApiUrl "android-emulator"

  Write-Host ""
  OK "Launching app on Android emulator..."
  Write-Host "  Press 'a' in the terminal if it doesn't open automatically." -ForegroundColor Gray
  Write-Host ""

  Push-Location $AppDir
    npx expo start --android
  Pop-Location
}

# ═══════════ WEB BROWSER ═════════════════════════════════════════════════════
elseif ($Mode -eq "web") {
  Write-Host ""
  Write-Host "  ── Web Browser Preview ─────────────────────────────────" -ForegroundColor Green

  Set-ApiUrl "web"

  Write-Host ""
  OK "Starting Expo web server..."
  Write-Host "  → Browser opens at: http://localhost:8081" -ForegroundColor White
  Info "Note: Some native features (camera, QR scan) won't work in browser."
  Write-Host ""

  Push-Location $AppDir
    npx expo start --web --port 8081
  Pop-Location
}

# ═══════════ REAL PHONE (EXPO GO) ════════════════════════════════════════════
elseif ($Mode -eq "phone") {
  Write-Host ""
  Write-Host "  ── Real Phone via Expo Go ──────────────────────────────" -ForegroundColor Blue

  Set-ApiUrl "phone"

  Write-Host ""
  Write-Host "  ┌──────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
  Write-Host "  │  SETUP (one time):                                   │" -ForegroundColor White
  Write-Host "  │  1. Install 'Expo Go' from Google Play / App Store   │" -ForegroundColor White
  Write-Host "  │  2. Connect phone to the SAME WiFi as this PC        │" -ForegroundColor White
  Write-Host "  │  3. Android: Open Expo Go → Scan QR code below       │" -ForegroundColor White
  Write-Host "  │     iPhone : Open Camera app → point at QR code      │" -ForegroundColor White
  Write-Host "  └──────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
  Write-Host ""

  Push-Location $AppDir
    npx expo start
  Pop-Location
}

# ═══════════ IOS SIMULATOR ═══════════════════════════════════════════════════
elseif ($Mode -eq "ios") {
  Write-Host ""
  Write-Host "  ── iOS Simulator ───────────────────────────────────────" -ForegroundColor DarkGray
  Write-Host ""

  if ($IsWindows -or $env:OS -eq "Windows_NT") {
    Write-Host "  ❌  iOS Simulator is NOT available on Windows." -ForegroundColor Red
    Write-Host ""
    Write-Host "  iOS development requires:" -ForegroundColor Yellow
    Write-Host "    • macOS (macOS 13 Ventura or later)"       -ForegroundColor White
    Write-Host "    • Xcode 15+ (free from Mac App Store)"     -ForegroundColor White
    Write-Host "    • Apple Developer account (free)"          -ForegroundColor White
    Write-Host ""
    Write-Host "  Alternatives on Windows:" -ForegroundColor Cyan
    Write-Host "    • Test on a real iPhone using Expo Go:"    -ForegroundColor White
    Write-Host "      .\Start-Mushaira.ps1 -Mode phone"        -ForegroundColor Green
    Write-Host "    • Use EAS cloud build for iOS IPA:"         -ForegroundColor White
    Write-Host "      eas build --platform ios --profile preview" -ForegroundColor Green
    Write-Host ""
  } else {
    # macOS
    Set-ApiUrl "ios"
    OK "Starting iOS Simulator..."
    Push-Location $AppDir
      npx expo start --ios
    Pop-Location
  }
}

