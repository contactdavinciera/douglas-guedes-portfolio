"""
Flask Routes for Auto Subtitling
Handles transcription, translation, and subtitle generation
"""

from flask import Blueprint, request, jsonify, send_file
import tempfile
import os
import subprocess
import json
from werkzeug.utils import secure_filename

subtitle_bp = Blueprint('subtitles', __name__, url_prefix='/api/subtitles')

# Temporary storage for uploaded files
UPLOAD_DIR = "uploads/temp/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'mov', 'avi', 'mkv', 'm4a', 'webm'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@subtitle_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text using Whisper
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        # Get parameters
        language = request.form.get('language', 'pt')
        model = request.form.get('model', 'base')
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_DIR, filename)
        file.save(temp_path)
        
        # Extract audio if video
        audio_path = temp_path
        if filename.endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm')):
            audio_path = temp_path.replace(os.path.splitext(temp_path)[1], '.wav')
            extract_audio(temp_path, audio_path)
        
        # Transcribe with Whisper (or mock for now)
        segments = generate_mock_segments(audio_path, language)
        
        # Cleanup
        os.remove(temp_path)
        if audio_path != temp_path and os.path.exists(audio_path):
            os.remove(audio_path)
        
        return jsonify({
            "success": True,
            "segments": segments,
            "language": language,
            "model": model
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subtitle_bp.route('/translate', methods=['POST'])
def translate_subtitles():
    """
    Translate subtitles to target language
    """
    try:
        data = request.get_json()
        segments = data.get('segments', [])
        target_language = data.get('targetLanguage', 'en')
        
        translated_segments = []
        
        for seg in segments:
            # TODO: Integrate Google Translate API
            # For now, return same text with marker
            translated_segments.append({
                **seg,
                "text": f"[{target_language}] {seg['text']}"
            })
        
        return jsonify({
            "success": True,
            "translatedSegments": translated_segments,
            "targetLanguage": target_language
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subtitle_bp.route('/export-srt', methods=['POST'])
def export_srt():
    """
    Export segments to SRT file
    """
    try:
        data = request.get_json()
        segments = data.get('segments', [])
        
        # Generate SRT content
        srt_content = generate_srt_content(segments)
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8')
        temp_file.write(srt_content)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name='subtitles.srt',
            mimetype='text/plain'
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def extract_audio(video_path, audio_path):
    """Extract audio from video using FFmpeg"""
    try:
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # PCM audio
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',  # Mono
            '-y',  # Overwrite
            audio_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
    except Exception as e:
        print(f"FFmpeg extraction error: {e}")


def generate_mock_segments(audio_path, language='pt'):
    """Generate mock segments for testing"""
    try:
        # Get audio duration
        duration = get_audio_duration(audio_path)
    except:
        duration = 60  # Default 60 seconds
    
    # Generate segments every 5 seconds
    segments = []
    
    # Portuguese sample texts
    pt_texts = [
        "Bem-vindo ao nosso vídeo!",
        "Hoje vamos falar sobre edição de vídeo.",
        "Este é um exemplo de legendas automáticas.",
        "A qualidade do áudio é muito importante.",
        "Esperamos que você goste do conteúdo.",
        "Não esqueça de curtir e se inscrever!",
        "Até a próxima!",
        "Obrigado por assistir!"
    ]
    
    # English sample texts
    en_texts = [
        "Welcome to our video!",
        "Today we'll talk about video editing.",
        "This is an example of auto subtitles.",
        "Audio quality is very important.",
        "We hope you enjoy the content.",
        "Don't forget to like and subscribe!",
        "See you next time!",
        "Thanks for watching!"
    ]
    
    texts = pt_texts if language == 'pt' else en_texts
    
    segment_duration = 5
    num_segments = min(len(texts), int(duration / segment_duration))
    
    for i in range(num_segments):
        segments.append({
            "id": i,
            "start": i * segment_duration,
            "end": min((i + 1) * segment_duration, duration),
            "text": texts[i % len(texts)],
            "confidence": 0.92 + (i % 3) * 0.02
        })
    
    return segments


def get_audio_duration(audio_path):
    """Get audio duration using FFprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            audio_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except:
        return 60.0  # Default


def generate_srt_content(segments):
    """Generate SRT file content from segments"""
    srt_lines = []
    
    for i, seg in enumerate(segments, 1):
        start_time = format_srt_time(seg['start'])
        end_time = format_srt_time(seg['end'])
        
        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(f"{seg['text']}")
        srt_lines.append("")
    
    return '\n'.join(srt_lines)


def format_srt_time(seconds):
    """Format seconds to SRT time (00:00:00,000)"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
