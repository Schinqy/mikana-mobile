# ============================================================
#  Mikana Dev Startup Script
#  Usage:    .\dev.ps1          (auto-detects USB vs Wi-Fi)
#  USB:      ADB reverse tunnel is used (most reliable)
#  Wi-Fi:    Direct LAN IP is used (requires firewall rule)
# ============================================================

# Self-elevate for firewall rule if not already admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
  Write-Host "  Requesting admin rights for firewall rule..." -ForegroundColor Yellow
  $args = "-File `"$PSCommandPath`""
  Start-Process powershell -Verb RunAs -ArgumentList $args
  exit
}

Write-Host ""
Write-Host "  MIKANA DEV STARTUP" -ForegroundColor Cyan
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray

# 1. Open Windows Firewall port 3005 (one-time, idempotent)
$existingRule = Get-NetFirewallRule -DisplayName "Mikana Relay :3005" -ErrorAction SilentlyContinue
if (-not $existingRule) {
  New-NetFirewallRule -DisplayName "Mikana Relay :3005" -Direction Inbound -Protocol TCP -LocalPort 3005 -Action Allow -Profile Any | Out-Null
  Write-Host "  [FIREWALL] Port 3005 opened for inbound connections." -ForegroundColor Green
} else {
  Write-Host "  [FIREWALL] Port 3005 rule already exists. OK." -ForegroundColor DarkGray
}

# 2. ADB reverse if USB device connected (preferred)
Write-Host ""
$adbDevices = adb devices 2>&1
$usbConnected = ($adbDevices | Select-String "device$").Count -gt 0

if ($usbConnected) {
  Write-Host "  [1/3] USB device detected — setting ADB reverse tunnel..." -ForegroundColor Yellow
  adb reverse tcp:3005 tcp:3005 | Out-Null
  Write-Host "  ADB tunnel active: device:3005 -> PC:3005" -ForegroundColor Green
  Write-Host "  Relay URL on device: http://localhost:3005" -ForegroundColor DarkGray
} else {
  $lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
  Write-Host "  [1/3] No USB device — Wi-Fi mode. PC IP: $lanIp" -ForegroundColor Yellow
  Write-Host "  Relay URL on device: http://${lanIp}:3005" -ForegroundColor DarkGray
  Write-Host "  Make sure phone is on the same Wi-Fi network." -ForegroundColor DarkGray
}

# 3. Kill stale relay and restart
Write-Host ""
Write-Host "  [2/3] Starting relay server on :3005..." -ForegroundColor Yellow
$existingPid = (Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if ($existingPid) {
  Write-Host "  Killing stale process (PID $existingPid)..." -ForegroundColor DarkGray
  Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 600
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\Code\mikana-mobile'; node server/index.js" -WindowStyle Normal
Write-Host "  Relay server starting in new window..." -ForegroundColor Green
Start-Sleep -Seconds 2

# 4. Start Expo Metro
Write-Host ""
Write-Host "  [3/3] Starting Expo Metro bundler..." -ForegroundColor Yellow
Write-Host ""

Set-Location "E:\Code\mikana-mobile"
npx expo start --dev-client
