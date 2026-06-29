param(
  [string]$EnvFile = ".env",
  [string]$LocalUri = "mongodb://127.0.0.1:27017/car_hero",
  [string]$DumpPath = "E:/all_project/CarHero/mongodb-dumps/atlas-to-local.archive.gz",
  [switch]$DropLocal
)

$ErrorActionPreference = "Stop"

function Resolve-MongoTool {
  param([string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $defaultPath = "C:\Program Files\MongoDB\Tools\100\bin\$Name.exe"
  if (Test-Path -LiteralPath $defaultPath) {
    return $defaultPath
  }

  throw "$Name was not found. Install MongoDB Database Tools and make sure they are available in PATH."
}

$MongoDump = Resolve-MongoTool -Name "mongodump"
$MongoRestore = Resolve-MongoTool -Name "mongorestore"

function Get-EnvValue {
  param([string]$Path, [string]$Name)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Environment file not found: $Path"
  }

  $line = Get-Content -LiteralPath $Path | Where-Object {
    $_ -match "^\s*$Name\s*="
  } | Select-Object -First 1

  if (-not $line) {
    throw "$Name was not found in $Path"
  }

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

$AtlasUri = Get-EnvValue -Path $EnvFile -Name "MONGODB_URI"
$sourceDb = Get-MongoDatabaseName -Uri $AtlasUri -Label "Atlas"
$targetDb = Get-MongoDatabaseName -Uri $LocalUri -Label "local"
$dumpDirectory = Split-Path -Parent $DumpPath
if (-not (Test-Path -LiteralPath $dumpDirectory)) {
  New-Item -ItemType Directory -Path $dumpDirectory | Out-Null
}

Write-Host "Creating read-only dump from Atlas..."
& $MongoDump --uri="$AtlasUri" --archive="$DumpPath" --gzip

Write-Host "Restoring dump into local MongoDB: $LocalUri"
$restoreArgs = @("--uri=$LocalUri", "--archive=$DumpPath", "--gzip")
if ($sourceDb -ne $targetDb) {
  $restoreArgs += "--nsFrom=$sourceDb.*"
  $restoreArgs += "--nsTo=$targetDb.*"
}
if ($DropLocal) {
  $restoreArgs += "--drop"
}

& $MongoRestore @restoreArgs

Write-Host "Done. Atlas was not modified."
