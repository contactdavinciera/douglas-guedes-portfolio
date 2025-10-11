#!/bin/bash

# Script to start the Flask backend server
# Usage: ./start-backend.sh

echo "================================================"
echo "   Starting Maestro Backend Server (Flask)"
echo "================================================"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/color-studio-backend" || exit 1

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Virtual environment not found. Creating one..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/lib/python*/site-packages/flask/__init__.py" ]; then
    echo "📥 Installing Python dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  Warning: .env file not found in color-studio-backend/"
    echo "   Creating one from .env.example if it exists..."
    if [ -f "../.env.example" ]; then
        echo "   Please configure the environment variables before running in production."
    fi
fi

# Start the Flask server
echo ""
echo "🚀 Starting Flask server on port ${PORT:-5001}..."
echo "   Press Ctrl+C to stop the server"
echo ""
python src/main.py
