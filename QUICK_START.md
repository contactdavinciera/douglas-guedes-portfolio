# Quick Start Guide - Maestro Video Editor

Get up and running in 3 simple steps!

## Step 1: Install Prerequisites

Make sure you have these installed:
- **Node.js** (v18+): [Download here](https://nodejs.org/)
- **Python** (3.9+): [Download here](https://www.python.org/downloads/)

## Step 2: Start the Servers

Choose your operating system:

### 🐧 Linux / 🍎 macOS

Open a terminal and run:

```bash
# Option A: Start both servers at once
./start-servers.sh

# Option B: Start them separately in two terminals
# Terminal 1:
./start-backend.sh

# Terminal 2:
./start-frontend.sh
```

### 🪟 Windows

Open Command Prompt and run:

```cmd
# Terminal 1: Backend
start-backend.bat

# Terminal 2: Frontend (in a new command prompt)
start-frontend.bat
```

## Step 3: Open the Application

Once the servers are running, open your browser to:

**🌐 http://localhost:5173**

## What You Should See

### Backend Terminal Output:
```
================================================
🚀 Backend initialized successfully
📁 Static folder: /path/to/static
💾 Database: /path/to/database/app.db
🌐 CORS enabled for:
   - http://localhost:5173
   - http://localhost:5174
================================================

🔥 Starting server on port 5001 (debug=True)
 * Running on http://127.0.0.1:5001
```

### Frontend Terminal Output:
```
  VITE v6.3.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Troubleshooting

### "Port already in use"
- **Backend**: Edit `color-studio-backend/src/main.py` and change `PORT=5001` to another port
- **Frontend**: Vite will automatically use the next available port (5174, 5175, etc.)

### "Command not found" or "Permission denied"
```bash
# Make scripts executable (Linux/macOS)
chmod +x start-backend.sh start-frontend.sh start-servers.sh
```

### "Module not found" errors
```bash
# Backend
cd color-studio-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend
npm install
```

### Environment Variables Not Set
1. Copy `.env.example` to `.env`
2. Fill in the required values (the startup scripts will do this automatically)

## Next Steps

Once the servers are running:

1. **Explore the Interface**: Navigate through the media pool, timeline, and preview panels
2. **Upload a Video**: Try uploading a test video file
3. **Edit Timeline**: Add clips to the timeline and experiment with editing tools
4. **Color Grading**: Access the color grading tools and LUT library

## Need More Help?

- 📖 **Full Documentation**: See [DEVELOPER.md](./DEVELOPER.md)
- 🔧 **Troubleshooting**: Check the troubleshooting section in DEVELOPER.md
- 📝 **Implementation Details**: See [final_report.md](./final_report.md)

## Server URLs Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main application interface |
| Backend | http://localhost:5001 | API server |
| Health Check | http://localhost:5001/health | Verify backend is running |

## Stopping the Servers

Press `Ctrl+C` in the terminal window(s) where the servers are running.

---

**Happy Editing! 🎬**
