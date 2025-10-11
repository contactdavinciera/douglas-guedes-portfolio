# Script de Inicialização Automática
# Frontend (Vite) + Backend (Flask)

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Douglas Guedes Portfolio - Startup Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Parar processos antigos
Write-Host "🛑 Parando processos antigos..." -ForegroundColor Yellow
Stop-Process -Name node,python -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "   ✅ Processos antigos encerrados" -ForegroundColor Green

# Limpar cache
Write-Host ""
Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite,node_modules\.vite -ErrorAction SilentlyContinue
Write-Host "   ✅ Cache limpo" -ForegroundColor Green

# Iniciar Frontend em novo terminal
Write-Host ""
Write-Host "🎨 Iniciando Frontend (Vite)..." -ForegroundColor Green
$frontendPath = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 FRONTEND - Vite' -ForegroundColor Cyan; npm run dev"
Write-Host "   ✅ Frontend iniciado em novo terminal" -ForegroundColor Green

# Aguardar Vite inicializar
Write-Host ""
Write-Host "⏳ Aguardando Vite inicializar (3 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar Backend em novo terminal
Write-Host ""
Write-Host "🔧 Iniciando Backend (Flask)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "color-studio-backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 BACKEND - Flask' -ForegroundColor Magenta; .\venv\Scripts\Activate.ps1; python src\main.py"
Write-Host "   ✅ Backend iniciado em novo terminal" -ForegroundColor Green

# Aguardar Backend inicializar
Write-Host ""
Write-Host "⏳ Aguardando Backend inicializar (3 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Mensagem final
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ TUDO INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend (SEU SITE):" -ForegroundColor Cyan
Write-Host "   👉 http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Backend (API):" -ForegroundColor Magenta
Write-Host "   http://localhost:5001" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Sempre acesse: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5173" -ForegroundColor White
Write-Host "   (Não acesse a porta 5001 no navegador!)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Dica: Pressione Ctrl+C nos terminais para parar" -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar esta janela..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
