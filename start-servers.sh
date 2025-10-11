#!/bin/bash

# Script to start both frontend and backend servers in separate processes
# Usage: ./start-servers.sh

echo "================================================"
echo "   Starting Maestro Application"
echo "   Frontend (Vite) + Backend (Flask)"
echo "================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

echo "📋 Starting backend server..."
echo ""

# Start backend in background
cd "$SCRIPT_DIR/color-studio-backend" || exit 1

# Check and create virtual environment if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/flask/__init__.py" ]; then
    echo "📥 Installing Python dependencies..."
    pip install -q -r requirements.txt
fi

# Start backend
python src/main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend server started (PID: $BACKEND_PID, Port: 5001)"
echo "   Logs: backend.log"

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend server failed to start. Check backend.log for details."
    exit 1
fi

echo ""
echo "📋 Starting frontend server..."
echo ""

# Start frontend in background
cd "$SCRIPT_DIR" || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node dependencies..."
    npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Start frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend server started (PID: $FRONTEND_PID, Port: 5173)"
echo "   Logs: frontend.log"

echo ""
echo "================================================"
echo "   ✨ Both servers are running!"
echo "================================================"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5001"
echo "   Health:   http://localhost:5001/health"
echo ""
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "   Logs:"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "   Press Ctrl+C to stop both servers"
echo "================================================"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
