$ErrorActionPreference = "Stop"

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$cronProcess = $null

Write-Host "Starting local demo activity cron..."
$cronProcess = Start-Process `
  -FilePath "powershell" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "npm run db:demo-activity-cron") `
  -WorkingDirectory $backendRoot `
  -WindowStyle Hidden `
  -PassThru

try {
  powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-local-stack.ps1")
} finally {
  if ($cronProcess -and -not $cronProcess.HasExited) {
    Write-Host "Stopping local demo activity cron..."
    Stop-Process -Id $cronProcess.Id -Force
  }
}
