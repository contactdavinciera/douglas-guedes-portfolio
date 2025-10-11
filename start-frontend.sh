#!/bin/bash

# Script to start the Vite frontend development server
# Usage: ./start-frontend.sh

echo "================================================"
echo "   Starting Maestro Frontend Server (Vite)"
echo "================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  Warning: .env file not found"
    if [ -f ".env.example" ]; then
        echo "   Creating .env from .env.example..."
        cp .env.example .env
        echo "   ✅ Created .env file"
        echo "   📝 Please configure the environment variables in .env"
    else
        echo "   Please create a .env file with required variables"
    fi
    echo ""
fi

# Start the Vite development server
echo "🚀 Starting Vite development server..."
echo "   The application will open at http://localhost:5173"
echo "   Press Ctrl+C to stop the server"
echo ""
npm run dev
