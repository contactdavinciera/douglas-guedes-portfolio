# MAESTRO DEV SERVER - DEDICATED TERMINAL
# Opens in dedicated terminal to avoid interruptions

Write-Host "🎼 MAESTRO - Launching Dedicated Dev Server..." -ForegroundColor Cyan
Write-Host ""

# Open new PowerShell window dedicated to Vite
Start-Process powershell -ArgumentList @"
-NoExit
-Command
`$Host.UI.RawUI.WindowTitle = 'MAESTRO DEV SERVER - DO NOT CLOSE';
Write-Host '🎼 MAESTRO - Development Server' -ForegroundColor Cyan;
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray;
Write-Host '';
Write-Host '✅ Server URL:     http://localhost:5173' -ForegroundColor Green;
Write-Host '✅ Status:         RUNNING' -ForegroundColor Green;
Write-Host '✅ Keep Open:      Do not close this window!' -ForegroundColor Yellow;
Write-Host '';
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray;
Write-Host '';
cd 'E:\DEV\DOUGLAS GUEDES.COM\douglas-guedes-portfolio';
pnpm dev
"@

Write-Host "✅ Dedicated terminal opened!" -ForegroundColor Green
Write-Host "✅ Vite is running at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "💡 TIP: Keep that window open and use THIS window for git/npm commands" -ForegroundColor Cyan
