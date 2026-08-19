$ErrorActionPreference = "Stop"

# ── حارس قاعدة البيانات ────────────────────────────────────────────────────
# هذا السكربت يكتب $env:MONGODB_URI فوق قيمة .env، ومتغيّر البيئة يتفوّق
# عليها — فيعمل النظام كله (التطبيق والموقع واللوحتان) على قاعدة محلية بلا
# أي تحذير. بعد نقل البيانات إلى Atlas صار ذلك سلوكاً غير مرغوب افتراضياً.
if ($env:ALLOW_LOCAL_DB -ne "true") {
  Write-Host ""
  Write-Host "  رُفض التشغيل: هذا الأمر يُشغّل الخلفية على قاعدة بيانات محلية." -ForegroundColor Red
  Write-Host ""
  Write-Host "  النظام يعمل الآن على Atlas. للتشغيل:" -ForegroundColor Cyan
  Write-Host "      npm run start:dev"
  Write-Host ""
  Write-Host "  وإن كنت تريد المحلية عمداً (اختبارات أو عمل دون إنترنت):" -ForegroundColor DarkYellow
  Write-Host '      $env:ALLOW_LOCAL_DB="true"; npm run dev:local'
  Write-Host ""
  exit 1
}
Write-Host "  ⚠  ALLOW_LOCAL_DB=true — التشغيل على قاعدة محلية، لا Atlas." -ForegroundColor Yellow



$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$localMongoUri = if ($env:LOCAL_MONGODB_URI) {
  $env:LOCAL_MONGODB_URI
} else {
  "mongodb://127.0.0.1:27017/car_hero"
}

function Test-PortOpen {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(500)
    if ($connected) {
      $client.EndConnect($async)
    }
    $client.Close()
    return $connected
  } catch {
    return $false
  }
}

$startedMongo = $false
$mongoProcess = $null

if (Test-PortOpen -HostName "127.0.0.1" -Port 27017) {
  Write-Host "Local MongoDB is already running on 127.0.0.1:27017"
} else {
  Write-Host "Starting local MongoDB..."
  $mongoOut = Join-Path $backendRoot ".local-mongo.out.log"
  $mongoErr = Join-Path $backendRoot ".local-mongo.err.log"
  Remove-Item -LiteralPath $mongoOut, $mongoErr -Force -ErrorAction SilentlyContinue

  $mongoProcess = Start-Process `
    -FilePath "powershell" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "npm run db:start-local") `
    -WorkingDirectory $backendRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $mongoOut `
    -RedirectStandardError $mongoErr `
    -PassThru
  $startedMongo = $true

  $deadline = (Get-Date).AddSeconds(90)
  while (-not (Test-PortOpen -HostName "127.0.0.1" -Port 27017)) {
    if ($mongoProcess.HasExited) {
      Write-Host "Local MongoDB exited before becoming ready."
      if (Test-Path $mongoOut) {
        Write-Host "Mongo stdout:"
        Get-Content -LiteralPath $mongoOut -Tail 80
      }
      if (Test-Path $mongoErr) {
        Write-Host "Mongo stderr:"
        Get-Content -LiteralPath $mongoErr -Tail 80
      }
      throw "Local MongoDB failed to start. See .local-mongo.out.log and .local-mongo.err.log"
    }

    if ((Get-Date) -gt $deadline) {
      Write-Host "Local MongoDB did not become ready before timeout."
      if (Test-Path $mongoOut) {
        Write-Host "Mongo stdout:"
        Get-Content -LiteralPath $mongoOut -Tail 80
      }
      if (Test-Path $mongoErr) {
        Write-Host "Mongo stderr:"
        Get-Content -LiteralPath $mongoErr -Tail 80
      }
      throw "Local MongoDB did not become ready on 127.0.0.1:27017"
    }
    Start-Sleep -Milliseconds 500
  }

  Write-Host "Local MongoDB is ready."
}

$env:MONGODB_URI = $localMongoUri
Write-Host "Starting backend with local MongoDB: $env:MONGODB_URI"

try {
  npm run start:dev
} finally {
  if ($startedMongo -and $mongoProcess -and -not $mongoProcess.HasExited) {
    Write-Host "Stopping local MongoDB..."
    Stop-Process -Id $mongoProcess.Id -Force
  }
}
