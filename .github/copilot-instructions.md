## Purpose
Short guide for AI coding assistants to be immediately productive in this repository.

This file highlights the architecture, important files, concrete examples (endpoints/payloads), developer workflows, and project-specific conventions.

## Big picture (what matters)
- Frontend: React + Vite in `src/` (entry: `src/main.jsx`, app: `src/App.jsx`). Builds with `vite` (see `package.json` scripts).
- Backend: Flask app under `color-studio-backend/src/` (entry: `color-studio-backend/src/main.py`). The backend serves the SPA from `color-studio-backend/src/static` and exposes API under `/api/*`.
- Integrations: Cloudflare Stream (TUS uploads + video status) and Cloudflare R2 (multipart RAW storage + presigned URLs). Conversion pipeline downloads RAW from R2, runs `ffmpeg` on the server, then uploads the converted file to Stream.

## Where to look (quick map)
- Frontend API wiring and helpers: `src/config/api.js` (API endpoints), `src/services/uploadService.js`, `src/services/streamApi.js`, `src/services/r2Api.js`.
- Frontend UI/components for Color Studio: `src/pages/ColorStudio.jsx` and `src/components/*`.
- Backend routes and business logic: `color-studio-backend/src/routes/color_studio.py` (all Color Studio endpoints), `color-studio-backend/src/services/r2_upload_service.py` (R2 helper), models in `color-studio-backend/src/models/`.
- Backend app creation and CORS behavior: `color-studio-backend/src/main.py`.

## Key environment variables (must be set for integration tests / local runs)
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN (used for R2 + Stream calls)
- CLOUDFLARE_STREAM_API_TOKEN (optional override for Stream)
- R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
- SECRET_KEY (Flask secret in production), FLASK_DEBUG, PORT

## API & upload contract (concrete examples)
- API base is `VITE_API_URL` (frontend) or `http://localhost:5001` default. See `src/config/api.js`.
- Stream (TUS) initialization (frontend): POST to `${API_ENDPOINTS.COLOR_STUDIO_UPLOAD_STREAM}` with JSON { fileSize, fileName } -> returns { success, uploadURL, uid }.
- Stream direct proxy (server accepts full form-data file and uploads to Stream): POST `/api/color-studio/stream-proxy` with form-data `file` (used by `src/services/streamApi.js`).
- Video status: GET `/api/color-studio/video-status?videoId=...` -> returns Cloudflare response in `cf`.
- R2 (RAW) multipart flow:
  - POST `/api/color-studio/upload/raw/init` with { fileName, fileSize } -> returns { success, uploadId, key }
  - POST `/api/color-studio/upload/raw/part-url` with { uploadId, key, partNumber } -> returns presigned URL for PUT
  - PUT parts directly to presigned URLs, then POST `/api/color-studio/upload/raw/complete` with { uploadId, key, parts } to finish.

## Important conventions and limits
- Allowed RAW extensions and detection: `ALLOWED_EXTENSIONS` / `R2UploadService.is_raw_format` in `color_studio.py` and `src/services/uploadService.js`. Check both when changing detection logic.
- Chunk size: 5 MiB when uploading in chunks (both frontend and backend use 5 * 1024 * 1024). Keep this consistent.
- Max upload size: `MAX_CONTENT_LENGTH = 5GB` in `color-studio-backend/src/main.py` (backend will reject larger files).
- TUS headers used: `Upload-Offset`, `Upload-Length`, `Tus-Resumable`. Frontend and backend set/expect these headers (see `uploadService.js` and `color_studio.py`).
- Conversion uses `ffmpeg` invoked via subprocess in `color_studio.py` (`ffmpeg` must be available on the server for conversion endpoints to work).

## How to run & debug locally (recommended)
1. Frontend
   - Install dependencies (uses a lockfile for pnpm, but `npm` works):
     - `pnpm install` (preferred) or `npm install`
   - Start dev server: `npm run dev` (uses Vite; opens at port 5173 by default)

2. Backend
   - Create a Python venv, then install requirements:
     - `python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r color-studio-backend/requirements.txt`
   - Set required env vars (at minimum `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`) and run:
     - `python color-studio-backend/src/main.py`
   - Health: GET `/health` and `/api/color-studio/status` to verify integrations.

## Code change checklist (when editing upload/stream/r2 logic)
1. Update frontend helpers in `src/services/uploadService.js`, `src/services/streamApi.js`, and `src/services/r2Api.js`.
2. Update backend routes in `color-studio-backend/src/routes/color_studio.py` and `color-studio-backend/src/services/r2_upload_service.py`.
3. Keep chunk size, headers, and allowed extensions consistent across files.
4. If changing environment variable names, update `color-studio-backend/src/main.py` logging and README.

## Common pitfalls observed in this codebase
- Two different env var names are commonly referenced in frontend code: `VITE_API_URL` (used in `src/config/api.js`) and `VITE_API_BASE_URL` (seen in some service files). Verify which is used by the running build.
- Conversion endpoint downloads RAW to disk before running `ffmpeg`. Ensure disk space and permissions are considered in tests.
- Some backend routes use `requests` with timeouts; network errors are mapped to 502/500—tests that mock Cloudflare should account for these branches.

## When in doubt (where to open a PR)
- Small fixes: open PR modifying the relevant service + route + small test/sample component showing usage.
- Large changes to upload architecture: propose design in an issue first, include migration steps for env vars and rollout plan (R2 keys, cloudflare tokens).

---
If any part of this guide is unclear or you'd like a sample PR template for upload/stream fixes, tell me which section to expand and I'll update this file.
