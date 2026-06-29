$ErrorActionPreference = "Stop"

$env:MONGODB_URI = if ($env:LOCAL_MONGODB_URI) {
  $env:LOCAL_MONGODB_URI
} else {
  "mongodb://127.0.0.1:27017/car_hero"
}

Write-Host "Starting backend with local MongoDB: $env:MONGODB_URI"
npm run start:dev
