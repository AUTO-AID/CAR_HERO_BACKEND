# نقل قاعدة البيانات المحلية إلى Atlas وجعلها المصدر الأساسي.
#
# هذا السكربت هو نظير sync-atlas-to-local.ps1 بالاتجاه المعاكس، لكن بفارق
# جوهري: ذاك يقرأ من Atlas ولا يعدّلها، وهذا **يكتب فوقها ويحذف مجموعاتها**.
# لذلك يأخذ نسخة احتياطية من Atlas قبل أي كتابة، ويطلب تأكيداً صريحاً.
#
#   .\scripts\sync-local-to-atlas.ps1            # مع تأكيد
#   .\scripts\sync-local-to-atlas.ps1 -Force     # بلا تأكيد

param(
  [string]$EnvFile = ".env",
  [string]$LocalUri = "mongodb://127.0.0.1:27017/car_hero",
  [string]$DumpPath = "E:/all_project/CarHero/mongodb-dumps/local-to-atlas.archive.gz",
  [string]$AtlasBackupPath = "",
  [switch]$SkipAtlasBackup,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Resolve-MongoTool {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $defaultPath = "C:\Program Files\MongoDB\Tools\100\bin\$Name.exe"
  if (Test-Path -LiteralPath $defaultPath) { return $defaultPath }
  throw "$Name was not found. Install MongoDB Database Tools and make sure they are available in PATH."
}

function Get-EnvValue {
  param([string]$Path, [string]$Name)
  if (-not (Test-Path -LiteralPath $Path)) { throw "Environment file not found: $Path" }
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^\s*$Name\s*=" } | Select-Object -First 1
  if (-not $line) { throw "$Name was not found in $Path" }
  return ($line -replace "^\s*$Name\s*=\s*", "").Trim().Trim('"').Trim("'")
}

function Get-MongoDatabaseName {
  param([string]$Uri, [string]$Label)
  $withoutQuery = ($Uri -split "\?")[0]
  $slashIndex = $withoutQuery.IndexOf("/", $withoutQuery.IndexOf("://") + 3)
  if ($slashIndex -lt 0 -or $slashIndex -ge ($withoutQuery.Length - 1)) {
    throw "Could not determine database name from $Label URI. Add the database name to the URI path."
  }
  return $withoutQuery.Substring($slashIndex + 1).Trim("/")
}

function Hide-Credentials {
  param([string]$Uri)
  return ($Uri -replace "://[^:@/]+:[^@]+@", "://***:***@")
}

function Test-PortOpen {
  param([string]$HostName, [int]$Port)
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(800)
    if ($ok -and $client.Connected) { $client.Close(); return $true }
    $client.Close(); return $false
  } catch { return $false }
}

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $backendRoot
try {
  $MongoDump    = Resolve-MongoTool -Name "mongodump"
  $MongoRestore = Resolve-MongoTool -Name "mongorestore"

  $AtlasUri = Get-EnvValue -Path $EnvFile -Name "MONGODB_URI"
  $sourceDb = Get-MongoDatabaseName -Uri $LocalUri  -Label "local"
  $targetDb = Get-MongoDatabaseName -Uri $AtlasUri  -Label "Atlas"

  Write-Host ""
  Write-Host "  المصدر (local) : $LocalUri"           -ForegroundColor Cyan
  Write-Host "  الهدف  (Atlas) : $(Hide-Credentials $AtlasUri)" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  سيُحذف محتوى مجموعات '$targetDb' على Atlas ويُستبدل بمحتوى '$sourceDb' المحلية." -ForegroundColor Red
  Write-Host ""

  if (-not $Force) {
    $answer = Read-Host "  للمتابعة اكتب: yes"
    if ($answer -ne "yes") { Write-Host "  أُلغيت العملية. لم يتغيّر شيء." -ForegroundColor Yellow; return }
  }

  # ── 1) تشغيل قاعدة البيانات المحلية إن لم تكن تعمل ───────────────────────
  # mongodump يحتاج خادماً يعمل؛ لا يمكنه القراءة من ملفات WiredTiger مباشرةً.
  $startedByUs = $false
  if (-not (Test-PortOpen -HostName "127.0.0.1" -Port 27017)) {
    Write-Host "[1/5] تشغيل MongoDB المحلية..." -ForegroundColor Cyan
    $mongoProc = Start-Process -FilePath "node" -ArgumentList "scripts/start-local-db.cjs" `
                               -WorkingDirectory $backendRoot -PassThru -WindowStyle Hidden
    $startedByUs = $true
    $ready = $false
    foreach ($i in 1..40) {
      Start-Sleep -Seconds 2
      if (Test-PortOpen -HostName "127.0.0.1" -Port 27017) { $ready = $true; break }
    }
    if (-not $ready) {
      throw "تعذّر تشغيل MongoDB المحلية على 27017. أغلق بعض التطبيقات لتحرير الذاكرة ثم أعد المحاولة."
    }
  } else {
    Write-Host "[1/5] MongoDB المحلية تعمل مسبقاً." -ForegroundColor Cyan
  }

  # ── 2) نسخة احتياطية من Atlas قبل الكتابة فوقها ──────────────────────────
  if (-not $SkipAtlasBackup) {
    if (-not $AtlasBackupPath) {
      $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $AtlasBackupPath = "E:/all_project/CarHero/mongodb-dumps/atlas-backup-$stamp.archive.gz"
    }
    $backupDir = Split-Path -Parent $AtlasBackupPath
    if (-not (Test-Path -LiteralPath $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
    Write-Host "[2/5] نسخة احتياطية من Atlas -> $AtlasBackupPath" -ForegroundColor Cyan
    & $MongoDump --uri="$AtlasUri" --archive="$AtlasBackupPath" --gzip
    if ($LASTEXITCODE -ne 0) { throw "فشل أخذ النسخة الاحتياطية من Atlas. أُوقفت العملية قبل أي كتابة." }
  } else {
    Write-Host "[2/5] تخطّي النسخة الاحتياطية (-SkipAtlasBackup)." -ForegroundColor DarkYellow
  }

  # ── 3) تفريغ المحلية ─────────────────────────────────────────────────────
  $dumpDirectory = Split-Path -Parent $DumpPath
  if (-not (Test-Path -LiteralPath $dumpDirectory)) { New-Item -ItemType Directory -Path $dumpDirectory | Out-Null }
  Write-Host "[3/5] تفريغ قاعدة البيانات المحلية..." -ForegroundColor Cyan
  & $MongoDump --uri="$LocalUri" --archive="$DumpPath" --gzip
  if ($LASTEXITCODE -ne 0) { throw "فشل تفريغ قاعدة البيانات المحلية." }

  # ── 4) الاستعادة إلى Atlas مع الحذف ──────────────────────────────────────
  Write-Host "[4/5] الاستعادة إلى Atlas (مع --drop)..." -ForegroundColor Yellow
  $restoreArgs = @("--uri=$AtlasUri", "--archive=$DumpPath", "--gzip", "--drop")
  if ($sourceDb -ne $targetDb) {
    $restoreArgs += "--nsFrom=$sourceDb.*"
    $restoreArgs += "--nsTo=$targetDb.*"
  }
  & $MongoRestore @restoreArgs
  if ($LASTEXITCODE -ne 0) { throw "فشلت الاستعادة إلى Atlas." }

  # ── 5) التحقّق: مقارنة عدد المستندات على الطرفين ────────────────────────
  Write-Host "[5/5] التحقّق من تطابق الطرفين..." -ForegroundColor Cyan
  & node "scripts/verify-db-sync.cjs" "$LocalUri" "$AtlasUri"
  $verifyExit = $LASTEXITCODE

  if ($startedByUs -and $mongoProc -and -not $mongoProc.HasExited) {
    Write-Host "إيقاف MongoDB المحلية التي شغّلها السكربت..." -ForegroundColor DarkGray
    Stop-Process -Id $mongoProc.Id -Force -ErrorAction SilentlyContinue
  }

  Write-Host ""
  if ($verifyExit -eq 0) {
    Write-Host "  تم النقل بنجاح. Atlas الآن نسخة من المحلية." -ForegroundColor Green
  } else {
    Write-Host "  تم النقل لكن التحقّق أبلغ عن فروق — راجع الجدول أعلاه." -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "  للعمل على Atlas من الآن فصاعداً:" -ForegroundColor Cyan
  Write-Host "      npm run start:dev        (يقرأ MONGODB_URI من .env = Atlas)"
  Write-Host "  بدلاً من:"
  Write-Host "      npm run dev:local        (يُجبر الاتصال على المحلية)"
  Write-Host ""
}
finally {
  Pop-Location
}
