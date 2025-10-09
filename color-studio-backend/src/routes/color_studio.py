import os
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src.models.project import Project, db
import subprocess
import mimetypes
import requests  # ← Deve ter

color_studio_bp = Blueprint("color_studio", __name__)  # ← ESSA LINHA DEVE VIR ANTES DAS ROTAS!

# Configurações de upload
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"braw", "r3d", "ari", "mov", "mp4", "mxf", "dng", "mkv", "avi"}
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

# ... (resto das funções helper) ...

# AQUI VÊM AS ROTAS @color_studio_bp.route(...)
@color_studio_bp.route("/upload-url", methods=["POST"])
def get_stream_upload_url():
    """
    Cria sessão TUS para upload de vídeos grandes no Cloudflare Stream
    """
    try:
        data = request.get_json() or {}
        file_size = data.get("fileSize", 0)
        file_name = data.get("fileName", "video.mp4")
        
        if not file_size or file_size <= 0:
            return jsonify({
                "success": False,
                "error": "Tamanho do arquivo é obrigatório"
            }), 400
        
        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
        
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({
                "success": False,
                "error": "Credenciais do Cloudflare não configuradas"
            }), 500
        
        print(f"🔑 Account ID: {CLOUDFLARE_ACCOUNT_ID[:8]}...")
        print(f"📦 File: {file_name} ({file_size} bytes)")
        
        # Endpoint TUS do Cloudflare Stream
        tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
        
        # Headers TUS obrigatórios
        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(file_size),
            "Upload-Metadata": f"name {file_name}"
        }
        
        print(f"📤 POST TUS: {tus_endpoint}")
        
        # Criar sessão TUS (POST vazio)
        response = requests.post(tus_endpoint, headers=headers)
        
        print(f"📥 Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:  # Created
            # TUS retorna a URL no header 'Location'
            upload_url = response.headers.get("Location")
            # UID no header 'Stream-Media-Id'
            uid = response.headers.get("Stream-Media-Id", "unknown")
            
            if upload_url:
                print(f"✅ Sessão TUS criada! URL: {upload_url}")
                return jsonify({
                    "success": True,
                    "uploadURL": upload_url,
                    "uid": uid
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "error": "Location header não retornado pelo Cloudflare"
                }), 500
        else:
            error_msg = response.text
            print(f"❌ Erro: {error_msg}")
            return jsonify({
                "success": False,
                "error": f"Erro {response.status_code}: {error_msg}"
            }), response.status_code
            
    except Exception as e:
        print(f"❌ Erro ao criar sessão TUS: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@color_studio_bp.route("/stream-proxy", methods=["POST"])
def stream_proxy_upload():
    """
    Recebe arquivo COMPLETO e faz upload TUS para Cloudflare
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file"}), 400
        
        file = request.files["file"]
        file_size = request.content_length
        
        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
        
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({"success": False, "error": "Credentials missing"}), 500
        
        print(f"📤 Recebendo arquivo: {file.filename} ({file_size} bytes)")
        
        # 1. Criar sessão TUS
        tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
        
        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(file_size),
            "Upload-Metadata": f"name {file.filename}"
        }
        
        response = requests.post(tus_endpoint, headers=headers)
        
        if response.status_code != 201:
            return jsonify({"success": False, "error": "Failed to create TUS session"}), 500
        
        upload_url = response.headers.get("Location")
        uid = response.headers.get("Stream-Media-Id", "unknown")
        
        if not upload_url:
            return jsonify({"success": False, "error": "TUS upload URL not returned"}), 500

        print(f"✅ Sessão TUS criada: {upload_url}")
        
        # 2. Upload em chunks via TUS
        chunk_size = 52428800  # 50 MB
        offset = 0
        
        # Resetar o ponteiro do arquivo para o início antes de ler os chunks
        file.seek(0)

        while True:
            chunk = file.read(chunk_size)
            if not chunk:
                break
            
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/offset+octet-stream",
                "Upload-Offset": str(offset),
                "Tus-Resumable": "1.0.0"
            }
            
            print(f"📦 Enviando chunk: offset={offset}, size={len(chunk)}")
            
            response = requests.patch(upload_url, headers=headers, data=chunk)
            
            if response.status_code not in [200, 204]:
                print(f"❌ Erro no chunk: {response.status_code}")
                print(f"❌ Response: {response.text}")  # ← ADICIONE PARA VER O ERRO COMPLETO
                return jsonify({"success": False, "error": f"Chunk upload failed: {response.text}"}), 500
            
            offset += len(chunk)
            progress = int((offset / file_size) * 100)
            print(f"📊 Progresso: {progress}%")
        
        print(f"🎉 Upload completo! UID: {uid}")
        
        return jsonify({
            "success": True,
            "uid": uid,
            "message": "Upload completed"
        }), 200
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
