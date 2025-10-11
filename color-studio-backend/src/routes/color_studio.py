"""
Color Studio Routes - Versão corrigida com CORS e endpoints consolidados
Mantém toda funcionalidade existente + correções CORS
"""

import os
import json
import uuid
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, make_response
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import subprocess
import requests

# Importações de serviços e modelos (assumindo que estão em src/)
from src.models.project import Project, db
from src.services.r2_upload_service import R2UploadService

color_studio_bp = Blueprint("color_studio", __name__)

# Configurações padrão
DEFAULT_UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"braw", "r3d", "ari", "mov", "mp4", "mxf", "dng", "mkv", "avi"}
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

# ==========================================
# ENVIRONMENT VARIABLES
# ==========================================
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_STREAM_API_TOKEN = os.getenv("CLOUDFLARE_STREAM_API_TOKEN", CLOUDFLARE_API_TOKEN)

# R2 Configuration
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "color-studio-raw")
R2_ENDPOINT = f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"

# ==========================================
# HELPER FUNCTIONS
# ==========================================
def get_upload_folder():
    folder = current_app.config.get("UPLOAD_FOLDER", DEFAULT_UPLOAD_FOLDER)
    folder = os.path.abspath(folder)
    os.makedirs(folder, exist_ok=True)
    return folder

def tus_metadata_field(name: str) -> str:
    """Constrói o campo Upload-Metadata no formato TUS"""
    if name is None:
        name = ""
    safe = str(name)
    b64 = base64.b64encode(safe.encode("utf-8")).decode("ascii")
    return f"name {b64}"

def is_allowed_extension(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    return ext in ALLOWED_EXTENSIONS

def handle_preflight():
    """Handler padrão para requisições OPTIONS (preflight CORS)"""
    response = make_response("", 200)
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Upload-Offset, Upload-Length, Tus-Resumable"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

# ==========================================
# CLOUDFLARE STREAM ROUTES (TUS Upload)
# ==========================================

@color_studio_bp.route("/upload-url", methods=["POST", "OPTIONS"])
def get_stream_upload_url():
    """
    Cria sessão TUS para upload de vídeos no Cloudflare Stream
    Endpoint: POST /api/color-studio/upload-url
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        file_size = int(data.get("fileSize", 0))
        file_name = data.get("fileName", "video.mp4")

        if file_size <= 0:
            return jsonify({
                "success": False, 
                "error": "Tamanho do arquivo é obrigatório e deve ser > 0"
            }), 400

        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({
                "success": False, 
                "error": "Credenciais do Cloudflare não configuradas"
            }), 500

        # Endpoint TUS do Cloudflare Stream
        tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"

        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(file_size),
            "Upload-Metadata": tus_metadata_field(file_name)
        }

        current_app.logger.info(f"📤 Creating TUS session for: {file_name} ({file_size} bytes)")

        resp = requests.post(tus_endpoint, headers=headers, timeout=30)
        
        if resp.status_code == 201:
            upload_url = resp.headers.get("Location")
            uid = resp.headers.get("Stream-Media-Id", "unknown")
            
            if upload_url:
                current_app.logger.info(f"✅ TUS session created: {uid}")
                return jsonify({
                    "success": True, 
                    "uploadURL": upload_url, 
                    "uid": uid
                }), 200
            
            return jsonify({
                "success": False, 
                "error": "Location header não retornado pelo Cloudflare"
            }), 500
        else:
            current_app.logger.error(f"❌ TUS creation failed: {resp.status_code} - {resp.text}")
            return jsonify({
                "success": False, 
                "error": f"Erro {resp.status_code}: {resp.text}"
            }), resp.status_code

    except requests.exceptions.RequestException as e:
        current_app.logger.exception("Erro de rede criando sessão TUS")
        return jsonify({"success": False, "error": f"Erro de rede: {str(e)}"}), 502
    except Exception as e:
        current_app.logger.exception("Erro ao criar sessão TUS")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload/stream/init", methods=["POST", "OPTIONS"])
def init_stream_upload():
    """
    Endpoint alternativo para inicializar upload para Stream (compatibilidade)
    Endpoint: POST /api/color-studio/upload/stream/init
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    # Redireciona para get_stream_upload_url
    return get_stream_upload_url()


@color_studio_bp.route("/stream-proxy", methods=["POST", "OPTIONS"])
@cross_origin(origins=["https://douglas-guedes-portfolio.onrender.com", "https://douglas-guedes-portfolio.pages.dev", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization", "X-Requested-With"], supports_credentials=True, max_age=3600)
def stream_proxy_upload():
    """
    Recebe arquivo COMPLETO e faz upload TUS para Cloudflare Stream em chunks
    Endpoint: POST /api/color-studio/stream-proxy
    """
    print("🔥🔥🔥 STREAM-PROXY ENDPOINT HIT! 🔥🔥🔥")
    current_app.logger.error("=== STREAM-PROXY ENDPOINT ENTRY ===")
    
    if request.method == "OPTIONS":
        print("✅ OPTIONS REQUEST - Handling preflight")
        return handle_preflight()
    
    print("✅ POST REQUEST RECEIVED")
    current_app.logger.error(f"Request method: {request.method}")
    current_app.logger.error(f"Request files: {list(request.files.keys())}")
    
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename or f"upload-{uuid.uuid4()}")
        
        # Obter tamanho do arquivo
        file_size = 0
        if hasattr(file, "content_length") and file.content_length:
            file_size = int(file.content_length)
        else:
            file.stream.seek(0, os.SEEK_END)
            file_size = file.stream.tell()
            file.stream.seek(0)

        if file_size == 0:
            return jsonify({"success": False, "error": "Arquivo vazio"}), 400

        current_app.logger.info(f"📤 Stream proxy upload: {filename} ({file_size} bytes)")

        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
        
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({"success": False, "error": "Cloudflare credentials missing"}), 500

        # Criar sessão TUS
        tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
        headers = {
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(file_size),
            "Upload-Metadata": tus_metadata_field(filename)
        }

        resp = requests.post(tus_endpoint, headers=headers, timeout=30)
        
        if resp.status_code != 201:
            return jsonify({
                "success": False, 
                "error": f"Failed to create TUS session: {resp.status_code} - {resp.text}"
            }), 500

        upload_url = resp.headers.get("Location")
        uid = resp.headers.get("Stream-Media-Id", "unknown")
        
        if not upload_url:
            return jsonify({"success": False, "error": "TUS upload URL not returned"}), 500

        # Enviar em chunks (5 MiB)
        chunk_size = 5 * 1024 * 1024
        offset = 0
        file.stream.seek(0)

        while offset < file_size:
            to_read = min(chunk_size, file_size - offset)
            chunk = file.stream.read(to_read)
            if not chunk:
                break

            patch_headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/offset+octet-stream",
                "Upload-Offset": str(offset),
                "Tus-Resumable": "1.0.0"
            }

            patch_resp = requests.patch(upload_url, headers=patch_headers, data=chunk, timeout=60)
            
            if patch_resp.status_code not in (200, 204):
                current_app.logger.error(f"❌ Chunk upload failed at offset {offset}")
                return jsonify({
                    "success": False, 
                    "error": f"Chunk upload failed at offset {offset}: {patch_resp.status_code}"
                }), 500

            offset += len(chunk)
            current_app.logger.info(f"✅ Uploaded chunk: {offset}/{file_size} bytes")

        if offset != file_size:
            return jsonify({
                "success": False, 
                "error": f"Upload incompleto. Esperado: {file_size}, enviado: {offset}"
            }), 500

        current_app.logger.info(f"✅ Stream upload complete: {uid}")

        return jsonify({
            "success": True, 
            "uid": uid, 
            "bytes_uploaded": offset, 
            "file_size": file_size
        }), 200

    except requests.exceptions.RequestException as e:
        current_app.logger.exception("Erro de rede durante stream-proxy")
        return jsonify({"success": False, "error": f"Erro de rede: {str(e)}"}), 502
    except Exception as e:
        current_app.logger.exception("Erro inesperado em stream-proxy")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/video-status", methods=["GET", "OPTIONS"])
def get_video_status():
    """
    Verifica o status de um vídeo no Cloudflare Stream
    Endpoint: GET /api/color-studio/video-status?videoId=xxx
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        video_id = request.args.get("videoId")
        if not video_id:
            return jsonify({"success": False, "error": "videoId é obrigatório"}), 400

        CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
        
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({"success": False, "error": "Credenciais não configuradas"}), 500

        url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream/{video_id}"
        headers = {"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"}
        
        resp = requests.get(url, headers=headers, timeout=15)
        
        if resp.status_code == 200:
            return jsonify({"success": True, "cf": resp.json()}), 200
        
        return jsonify({
            "success": False, 
            "error": f"Erro ao obter status: {resp.status_code} - {resp.text}"
        }), resp.status_code

    except requests.exceptions.RequestException as e:
        current_app.logger.exception("Erro de rede em video-status")
        return jsonify({"success": False, "error": str(e)}), 502
    except Exception as e:
        current_app.logger.exception("Erro inesperado na rota /video-status")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================
# R2 (RAW) UPLOAD ROUTES
# ==========================================

@color_studio_bp.route("/upload/raw/init", methods=["POST", "OPTIONS"])
@cross_origin(origins=["https://douglas-guedes-portfolio.onrender.com", "https://douglas-guedes-portfolio.pages.dev", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"], allow_headers=["Content-Type", "Authorization", "Upload-Offset", "Upload-Length", "Tus-Resumable", "X-Requested-With"], expose_headers=["Content-Length", "Content-Type", "Upload-Offset", "Upload-Length", "Tus-Resumable", "Location", "ETag"], supports_credentials=True, max_age=3600)
def init_raw_upload():
    """
    Inicializa upload multipart para R2 (arquivos RAW)
    Endpoint: POST /api/color-studio/upload/raw/init
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        filename = data.get("fileName") or data.get("filename")
        file_size = int(data.get("fileSize", 0))

        if not filename:
            return jsonify({"success": False, "error": "fileName é obrigatório"}), 400

        current_app.logger.info(f"📤 Initializing RAW upload: {filename} ({file_size} bytes)")

        if not R2UploadService.is_raw_format(filename):
            current_app.logger.warning(f"⚠️ File is not RAW format: {filename}")
            return jsonify({
                "success": False, 
                "error": "Formato não é RAW. Use /upload-url para vídeos normais."
            }), 400

        r2_service = R2UploadService()
        result = r2_service.create_multipart_upload(
            filename=filename,
            metadata={
                "original_name": filename,
                "file_size": str(file_size),
                "upload_date": datetime.utcnow().isoformat()
            }
        )

        if result.get("success"):
            current_app.logger.info(f"✅ RAW multipart upload initialized: {result.get("upload_id")}")
            return jsonify({
                "success": True,
                "uploadId": result.get("upload_id"),
                "key": result.get("key"),
                "bucket": result.get("bucket"),
                "storage": "r2"
            }), 200
        
        return jsonify(result), 500

    except Exception as e:
        current_app.logger.exception("Erro ao iniciar upload RAW")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload/raw/part-url", methods=["POST", "OPTIONS"])
def get_raw_part_url():
    """Gera URL assinada para upload de uma parte específica"""
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        upload_id = data.get("uploadId")
        key = data.get("key")
        part_number = int(data.get("partNumber", 1))

        if not all([upload_id, key, part_number]):
            return jsonify({"success": False, "error": "Dados incompletos"}), 400

        r2_service = R2UploadService()
        result = r2_service.generate_presigned_upload_url(
            upload_id=upload_id, 
            key=key, 
            part_number=part_number
        )
        
        return jsonify(result), 200 if result.get("success") else 500

    except Exception as e:
        current_app.logger.exception("Erro ao gerar URL da parte")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload-raw-part", methods=["POST", "OPTIONS"])
def upload_raw_part():
    """
    Upload de uma parte do arquivo RAW via form-data
    (Este endpoint pode ser usado para compatibilidade, mas o ideal é usar a URL pré-assinada diretamente do frontend)
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        upload_id = request.form.get("uploadId")
        key = request.form.get("key")
        part_number = int(request.form.get("partNumber", 1))

        if "file" not in request.files:
            return jsonify({"success": False, "error": "Arquivo não enviado"}), 400

        file_part = request.files["file"]
        data = file_part.read()

        r2_service = R2UploadService()
        result = r2_service.upload_part(
            upload_id=upload_id, 
            key=key, 
            part_number=part_number, 
            data=data
        )
        
        return jsonify(result), 200 if result.get("success") else 500

    except Exception as e:
        current_app.logger.exception("Erro ao fazer upload da parte")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload/raw/complete", methods=["POST", "OPTIONS"])
def complete_raw_upload():
    """
    Completa o upload multipart e finaliza o arquivo no R2
    Endpoint: POST /api/color-studio/upload/raw/complete
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        upload_id = data.get("uploadId")
        key = data.get("key")
        parts = data.get("parts", [])

        if not all([upload_id, key, parts]):
            return jsonify({"success": False, "error": "Dados incompletos"}), 400

        current_app.logger.info(f"📦 Completing RAW upload: {key}")

        r2_service = R2UploadService()
        result = r2_service.complete_multipart_upload(
            upload_id=upload_id, 
            key=key, 
            parts=parts
        )

        if result.get("success"):
            download_result = r2_service.generate_presigned_url(key, expiration=86400)
            
            current_app.logger.info(f"✅ RAW upload completed: {key}")
            
            return jsonify({
                "success": True,
                "url": download_result.get("url"), # URL para download direto
                "key": result.get("key"),
                "downloadUrl": download_result.get("url"),
                "storage": "r2",
                "message": "RAW upload completed and presigned URL generated"
            }), 200
        
        return jsonify(result), 500

    except Exception as e:
        current_app.logger.exception("Erro ao completar upload RAW")
        return jsonify({"success": False, "error": str(e)}), 500


@color_studio_bp.route("/upload/raw/abort", methods=["POST", "OPTIONS"])
def abort_raw_upload():
    """
    Cancela um upload multipart pendente no R2
    Endpoint: POST /api/color-studio/upload/raw/abort
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        upload_id = data.get("uploadId")
        key = data.get("key")

        if not all([upload_id, key]):
            return jsonify({"success": False, "error": "uploadId e key são obrigatórios"}), 400

        current_app.logger.info(f"❌ Aborting RAW upload: {key} (UploadId: {upload_id})")

        r2_service = R2UploadService()
        result = r2_service.abort_multipart_upload(upload_id, key)
        
        if result.get("success"):
            current_app.logger.info(f"✅ RAW upload aborted: {key}")
            return jsonify({"success": True, "message": "Upload abortado com sucesso"}), 200
        
        return jsonify(result), 500

    except Exception as e:
        current_app.logger.exception("Erro ao abortar upload RAW")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================
# CONVERSION ROUTES
# ==========================================

@color_studio_bp.route("/convert/raw", methods=["POST", "OPTIONS"])
def convert_raw_file():
    """
    Converte um arquivo RAW (do R2) para um formato de vídeo padrão (ex: MP4 H.265) e faz upload para o Stream.
    Endpoint: POST /api/color-studio/convert/raw
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        data = request.get_json(silent=True) or {}
        key = data.get("key")
        output_format = data.get("outputFormat", "mp4")
        
        if not key:
            return jsonify({"success": False, "error": "key é obrigatório"}), 400
        
        current_app.logger.info(f"🔄 Iniciando conversão de RAW: {key} para {output_format}")

        r2_service = R2UploadService()
        
        # 1. Gerar URL de download temporária para o arquivo RAW no R2
        download_result = r2_service.generate_presigned_url(key, expiration=3600) # 1 hora
        if not download_result.get("success"):
            return jsonify(download_result), 500
        
        download_url = download_result["url"]
        
        # 2. Baixar o arquivo RAW para o servidor
        temp_raw_path = os.path.join(get_upload_folder(), f"{uuid.uuid4()}.raw")
        current_app.logger.info(f"⬇️ Baixando RAW de R2 para: {temp_raw_path}")
        response = requests.get(download_url, stream=True, timeout=300)  # 5 minutos para download grande
        response.raise_for_status() # Levanta exceção para status de erro
        with open(temp_raw_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        current_app.logger.info(f"✅ Download RAW concluído: {temp_raw_path}")

        # 3. Converter o arquivo usando FFmpeg (com cleanup automático)
        output_filename = f"{os.path.splitext(key)[0]}.{output_format}"
        output_path = os.path.join(get_upload_folder(), output_filename)
        
        try:
            # Exemplo de comando FFmpeg para converter para H.265
            ffmpeg_command = [
                "ffmpeg",
                "-i", os.path.abspath(temp_raw_path),  # Usar absolute path por segurança
                "-c:v", "libx265", # Codec H.265
                "-crf", "23",      # Qualidade (menor = melhor qualidade, maior arquivo)
                "-preset", "medium", # Velocidade de codificação
                "-tag:v", "hvc1", # Tag para compatibilidade com H.265
                "-c:a", "aac",     # Codec de áudio
                "-b:a", "128k",    # Bitrate de áudio
                os.path.abspath(output_path)
            ]
            current_app.logger.info(f"▶️ Executando FFmpeg: {' '.join(ffmpeg_command)}")
            # ✅ CORRIGIDO: Reduzir timeout de 1h para 30min (1800s)
            subprocess.run(ffmpeg_command, check=True, capture_output=True, timeout=1800)
            current_app.logger.info(f"✅ Conversão FFmpeg concluída: {output_path}")
        except subprocess.TimeoutExpired:
            current_app.logger.error("❌ FFmpeg timeout - arquivo muito grande ou corrompido")
            # ✅ ADICIONADO: Limpar output_path em caso de erro
            if os.path.exists(output_path):
                os.remove(output_path)
            raise
        except Exception as e:
            current_app.logger.error(f"❌ Erro no FFmpeg: {str(e)}")
            # ✅ ADICIONADO: Limpar output_path em caso de erro
            if os.path.exists(output_path):
                os.remove(output_path)
            raise
        finally:
            # Sempre limpar arquivo RAW temporário
            if os.path.exists(temp_raw_path):
                os.remove(temp_raw_path)
                current_app.logger.info(f"🗑️ Arquivo RAW temporário removido: {temp_raw_path}")

        # 4. Fazer upload do arquivo convertido para o Cloudflare Stream
        with open(output_path, "rb") as f_converted:
            converted_file_data = f_converted.read()
            converted_file_size = len(converted_file_data)
            converted_file_name = os.path.basename(output_path)
            
            CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
            CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
            
            tus_endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Tus-Resumable": "1.0.0",
                "Upload-Length": str(converted_file_size),
                "Upload-Metadata": tus_metadata_field(converted_file_name)
            }
            current_app.logger.info(f"📤 Criando sessão TUS para arquivo convertido: {converted_file_name}")
            resp = requests.post(tus_endpoint, headers=headers, timeout=30)
            resp.raise_for_status()
            
            upload_url = resp.headers.get("Location")
            uid = resp.headers.get("Stream-Media-Id", "unknown")
            
            if not upload_url:
                return jsonify({"success": False, "error": "TUS upload URL not returned for converted file"}), 500
            
            # Upload do arquivo convertido em chunks
            chunk_size = 5 * 1024 * 1024 # 5 MiB
            offset = 0
            while offset < converted_file_size:
                chunk = converted_file_data[offset:offset + chunk_size]
                patch_headers = {
                    "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                    "Content-Type": "application/offset+octet-stream",
                    "Upload-Offset": str(offset),
                    "Tus-Resumable": "1.0.0"
                }
                requests.patch(upload_url, headers=patch_headers, data=chunk, timeout=60).raise_for_status()
                offset += len(chunk)
            current_app.logger.info(f"✅ Upload do arquivo convertido para Stream concluído: {uid}")

            # 5. Limpar arquivo convertido temporário
            if os.path.exists(output_path):
                os.remove(output_path)
                current_app.logger.info(f"🗑️ Arquivo convertido temporário removido: {output_path}")
            
            return jsonify({
                "success": True,
                "message": "Conversão e upload para Stream concluídos",
                "stream_uid": uid,
                "original_key": key
            }), 200
            
    except subprocess.CalledProcessError as e:
        current_app.logger.exception(f"Erro FFmpeg: {e.stderr.decode()}")
        return jsonify({"success": False, "error": f"Erro na conversão de vídeo: {e.stderr.decode()}"}), 500
    except requests.exceptions.RequestException as e:
        current_app.logger.exception(f"Erro de rede/API: {str(e)}")
        return jsonify({"success": False, "error": f"Erro de comunicação com serviços externos: {str(e)}"}), 500
    except Exception as e:
        current_app.logger.exception("Erro inesperado na conversão")
        return jsonify({"success": False, "error": f"Erro interno do servidor: {str(e)}"}), 500


# ==========================================
# UTILITY ROUTES
# ==========================================

@color_studio_bp.route("/files", methods=["GET", "OPTIONS"])
def list_files():
    """
    Lista arquivos (exemplo, pode ser expandido para listar R2 e Stream)
    Endpoint: GET /api/color-studio/files
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    try:
        # Aqui você pode listar arquivos do R2 e Stream
        # Por enquanto retorna lista vazia
        return jsonify({
            "success": True,
            "files": []
        }), 200
    except Exception as e:
        current_app.logger.exception("Erro ao listar arquivos")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@color_studio_bp.route("/status", methods=["GET", "OPTIONS"])
def status():
    """
    Verifica o status do serviço Color Studio e suas integrações
    Endpoint: GET /api/color-studio/status
    """
    if request.method == "OPTIONS":
        return handle_preflight()
    
    r2_configured = bool(R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)
    stream_configured = bool(CLOUDFLARE_STREAM_API_TOKEN)
    
    return jsonify({
        "success": True,
        "status": "operational",
        "services": {
            "r2": {
                "configured": r2_configured,
                "bucket": R2_BUCKET_NAME if r2_configured else None
            },
            "stream": {
                "configured": stream_configured,
                "accountId": CLOUDFLARE_ACCOUNT_ID if stream_configured else None
            }
        }
    }), 200

