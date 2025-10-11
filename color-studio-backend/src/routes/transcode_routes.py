# Backend routes for Maestro Media Pipeline
# Transcode, Stream upload, and job management

from flask import Blueprint, request, jsonify
import os
import uuid
import subprocess
import requests
from datetime import datetime

transcode_bp = Blueprint('transcode', __name__)

# Cloudflare credentials (from env)
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', 'color-studio-raw-files')

# Active transcode jobs (in-memory, use DB in production)
transcode_jobs = {}


@transcode_bp.route('/start', methods=['POST'])
def start_transcode():
    """
    Start a transcode job for RAW media
    
    Body:
    {
        "sourceKey": "raw/video.braw",
        "sourceUrl": "https://...",
        "metadata": {...},
        "outputs": [
            {"name": "proxy", "resolution": "1920x1080", ...},
            {"name": "master", "resolution": "3840x2160", ...}
        ]
    }
    """
    try:
        data = request.json
        source_key = data.get('sourceKey')
        source_url = data.get('sourceUrl')
        outputs = data.get('outputs', [])
        metadata = data.get('metadata', {})
        
        if not source_key or not outputs:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Create job record
        job = {
            'jobId': job_id,
            'status': 'queued',
            'sourceKey': source_key,
            'sourceUrl': source_url,
            'outputs': outputs,
            'metadata': metadata,
            'progress': 0,
            'createdAt': datetime.now().isoformat(),
            'estimatedTime': 300  # 5 minutes estimate
        }
        
        transcode_jobs[job_id] = job
        
        # In production: Queue job to worker (Celery, RQ, etc.)
        # For now: Mock immediate processing
        print(f"🎬 Transcode job {job_id} queued")
        print(f"   Source: {source_key}")
        print(f"   Outputs: {len(outputs)}")
        
        # Simulate async transcode (would be actual FFmpeg in production)
        # process_transcode_job(job_id)
        
        return jsonify(job), 200
        
    except Exception as e:
        print(f"❌ Transcode start error: {e}")
        return jsonify({'error': str(e)}), 500


@transcode_bp.route('/status/<job_id>', methods=['GET'])
def get_transcode_status(job_id):
    """Get transcode job status"""
    try:
        job = transcode_jobs.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        return jsonify(job), 200
        
    except Exception as e:
        print(f"❌ Status check error: {e}")
        return jsonify({'error': str(e)}), 500


@transcode_bp.route('/cancel/<job_id>', methods=['POST'])
def cancel_transcode(job_id):
    """Cancel a transcode job"""
    try:
        job = transcode_jobs.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Update status
        job['status'] = 'cancelled'
        job['cancelledAt'] = datetime.now().isoformat()
        
        print(f"🛑 Job {job_id} cancelled")
        
        return jsonify({'success': True, 'job': job}), 200
        
    except Exception as e:
        print(f"❌ Cancel error: {e}")
        return jsonify({'error': str(e)}), 500


def process_transcode_job(job_id):
    """
    Process transcode job using FFmpeg
    (This would run in a worker in production)
    """
    job = transcode_jobs.get(job_id)
    if not job:
        return
    
    try:
        job['status'] = 'processing'
        job['startedAt'] = datetime.now().isoformat()
        
        source_url = job['sourceUrl']
        outputs = job['outputs']
        
        for output in outputs:
            print(f"⚙️ Transcoding {output['name']}...")
            
            # Build FFmpeg command
            output_path = f"/tmp/{job_id}_{output['name']}.mp4"
            
            cmd = [
                'ffmpeg',
                '-i', source_url,
                '-c:v', 'libx265' if output['codec'] == 'h265' else 'libx264',
                '-preset', 'medium',
                '-crf', '18',
                '-vf', f"scale={output['resolution']}",
                '-b:v', output['bitrate'],
                '-c:a', 'aac',
                '-b:a', '192k',
                output_path
            ]
            
            # Run FFmpeg (simplified, would track progress in production)
            # result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Upload result to Stream or R2
            # upload_to_stream(output_path, job_id, output['name'])
            
            job['progress'] = 50  # Mock progress
        
        # Mark complete
        job['status'] = 'completed'
        job['completedAt'] = datetime.now().isoformat()
        job['progress'] = 100
        
        print(f"✅ Job {job_id} completed")
        
    except Exception as e:
        print(f"❌ Transcode error: {e}")
        job['status'] = 'failed'
        job['error'] = str(e)


@transcode_bp.route('/list', methods=['GET'])
def list_transcode_jobs():
    """List all transcode jobs"""
    try:
        jobs_list = list(transcode_jobs.values())
        return jsonify({'jobs': jobs_list, 'count': len(jobs_list)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Register blueprint in main.py:
# from routes.transcode_routes import transcode_bp
# app.register_blueprint(transcode_bp, url_prefix='/api/transcode')
