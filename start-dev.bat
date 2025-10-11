@echo off
echo ========================================
echo  INICIANDO AMBIENTE DE DESENVOLVIMENTO
echo ========================================
echo.

:: Iniciar Frontend em uma nova janela
echo [1/2] Iniciando Frontend (Vite)...
start "Frontend - Vite" cmd /k "cd /d "%~dp0" && pnpm dev"
timeout /t 3 >nul

:: Iniciar Backend em uma nova janela
echo [2/2] Iniciando Backend (Flask)...
start "Backend - Flask" cmd /k "cd /d "%~dp0color-studio-backend" && "%~dp0venv\Scripts\python.exe" src/main.py"

echo.
echo ========================================
echo  SERVIDORES INICIADOS!
echo ========================================
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5001
echo  Supabase: http://localhost:54321
echo.
echo  Pressione qualquer tecla para fechar este terminal
echo  (Os servidores continuarao rodando nas outras janelas)
echo ========================================
pause >nul
