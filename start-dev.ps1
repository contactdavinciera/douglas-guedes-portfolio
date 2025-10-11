# Script PowerShell para iniciar ambiente de desenvolvimento
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " INICIANDO AMBIENTE DE DESENVOLVIMENTO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Diretório do projeto
$projectDir = $PSScriptRoot

# Iniciar Frontend
Write-Host "[1/2] Iniciando Frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectDir'; pnpm dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Iniciar Backend
Write-Host "[2/2] Iniciando Backend (Flask)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectDir\color-studio-backend'; & '$projectDir\venv\Scripts\python.exe' src/main.py" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " SERVIDORES INICIADOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
Write-Host "  Supabase: http://localhost:54321" -ForegroundColor White
Write-Host ""
Write-Host "Os servidores estão rodando em janelas separadas." -ForegroundColor Gray
Write-Host "Feche as janelas para parar os servidores." -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar este terminal..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
