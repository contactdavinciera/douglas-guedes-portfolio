@echo off
title VITE AUTO-RESTART
color 0A

echo ========================================
echo    VITE AUTO-RESTART ATIVO!
echo    Pressione Ctrl+C para parar
echo ========================================
echo.

:loop
echo [%time%] Iniciando Vite...
pnpm dev

echo.
echo [%time%] Vite parou! Reiniciando em 2s...
timeout /t 2 /nobreak > nul

goto loop
