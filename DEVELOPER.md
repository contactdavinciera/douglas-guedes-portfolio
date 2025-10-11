# Developer Guide - Maestro Video Editing Application

## Overview

Maestro is a web-based video editing application that provides functionalities similar to professional editing software like Premiere and DaVinci Resolve. The application consists of two main components:

- **Frontend**: React application built with Vite
- **Backend**: Flask (Python) API server

## Prerequisites

Before starting the servers, ensure you have the following installed:

- **Node.js**: v18.x or higher (v20.x recommended)
- **npm**: v8.x or higher
- **Python**: 3.9 or higher (3.12 recommended)
- **pip**: Latest version

### Verify Installation

```bash
node --version    # Should output v18.x or higher
npm --version     # Should output v8.x or higher
python3 --version # Should output Python 3.9.x or higher
pip3 --version    # Should output pip version
```

## Quick Start

### Option A: Using Startup Scripts (Recommended)

The easiest way to start the servers is using the provided startup scripts:

#### Start Both Servers at Once
```bash
./start-servers.sh
```

This will:
- Start the backend server on port 5001
- Start the frontend server on port 5173
- Create log files (backend.log and frontend.log)
- Set up dependencies automatically

#### Start Servers Separately

**Backend only:**
```bash
./start-backend.sh
```

**Frontend only:**
```bash
./start-frontend.sh
```

### Option B: Manual Setup

### 1. Clone the Repository

```bash
git clone https://github.com/contactdavinciera/douglas-guedes-portfolio.git
cd douglas-guedes-portfolio
```

### 2. Setup Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables:

```env
# Frontend - Vite Configuration
VITE_API_URL=http://localhost:5001
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Backend - Flask Configuration (in color-studio-backend/.env)
SECRET_KEY=your_secret_key_here
FLASK_DEBUG=1
PORT=5001
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 3. Start the Backend Server

```bash
# Navigate to backend directory
cd color-studio-backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python src/main.py
```

The backend server will start on `http://localhost:5001`

You should see output similar to:
```
============================================================
🚀 Backend initialized successfully
📁 Static folder: /path/to/src/static
💾 Database: /path/to/src/database/app.db
🌐 CORS enabled for:
   - http://localhost:5173
   - http://localhost:5174
============================================================

🔥 Starting server on port 5001 (debug=True)
```

### 4. Start the Frontend Development Server

Open a **new terminal window/tab** and run:

```bash
# Navigate to project root (if not already there)
cd /path/to/douglas-guedes-portfolio

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend server will start on `http://localhost:5173` (or the next available port)

You should see output similar to:
```
  VITE v6.3.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 5. Access the Application

Open your web browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/health (health check endpoint)

## Detailed Setup Instructions

### Frontend Setup

The frontend is a React application using:
- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **Supabase** - Backend services
- **React Router** - Routing

#### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

#### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api
VITE_API_URL=http://localhost:5001

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Configuration
VITE_CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

### Backend Setup

The backend is a Flask application that provides:
- RESTful API endpoints
- Video processing with FFmpeg
- File upload handling
- Database management (SQLite/PostgreSQL)

#### Backend Structure

```
color-studio-backend/
├── src/
│   ├── main.py           # Application entry point
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── database/         # SQLite database files
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
└── render.yaml          # Render deployment config
```

#### Backend Commands

```bash
cd color-studio-backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python src/main.py

# Run with custom port
PORT=5002 python src/main.py

# Run in production mode
FLASK_ENV=production SECRET_KEY=your_secret python src/main.py
```

#### Backend Environment Variables

Create a `.env` file in the `color-studio-backend` directory:

```env
# Flask Configuration
SECRET_KEY=your_secret_key_for_sessions
FLASK_DEBUG=1
FLASK_ENV=development
PORT=5001

# Database Configuration
SQLALCHEMY_DATABASE_URI=sqlite:///database/app.db

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_EMAIL=your_email

# R2 Storage Configuration
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=color-studio-raw-files

# Upload Configuration
MAX_UPLOAD_SIZE=5368709120  # 5GB
MAX_DURATION_SECONDS=3600
```

## Features

### Media Pool
- Organize video takes and clips
- Preview selected media
- Drag-and-drop functionality

### Preview Screen
- Real-time video preview
- Playback controls
- Frame-accurate scrubbing

### Timeline Editor
- Independent video and audio layers
- Multi-track editing
- Trimming and cutting tools

### Video Effects
- Resize and crop tools
- Color correction
- LUT support
- Transitions and effects

### Adjustable UI
- Resizable panels
- Customizable layout
- Workspace presets

## Troubleshooting

### Backend Issues

#### Port Already in Use
If port 5001 is already in use:
```bash
# Use a different port
PORT=5002 python src/main.py
```

Then update your frontend `.env`:
```env
VITE_API_URL=http://localhost:5002
```

#### Database Errors
If you encounter database errors:
```bash
# Remove the existing database
rm -rf color-studio-backend/src/database/app.db

# Restart the server (it will recreate the database)
python src/main.py
```

#### Missing Dependencies
If you get import errors:
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

#### Port Already in Use
Vite will automatically use the next available port (5174, 5175, etc.)

#### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### CORS Issues

If you see CORS errors in the browser console:

1. Ensure the backend is running on the correct port
2. Check that `VITE_API_URL` in frontend `.env` matches the backend URL
3. Verify CORS configuration in `color-studio-backend/src/main.py`

## Development Workflow

### Starting Both Servers (Recommended)

Use two terminal windows/tabs:

**Terminal 1 - Backend:**
```bash
cd color-studio-backend
source venv/bin/activate
python src/main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Making Changes

#### Frontend Changes
- Edit files in `src/`
- Vite will hot-reload automatically
- No need to restart the server

#### Backend Changes
- Edit files in `color-studio-backend/src/`
- Flask auto-reloads in debug mode
- Watch the terminal for errors

## Testing

### Frontend Testing
```bash
# Run linter
npm run lint

# Build to check for errors
npm run build
```

### Backend Testing
```bash
cd color-studio-backend
source venv/bin/activate

# Test health endpoint
curl http://localhost:5001/health

# Test with Python requests
python -c "import requests; print(requests.get('http://localhost:5001/health').json())"
```

## Production Deployment

### Frontend (Cloudflare Pages)
```bash
# Build production assets
npm run build

# Files will be in dist/ directory
# Deploy to Cloudflare Pages
```

### Backend (Render)
The backend is configured for deployment on Render using:
- `render.yaml` - Service configuration
- `render-build.sh` - Build script
- `Dockerfile` - Container configuration

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation files:
   - `final_report.md` - Implementation details
   - `ffmpeg_render_verification.md` - FFmpeg setup
   - `conversion_streaming_monitoring.md` - Monitoring guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Web Browser                       │
│            http://localhost:5173                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/HTTPS
                   │
┌──────────────────▼──────────────────────────────────┐
│           Vite Dev Server (Frontend)                │
│     React + Tailwind + React Router                 │
│              Port: 5173                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API Requests
                   │
┌──────────────────▼──────────────────────────────────┐
│        Flask Backend API (Backend)                  │
│     Python + SQLAlchemy + Flask-CORS                │
│              Port: 5001                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├───► SQLite Database
                   ├───► Cloudflare R2 (Storage)
                   ├───► Cloudflare Stream (Video)
                   └───► Supabase (Auth/Data)
```

## Key Features Implementation Status

- [x] Media pool for organizing video takes
- [x] Preview screen for selected takes
- [x] Basic timeline structure
- [x] File upload (TUS protocol)
- [x] Video streaming integration
- [x] Color correction API
- [x] LUT support
- [ ] Advanced editing tools (in progress)
- [ ] Resize and crop functionality
- [ ] Adjustable UI panels
- [ ] Workspace presets

---

**Note**: This is a development guide. For production deployment, additional security measures, performance optimizations, and environment-specific configurations should be implemented.
