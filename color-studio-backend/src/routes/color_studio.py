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
        response = requests.post(tus_endpoint, headers=headers, timeout=30)
        
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
    Recebe arquivo e faz upload direto para Cloudflare Stream
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file"}), 400
        
        file = request.files["file"]
        
        # Obter o tamanho do arquivo de forma mais robusta
        file.seek(0, 2)  # Ir para o final do arquivo
        file_size = file.tell()  # Obter a posição atual (tamanho)
        file.seek(0)  # Voltar para o início
        
        if file_size == 0:
            return jsonify({"success": False, "error": "Arquivo vazio"}), 400
        
        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
        
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({"success": False, "error": "Credentials missing"}), 500
        
        print(f"📤 Recebendo arquivo: {file.filename} ({file_size} bytes)")
        
        # 1. Obter URL de upload direto do Cloudflare Stream
        direct_upload_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload"
        
        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "maxDurationSeconds": 3600,
            "allowedOrigins": ["*"],
            "meta": {
                "source": "color-studio-backend",
                "filename": file.filename,
                "size": file_size
            }
        }
        
        print(f"📤 Solicitando URL de upload direto...")
        response = requests.post(direct_upload_endpoint, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            error_msg = response.text
            print(f"❌ Erro ao obter URL de upload direto: {response.status_code} - {error_msg}")
            return jsonify({"success": False, "error": f"Failed to get direct upload URL: {error_msg}"}), 500
        
        upload_data = response.json()
        
        if not upload_data.get("success"):
            error_msg = upload_data.get("errors", "Unknown error")
            print(f"❌ Erro na resposta da API: {error_msg}")
            return jsonify({"success": False, "error": f"API error: {error_msg}"}), 500
        
        result = upload_data.get("result", {})
        upload_url = result.get("uploadURL")
        uid = result.get("uid")
        
        if not upload_url or not uid:
            print(f"❌ URL de upload ou UID não retornados")
            return jsonify({"success": False, "error": "Upload URL or UID not returned"}), 500

        print(f"✅ URL de upload direto obtida: {upload_url}")
        print(f"✅ UID do vídeo: {uid}")
        
        # 2. Upload do arquivo usando multipart/form-data
        file.seek(0)  # Voltar para o início do arquivo
        
        files = {"file": (file.filename, file, file.content_type)}
        
        print(f"📦 Enviando arquivo para Cloudflare Stream...")
        print(f"URL de destino do upload: {upload_url}")
        print(f"Tamanho do arquivo a ser enviado: {file_size} bytes")
        
        try:
            upload_response = requests.post(upload_url, files=files, timeout=300)  # 5 minutos de timeout
            
            print(f"Status do upload para Cloudflare Stream: {upload_response.status_code}")
            print(f"Resposta do Cloudflare Stream: {upload_response.text}")

            if upload_response.status_code not in [200, 201]:
                print(f"❌ Erro no upload: {upload_response.status_code}")
                print(f"❌ Response: {upload_response.text}")
                return jsonify({"success": False, "error": f"Upload failed: {upload_response.status_code} - {upload_response.text}"}), 500
            
            print(f"🎉 Upload completo! UID: {uid}")
            
            return jsonify({
                "success": True,
                "uid": uid,
                "message": "Upload completed successfully",
                "file_size": file_size
            }), 200
            
        except requests.exceptions.Timeout:
            print(f"❌ Timeout no upload")
            return jsonify({"success": False, "error": "Upload timeout"}), 500
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro de rede no upload: {str(e)}")
            return jsonify({"success": False, "error": f"Network error during upload: {str(e)}"}), 500
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
