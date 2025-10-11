# Douglas Guedes Portfolio - Maestro Video Editing Application

Professional web-based video editing application with advanced color grading capabilities.

## Quick Start

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

## Full Documentation

For complete setup instructions, troubleshooting, and development workflow, see:
- **[DEVELOPER.md](./DEVELOPER.md)** - Complete developer guide with detailed setup instructions

## Additional Documentation
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
