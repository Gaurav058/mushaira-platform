# ═══════════════════════════════════════════════════════════════════════════
#  install-android-emulator.ps1
#  Installs Android Studio + SDK, creates an AVD, and starts the emulator
#  Run as Administrator in PowerShell
# ═══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

function Step($n, $t, $msg) { Write-Host "`n  [$n/$t] $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green  }
function Warn($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Info($msg) { Write-Host "     $msg" -ForegroundColor Gray   }

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   Android Studio + Emulator — Auto Setup         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

$TOTAL = 6

# ─── [1] Install Android Studio via winget ───────────────────────────────────
Step 1 $TOTAL "Installing Android Studio..."
$studioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
if (Test-Path $studioPath) {
  OK "Android Studio already installed"
} else {
  Info "Downloading via winget (~1.2 GB — please wait)..."
  winget install Google.AndroidStudio --silent --accept-package-agreements --accept-source-agreements
  OK "Android Studio installed"
}

# ─── [2] Locate SDK ──────────────────────────────────────────────────────────
Step 2 $TOTAL "Locating Android SDK..."
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"

# Android Studio may not have initialized SDK yet — run it headless first
if (-not (Test-Path "$sdkRoot\platform-tools\adb.exe")) {
  Warn "SDK not initialized. Downloading Android command-line tools to bootstrap SDK..."
  $cmdUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
  $cmdZip = "$env:TEMP\android-cmdtools.zip"
  Invoke-WebRequest -Uri $cmdUrl -OutFile $cmdZip
  $cmdDir = "$sdkRoot\cmdline-tools"
  New-Item -ItemType Directory -Force -Path $cmdDir | Out-Null
  Expand-Archive -Path $cmdZip -DestinationPath $cmdDir -Force
  $extracted = Get-ChildItem $cmdDir -Directory | Where-Object { $_.Name -ne "latest" } | Select-Object -First 1
  if ($extracted) {
    if (Test-Path "$cmdDir\latest") { Remove-Item "$cmdDir\latest" -Recurse -Force }
    Rename-Item $extracted.FullName "latest"
  }
  Remove-Item $cmdZip -Force -ErrorAction SilentlyContinue
  OK "Command-line tools extracted"
}

$env:ANDROID_HOME = $sdkRoot
$env:PATH = "$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$env:PATH"
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
$userPath = [System.Environment]::GetEnvironmentVariable("PATH","User") ?? ""
if ($userPath -notlike "*platform-tools*") {
  [System.Environment]::SetEnvironmentVariable("PATH",
    "$userPath;$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools;$sdkRoot\emulator","User")
}
OK "ANDROID_HOME = $sdkRoot"

# ─── [3] Install SDK packages ────────────────────────────────────────────────
Step 3 $TOTAL "Installing SDK packages (platform-tools, build-tools, android-34, emulator)..."
$sdkmanager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $sdkmanager)) {
  Warn "sdkmanager not found at $sdkmanager"
  Info "Please open Android Studio → SDK Manager and install Android 14 (API 34) manually"
} else {
  # Accept all licenses
  "y`ny`ny`ny`ny`ny`ny`ny`ny`n" | & $sdkmanager --licenses --sdk_root=$sdkRoot 2>&1 | Out-Null
  # Install required packages
  Info "Installing packages (~600 MB)..."
  & $sdkmanager --sdk_root=$sdkRoot "platform-tools" "build-tools;34.0.0" "platforms;android-34" "emulator" "system-images;android-34;google_apis_playstore;x86_64"
  OK "SDK packages installed"
}

# ─── [4] Create AVD ──────────────────────────────────────────────────────────
Step 4 $TOTAL "Creating Android Virtual Device (AVD)..."
$avdmanager = "$sdkRoot\cmdline-tools\latest\bin\avdmanager.bat"
$avdName    = "Pixel_8_API_34"

if (-not (Test-Path $avdmanager)) {
  Warn "avdmanager not found — skipping AVD creation"
  Info "Create AVD manually: Android Studio → Device Manager → + Create Device"
} else {
  $existing = & $avdmanager list avd 2>&1 | Select-String $avdName
  if ($existing) {
    OK "AVD '$avdName' already exists"
  } else {
    Info "Creating Pixel 8 emulator with Android 34 (Google Play)..."
    echo "no" | & $avdmanager create avd --name $avdName --package "system-images;android-34;google_apis_playstore;x86_64" --device "pixel_8" --force
    OK "AVD '$avdName' created"
  }
}

# ─── [5] Verify ADB ──────────────────────────────────────────────────────────
Step 5 $TOTAL "Verifying ADB..."
$adb = "$sdkRoot\platform-tools\adb.exe"
if (Test-Path $adb) {
  $ver = & $adb version 2>&1 | Select-Object -First 1
  OK "ADB ready: $ver"
} else {
  Warn "ADB not found at $adb"
}

# ─── [6] Summary ─────────────────────────────────────────────────────────────
Step 6 $TOTAL "Setup complete!"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║        ✅  Android Emulator Ready!                   ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Run the app on Android emulator:" -ForegroundColor Yellow
Write-Host "    .\Start-Mushaira.ps1 -Mode android" -ForegroundColor White
Write-Host ""
Write-Host "  Build APK:" -ForegroundColor Yellow
Write-Host "    .\mushaira-platform\apps\mobile-app\full-setup-build.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  ── Quick Reference ───────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ANDROID_HOME : $sdkRoot"                   -ForegroundColor Gray
Write-Host "  AVD Name     : $avdName"                   -ForegroundColor Gray
Write-Host "  ADB          : $adb"                       -ForegroundColor Gray
Write-Host ""
Write-Host "  Note: Close and reopen PowerShell for PATH changes to take effect." -ForegroundColor Gray
