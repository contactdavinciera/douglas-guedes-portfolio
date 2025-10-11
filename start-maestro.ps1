# MAESTRO DEV SERVER - STABLE VERSION
# Keeps Vite running without disconnects

Write-Host "🎼 MAESTRO - Starting Development Server..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Server URL:     http://localhost:5173" -ForegroundColor Green
Write-Host "✅ Keep Running:   DO NOT run commands here" -ForegroundColor Yellow
Write-Host "✅ Open new tab:   For git, npm, etc." -ForegroundColor Cyan
Write-Host "✅ Stop Server:    Ctrl+C" -ForegroundColor Red
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Set process priority to prevent interruptions
$process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev" -PassThru
$process.PriorityClass = 'High'

Write-Host "🚀 Vite process started with HIGH priority (PID: $($process.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "Keep this window OPEN and use another terminal for other tasks!" -ForegroundColor Yellow
