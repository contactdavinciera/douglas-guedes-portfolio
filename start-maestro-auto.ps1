# MAESTRO DEV SERVER - AUTO-RESTART VERSION
# Automatically restarts if Vite crashes

$ErrorActionPreference = "SilentlyContinue"

Write-Host "🎼 MAESTRO - Auto-Restart Dev Server" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Server URL:     http://localhost:5173" -ForegroundColor Green
Write-Host "✅ Auto-Restart:   ON" -ForegroundColor Yellow
Write-Host "✅ Stop Server:    Ctrl+C" -ForegroundColor Red
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$restartCount = 0

while ($true) {
    try {
        if ($restartCount -gt 0) {
            Write-Host "🔄 Restarting Vite... (Restart #$restartCount)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }

        Write-Host "▶️  Starting Vite Dev Server..." -ForegroundColor Green
        Write-Host ""
        
        # Run pnpm dev and wait for it
        $process = Start-Process pnpm -ArgumentList "dev" -NoNewWindow -PassThru -Wait
        
        $restartCount++
        Write-Host ""
        Write-Host "⚠️  Vite stopped unexpectedly!" -ForegroundColor Red
        
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        $restartCount++
    }
    
    Start-Sleep -Seconds 1
}
