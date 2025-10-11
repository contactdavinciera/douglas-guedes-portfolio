# Script para manter o Vite sempre rodando automaticamente
# Use: .\keep-vite-alive.ps1

Write-Host "🔄 VITE AUTO-RESTART ATIVO!" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Limpa processos anteriores
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$attemptCount = 0

while ($true) {
    $attemptCount++
    
    Write-Host "[$attemptCount] ⚡ Iniciando Vite..." -ForegroundColor Cyan
    
    # Inicia o Vite
    $process = Start-Process -FilePath "pnpm" -ArgumentList "dev" -PassThru -NoNewWindow
    
    # Aguarda o processo terminar
    $process.WaitForExit()
    
    # Se caiu, espera 2 segundos e reinicia
    Write-Host "❌ Vite parou! Reiniciando em 2s..." -ForegroundColor Red
    Start-Sleep -Seconds 2
}
