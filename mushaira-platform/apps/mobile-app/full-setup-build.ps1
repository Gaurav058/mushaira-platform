# ═══════════════════════════════════════════════════════════════════════════════
#  full-setup-build.ps1  —  Mushaira Full Android APK Builder
#  Installs Android SDK (if needed) then builds the APK automatically.
#
#  REQUIREMENTS: Java 17+, Node.js 18+
#  RUN AS ADMINISTRATOR (right-click PowerShell → "Run as administrator")
#
#  Usage:
#    powershell -ExecutionPolicy Bypass -File full-setup-build.ps1
#    powershell -ExecutionPolicy Bypass -File full-setup-build.ps1 -ApiUrl "http://192.168.1.x:3000/api/v1"
# ═══════════════════════════════════════════════════════════════════════════════
param(
  [string]$ApiUrl     = "",
  [string]$SdkRoot    = "C:\Android\Sdk",
  [switch]$SkipSdkInstall = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"   # Speeds up Invoke-WebRequest
$BuildStart            = Get-Date
$ScriptDir             = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Helpers ───────────────────────────────────────────────────────────────────
function Banner($msg, $color = "Magenta") {
  $line = "─" * ($msg.Length + 4)
  Write-Host ""
  Write-Host "  ╔$line╗" -ForegroundColor $color
  Write-Host "  ║  $msg  ║" -ForegroundColor $color
  Write-Host "  ╚$line╝" -ForegroundColor $color
}
function Step($n, $total, $msg)  { Write-Host "`n  [$n/$total] $msg" -ForegroundColor Cyan }
function OK($msg)                { Write-Host "      ✅ $msg" -ForegroundColor Green }
function Warn($msg)              { Write-Host "      ⚠️  $msg" -ForegroundColor Yellow }
function Fail($msg)              { Write-Host "      ❌ $msg" -ForegroundColor Red; exit 1 }
function Info($msg)              { Write-Host "         $msg" -ForegroundColor Gray }

# ── Banner ────────────────────────────────────────────────────────────────────
Banner "🎤  Mushaira Android APK  Full Setup + Build  🎤"

# ─── [0] Pre-flight ──────────────────────────────────────────────────────────
Write-Host "`n  Checking system requirements..." -ForegroundColor Yellow

# Java
try {
  $jv = (java -version 2>&1)[0].ToString()
  OK "Java: $jv"
} catch { Fail "Java not found. Install JDK 17 from https://adoptium.net" }

# Node
try {
  $nv = node --version
  OK "Node.js: $nv"
} catch { Fail "Node.js not found. Install from https://nodejs.org" }

# API URL
if ($ApiUrl -ne "") {
  $env:EXPO_PUBLIC_API_URL = $ApiUrl
  OK "API URL (param): $ApiUrl"
} elseif ($env:EXPO_PUBLIC_API_URL) {
  OK "API URL (env):   $env:EXPO_PUBLIC_API_URL"
} elseif (Test-Path "$ScriptDir\.env.local") {
  $line = Get-Content "$ScriptDir\.env.local" | Where-Object { $_ -match "EXPO_PUBLIC_API_URL" } | Select-Object -First 1
  if ($line) {
    $env:EXPO_PUBLIC_API_URL = ($line -split "=", 2)[1].Trim()
    OK "API URL (.env):  $env:EXPO_PUBLIC_API_URL"
  }
}
if (-not $env:EXPO_PUBLIC_API_URL) {
  Warn "EXPO_PUBLIC_API_URL not set. Using local IP for same-network devices."
  # Auto-detect local IP
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1).IPAddress
  if ($ip) {
    $env:EXPO_PUBLIC_API_URL = "http://${ip}:3000/api/v1"
    OK "Auto-detected API URL: $env:EXPO_PUBLIC_API_URL"
  } else {
    $env:EXPO_PUBLIC_API_URL = "http://localhost:3000/api/v1"
    Warn "Defaulting to localhost (will only work in emulator)"
  }
}

$TOTAL_STEPS = 7

# ─── [1] Android SDK ─────────────────────────────────────────────────────────
Step 1 $TOTAL_STEPS "Setting up Android SDK..."

# Check if SDK already exists
$sdkmanager = "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"
$adb        = "$SdkRoot\platform-tools\adb.exe"

if ($SkipSdkInstall -or (Test-Path $adb)) {
  OK "Android SDK found at $SdkRoot"
} else {
  Info "Downloading Android Command Line Tools (~150 MB)..."
  $cmdUrl  = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
  $cmdZip  = "$env:TEMP\android-cmdtools.zip"
  $cmdDest = "$SdkRoot\cmdline-tools"

  New-Item -ItemType Directory -Force -Path $cmdDest | Out-Null
  Invoke-WebRequest -Uri $cmdUrl -OutFile $cmdZip
  OK "Download complete"

  Info "Extracting cmdline-tools..."
  Expand-Archive -Path $cmdZip -DestinationPath $cmdDest -Force
  # sdkmanager requires the folder to be named 'latest'
  $extracted = Get-ChildItem $cmdDest -Directory | Where-Object { $_.Name -ne "latest" } | Select-Object -First 1
  if ($extracted) {
    if (Test-Path "$cmdDest\latest") { Remove-Item "$cmdDest\latest" -Recurse -Force }
    Rename-Item $extracted.FullName "latest"
  }
  OK "Extracted to $cmdDest\latest"
  Remove-Item $cmdZip -Force -ErrorAction SilentlyContinue

  # Set ANDROID_HOME for this session
  $env:ANDROID_HOME = $SdkRoot
  $env:PATH = "$SdkRoot\cmdline-tools\latest\bin;$SdkRoot\platform-tools;$env:PATH"

  # Accept licenses
  Info "Accepting SDK licenses..."
  "y`ny`ny`ny`ny`ny`ny`ny" | & $sdkmanager --licenses --sdk_root=$SdkRoot | Out-Null

  # Install required packages
  Info "Installing SDK packages (build-tools, platform-tools, android-34)..."
  Info "This downloads ~400 MB — please wait..."
  & $sdkmanager --sdk_root=$SdkRoot "platform-tools" "build-tools;34.0.0" "platforms;android-34" "cmdline-tools;latest"

  # Persist ANDROID_HOME in user environment
  [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $SdkRoot, "User")
  $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
  if ($userPath -notlike "*$SdkRoot\platform-tools*") {
    [System.Environment]::SetEnvironmentVariable(
      "PATH",
      "$userPath;$SdkRoot\cmdline-tools\latest\bin;$SdkRoot\platform-tools",
      "User"
    )
  }
  OK "Android SDK installed and configured at $SdkRoot"
}

$env:ANDROID_HOME = $SdkRoot
$env:PATH = "$SdkRoot\cmdline-tools\latest\bin;$SdkRoot\platform-tools;$env:PATH"

# ─── [2] Assets ──────────────────────────────────────────────────────────────
Step 2 $TOTAL_STEPS "Downloading app assets (icons, splash screen)..."
Push-Location $ScriptDir
  node setup-assets.js
Pop-Location
OK "Assets ready"

# ─── [3] npm install ─────────────────────────────────────────────────────────
Step 3 $TOTAL_STEPS "Installing npm dependencies..."
Push-Location $ScriptDir
  npm install --legacy-peer-deps 2>&1 | Tee-Object -Variable npmOut | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail "npm install failed. Check output above." }
Pop-Location
OK "Dependencies installed"

# ─── [4] Expo Prebuild ───────────────────────────────────────────────────────
Step 4 $TOTAL_STEPS "Generating native Android project (expo prebuild)..."
Info "This generates the android/ folder from app.json config."
Push-Location $ScriptDir
  npx expo prebuild --platform android --clean
  if ($LASTEXITCODE -ne 0) { Fail "expo prebuild failed." }
Pop-Location
OK "Native Android project generated"

# ─── [5] Set Gradle Java 17 ──────────────────────────────────────────────────
Step 5 $TOTAL_STEPS "Configuring Gradle build environment..."
$gradleProps = "$ScriptDir\android\gradle.properties"
if (Test-Path $gradleProps) {
  $content = Get-Content $gradleProps -Raw
  if ($content -notmatch "org.gradle.java.home") {
    # Find Java home
    $javaHome = (Get-Command java).Source | Split-Path | Split-Path
    Add-Content $gradleProps "`norg.gradle.java.home=$($javaHome.Replace('\','\\'))"
    OK "Java home set in gradle.properties"
  } else {
    OK "Gradle properties already configured"
  }
}

# Increase Gradle memory for faster builds
$gradlePropsContent = Get-Content $gradleProps -Raw
if ($gradlePropsContent -notmatch "org.gradle.jvmargs") {
  Add-Content $gradleProps "`norg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m"
  Add-Content $gradleProps "org.gradle.parallel=true"
  Add-Content $gradleProps "org.gradle.caching=true"
}
OK "Gradle configured"

# ─── [6] Build APK ───────────────────────────────────────────────────────────
Step 6 $TOTAL_STEPS "Building APK with Gradle..."
Info "First run downloads ~200MB of Gradle files. Subsequent builds are faster."
Info "Estimated time: 5–10 min (first run) / 2–4 min (subsequent)"

Push-Location "$ScriptDir\android"
  .\gradlew.bat assembleDebug --no-daemon --warning-mode=none
  $buildExit = $LASTEXITCODE
Pop-Location

if ($buildExit -ne 0) { Fail "Gradle build failed. Check output above." }

# ─── [7] Package APK ─────────────────────────────────────────────────────────
Step 7 $TOTAL_STEPS "Packaging final APK..."

$apkSrc    = "$ScriptDir\android\app\build\outputs\apk\debug\app-debug.apk"
$apkDst    = "$ScriptDir\Mushaira-debug.apk"
$desktopDst = "$env:USERPROFILE\Desktop\Mushaira-debug.apk"

if (-not (Test-Path $apkSrc)) {
  Fail "APK not found at: $apkSrc"
}

Copy-Item $apkSrc $apkDst -Force
Copy-Item $apkSrc $desktopDst -Force   # Also copy to Desktop for easy access

$sizeMB  = [math]::Round((Get-Item $apkDst).Length / 1MB, 1)
$elapsed = [math]::Round(((Get-Date) - $BuildStart).TotalMinutes, 1)

# ── Final Summary ─────────────────────────────────────────────────────────────
Banner "✅  BUILD SUCCESSFUL" "Green"
Write-Host ""
Write-Host "  📱 APK File   :  $apkDst"     -ForegroundColor White
Write-Host "  🖥  Desktop   :  $desktopDst"  -ForegroundColor White
Write-Host "  📦 Size       :  ${sizeMB} MB" -ForegroundColor White
Write-Host "  ⏱  Build Time :  ${elapsed} min" -ForegroundColor White
Write-Host "  🌐 API Server :  $env:EXPO_PUBLIC_API_URL" -ForegroundColor White
Write-Host ""
Write-Host "  ────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  📤 TO INSTALL VIA USB:" -ForegroundColor Yellow
Write-Host "     adb install `"$apkDst`"" -ForegroundColor White
Write-Host ""
Write-Host "  📤 TO SHARE VIA WHATSAPP:" -ForegroundColor Yellow
Write-Host "     1. Send Mushaira-debug.apk from your Desktop via WhatsApp" -ForegroundColor Gray
Write-Host "     2. Receiver: Settings → Apps → Install unknown apps → WhatsApp → Allow" -ForegroundColor Gray
Write-Host "     3. Open the downloaded file → Install" -ForegroundColor Gray
Write-Host ""

# Open Desktop folder
explorer.exe $env:USERPROFILE\Desktop
