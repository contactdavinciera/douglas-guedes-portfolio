@echo off
REM Script to start the Vite frontend development server on Windows
REM Usage: start-frontend.bat

echo ================================================
echo    Starting Maestro Frontend Server (Vite)
echo ================================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 node_modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
)

REM Check for .env file
if not exist ".env" (
    echo.
    echo ⚠️  Warning: .env file not found
    if exist ".env.example" (
        echo    Creating .env from .env.example...
        copy .env.example .env
        echo    ✅ Created .env file
        echo    📝 Please configure the environment variables in .env
    ) else (
        echo    Please create a .env file with required variables
    )
    echo.
)

REM Start the Vite development server
echo 🚀 Starting Vite development server...
echo    The application will open at http://localhost:5173
echo    Press Ctrl+C to stop the server
echo.
call npm run dev
pause
