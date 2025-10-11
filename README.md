# Douglas Guedes Portfolio - Maestro Video Editing Application

Professional web-based video editing application with advanced color grading capabilities.

---

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Clone the Repository
```bash
git clone https://github.com/contactdavinciera/douglas-guedes-portfolio.git
cd douglas-guedes-portfolio
```

### Step 2: Start the Servers
```bash
# Linux/macOS - Start both servers at once
./start-servers.sh

# OR start them separately
./start-backend.sh     # Terminal 1
./start-frontend.sh    # Terminal 2

# Windows
start-backend.bat      # Terminal 1
start-frontend.bat     # Terminal 2
```

### Step 3: Open the Application
Open http://localhost:5173 in your browser

---

## 📖 For First-Time Users

**New to the project?** Start here:
1. Read [QUICK_START.md](./QUICK_START.md) - Simple 3-step guide
2. Check [DEVELOPER.md](./DEVELOPER.md) - Complete setup guide
3. Run `./start-servers.sh` - Start coding!

---

## Alternative: Manual Setup

### Starting the Servers

**Backend (Flask):**
```bash
cd color-studio-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

**Frontend (Vite/React):**
```bash
npm install
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/health

## Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 🚀 Get running in 3 simple steps!
- **[DEVELOPER.md](./DEVELOPER.md)** - Complete developer guide with detailed setup instructions

### Additional Resources
- **[final_report.md](./final_report.md)** - Implementation details and testing report
- **[ffmpeg_render_verification.md](./ffmpeg_render_verification.md)** - FFmpeg setup guide
- **[conversion_streaming_monitoring.md](./conversion_streaming_monitoring.md)** - Monitoring guide

## Tech Stack

### Frontend
- React 19
- Vite 6
- Tailwind CSS
- React Router
- Supabase Client

### Backend
- Flask 3.0
- SQLAlchemy
- FFmpeg
- Cloudflare R2 & Stream
- Python 3.9+

## Features

- 🎬 Media Pool - Organize and manage video clips
- 🎥 Real-time Preview - Frame-accurate video playback
- ✂️ Timeline Editor - Multi-track editing with independent audio/video layers
- 🎨 Color Grading - Professional color correction with LUT support
- 📤 File Upload - TUS-based resumable uploads
- ☁️ Cloud Storage - Cloudflare R2 integration
- 🔄 Video Processing - FFmpeg-based H.265 conversion

<!-- Dummy change to force deploy -->
