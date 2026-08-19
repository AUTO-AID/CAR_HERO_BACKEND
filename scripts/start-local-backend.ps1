
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

$ErrorActionPreference = "Stop"

$env:MONGODB_URI = if ($env:LOCAL_MONGODB_URI) {
  $env:LOCAL_MONGODB_URI
} else {
  "mongodb://127.0.0.1:27017/car_hero"
}

Write-Host "Starting backend with local MongoDB: $env:MONGODB_URI"
npm run start:dev
