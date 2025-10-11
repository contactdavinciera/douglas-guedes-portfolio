@echo off
REM Script to start the Flask backend server on Windows
REM Usage: start-backend.bat

echo ================================================
echo    Starting Maestro Backend Server (Flask)
echo ================================================
echo.

cd /d "%~dp0\color-studio-backend"

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Virtual environment not found. Creating one...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if Flask is installed
python -c "import flask" 2>nul
if errorlevel 1 (
    echo 📥 Installing Python dependencies...
    pip install -r requirements.txt
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
    echo ⚠️  Warning: .env file not found in color-studio-backend\
    echo    Please create one with required environment variables.
    echo.
)

REM Start the Flask server
echo.
echo 🚀 Starting Flask server on port %PORT%...
echo    Press Ctrl+C to stop the server
echo.
python src\main.py
pause
