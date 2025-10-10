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
    Recebe arquivo COMPLETO e faz upload TUS para Cloudflare Stream
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
        
        # 1. Criar sessão TUS
        tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
        
        # Codificar o nome do arquivo em base64 para o metadata
        import base64
        # Corrigido: Garantir que file.filename é uma string antes de codificar
        filename_str = str(file.filename) if file.filename else "unknown_file"
        filename_b64 = base64.b64encode(filename_str.encode("utf-8")).decode("ascii")        
        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(file_size),
            "Upload-Metadata": f"name {filename_b64}"
        }
        
        response = requests.post(tus_endpoint, headers=headers, timeout=30)
        
        if response.status_code != 201:
            error_msg = response.text
            print(f"❌ Erro ao criar sessão TUS: {response.status_code} - {error_msg}")
            return jsonify({"success": False, "error": f"Failed to create TUS session: {error_msg}"}), 500
        
        upload_url = response.headers.get("Location")
        uid = response.headers.get("Stream-Media-Id", "unknown")
        
        if not upload_url:
            return jsonify({"success": False, "error": "TUS upload URL not returned"}), 500

        print(f"✅ Sessão TUS criada: {upload_url}")
        
        # 2. Upload em chunks via TUS
        # Usar chunk size de 5 MiB conforme requisito mínimo do Cloudflare Stream
        chunk_size = 5 * 1024 * 1024  # 5 MiB
        
        offset = 0
        
        # Garantir que estamos no início do arquivo
        file.seek(0)

        while offset < file_size:
            # Calcular o tamanho do chunk atual
            remaining = file_size - offset
            current_chunk_size = min(chunk_size, remaining)
            
            chunk = file.read(current_chunk_size)
            if not chunk:
                break
            
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/offset+octet-stream",
                "Upload-Offset": str(offset),
                "Tus-Resumable": "1.0.0"
            }
            
            print(f"📦 Enviando chunk: offset={offset}, size={len(chunk)}")
            
            try:
                response = requests.patch(upload_url, headers=headers, data=chunk, timeout=60)
                
                if response.status_code not in [200, 204]:
                    print(f"❌ Erro no chunk: {response.status_code}")
                    print(f"❌ Response: {response.text}")
                    print(f"❌ Headers enviados: {headers}")
                    return jsonify({"success": False, "error": f"Chunk upload failed at offset {offset}: {response.status_code} - {response.text}"}), 500
            except requests.exceptions.Timeout:
                print(f"❌ Timeout no chunk offset {offset}")
                return jsonify({"success": False, "error": f"Timeout uploading chunk at offset {offset}"}), 500
            except requests.exceptions.RequestException as e:
                print(f"❌ Erro de rede no chunk offset {offset}: {str(e)}")
                return jsonify({"success": False, "error": f"Network error uploading chunk at offset {offset}: {str(e)}"}), 500
            
            offset += len(chunk)
            progress = int((offset / file_size) * 100)
            print(f"📊 Progresso: {progress}%")
        
        print(f"🎉 Upload completo! UID: {uid}")
        
        # Verificar se o upload foi realmente bem-sucedido
        if offset != file_size:
            print(f"⚠️ Aviso: Upload incompleto. Esperado: {file_size}, Enviado: {offset}")
            return jsonify({
                "success": False,
                "error": f"Upload incompleto. Esperado: {file_size} bytes, enviado: {offset} bytes"
            }), 500
        
        print(f"✅ Verificação de integridade passou. Arquivo completo enviado.")
        
        return jsonify({
            "success": True,
            "uid": uid,
            "message": "Upload completed successfully",
            "bytes_uploaded": offset,
            "file_size": file_size
        }), 200
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500



@color_studio_bp.route("/video-status", methods=["GET"])
def get_video_status():
    """
    Verifica o status de um vídeo no Cloudflare Stream
    """
    try:
        video_id = request.args.get("videoId")
        if not video_id:
            return jsonify({"success": False, "error": "videoId é obrigatório"}), 400

        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({"success": False, "error": "Credenciais do Cloudflare não configuradas"}), 500

        url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream/{video_id}"
        headers = {"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"}

        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code == 200:
            return jsonify({"success": True, "cf": response.json()}), 200
        else:
            return jsonify({"success": False, "error": f"Erro ao obter status do vídeo: {response.status_code} - {response.text}"}), response.status_code

    except Exception as e:
        print(f"❌ Erro inesperado na rota /video-status: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Erro interno do servidor: {str(e)}"}), 500



from src.services.r2_upload_service import R2UploadService

@color_studio_bp.route("/upload-raw-init", methods=["POST"])
def init_raw_upload():
    """
    Inicia upload de arquivo RAW para R2
    """
    try:
        data = request.get_json() or {}
        filename = data.get("fileName")
        file_size = data.get("fileSize", 0)
        
        if not filename:
            return jsonify({"success": False, "error": "fileName é obrigatório"}), 400
        
        # Verificar se é formato RAW
        if not R2UploadService.is_raw_format(filename):
            return jsonify({
                "success": False,
                "error": f"Formato não é RAW. Use /upload-url para vídeos normais."
            }), 400
        
        # Iniciar upload no R2
        r2_service = R2UploadService()
        result = r2_service.create_multipart_upload(
            filename=filename,
            metadata={
                "original_name": filename,
                "file_size": str(file_size),
                "upload_date": datetime.utcnow().isoformat()
            }
        )
        
        if result["success"]:
            return jsonify({
                "success": True,
                "uploadId": result["upload_id"],
                "key": result["key"],
                "bucket": result["bucket"],
                "storage": "r2"
            }), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ Erro ao iniciar upload RAW: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload-raw-part", methods=["POST"])
def upload_raw_part():
    """
    Faz upload de uma parte do arquivo RAW
    """
    try:
        upload_id = request.form.get("uploadId")
        key = request.form.get("key")
        part_number = int(request.form.get("partNumber", 1))
        
        if "file" not in request.files:
            return jsonify({"success": False, "error": "Arquivo não enviado"}), 400
        
        file_part = request.files["file"]
        data = file_part.read()
        
        # Upload da parte
        r2_service = R2UploadService()
        result = r2_service.upload_part(
            upload_id=upload_id,
            key=key,
            part_number=part_number,
            data=data
        )
        
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        print(f"❌ Erro ao fazer upload da parte: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload-raw-complete", methods=["POST"])
def complete_raw_upload():
    """
    Finaliza upload RAW
    """
    try:
        data = request.get_json() or {}
        upload_id = data.get("uploadId")
        key = data.get("key")
        parts = data.get("parts", [])  # [{"PartNumber": 1, "ETag": "xxx"}, ...]
        
        if not all([upload_id, key, parts]):
            return jsonify({"success": False, "error": "Dados incompletos"}), 400
        
        # Completar upload
        r2_service = R2UploadService()
        result = r2_service.complete_multipart_upload(
            upload_id=upload_id,
            key=key,
            parts=parts
        )
        
        if result["success"]:
            # Gerar presigned URL para download
            download_result = r2_service.generate_presigned_url(key, expiration=86400)  # 24h
            
            return jsonify({
                "success": True,
                "url": result["url"],
                "key": result["key"],
                "downloadUrl": download_result.get("url"),
                "storage": "r2"
            }), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ Erro ao completar upload RAW: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload-raw-abort", methods=["POST"])
def abort_raw_upload():
    """
    Cancela upload RAW
    """
    try:
        data = request.get_json() or {}
        upload_id = data.get("uploadId")
        key = data.get("key")
        
        r2_service = R2UploadService()
        result = r2_service.abort_multipart_upload(upload_id, key)
        
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        print(f"❌ Erro ao cancelar upload: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

