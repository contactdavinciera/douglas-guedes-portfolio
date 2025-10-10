from flask import Blueprint, request, jsonify, current_app
import os
from src.services.tus_upload_manager import TUSUploadManager
from src.services.r2_upload_service import R2UploadService
from src.services.video_analyzer import VideoAnalyzer
from src.services.automatic_pricing import AutomaticPricing
from src.models.project import Project, db

upload_bp = Blueprint("upload", __name__)

# Inicializar TUS Upload Manager e R2 Upload Service
tus_manager = TUSUploadManager(upload_dir="uploads/temp")
try:
    r2_service = R2UploadService()
except ValueError as e:
    print(f"⚠️ R2 Service não configurado: {e}")
    r2_service = None

@upload_bp.route("/create-upload", methods=["POST"])
def create_upload():
    """
    Cria um novo upload - TUS para Stream, R2 para RAW
    """
    try:
        data = request.get_json()
        
        filename = data.get("filename")
        file_size = data.get("file_size")
        client_email = data.get("client_email")
        project_name = data.get("project_name", filename)
        
        if not all([filename, file_size, client_email]):
            return jsonify({"error": "filename, file_size e client_email são obrigatórios"}), 400
        
        # Detectar se é arquivo RAW
        is_raw = R2UploadService.is_raw_format(filename) if r2_service else False
        
        if is_raw and r2_service:
            # Upload RAW via R2
            result = r2_service.create_multipart_upload(
                filename=filename,
                metadata={
                    "client_email": client_email,
                    "project_name": project_name,
                    "file_size": str(file_size)
                }
            )
            
            if result["success"]:
                return jsonify({
                    "upload_id": result["upload_id"],
                    "upload_url": f"/api/upload/r2-part/{result['upload_id']}",
                    "upload_type": "r2",
                    "key": result["key"],
                    "bucket": result["bucket"],
                    "status": "created"
                })
            else:
                return jsonify({"error": result["error"]}), 500
        else:
            # Upload Stream via TUS
            upload_id = tus_manager.create_upload(
                file_size=file_size,
                filename=filename,
                metadata={
                    "client_email": client_email,
                    "project_name": project_name
                }
            )
            
            return jsonify({
                "upload_id": upload_id,
                "upload_url": f"/api/upload/chunk/{upload_id}",
                "upload_type": "tus",
                "status": "created"
            })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@upload_bp.route("/chunk/<upload_id>", methods=["PATCH"])
def upload_chunk(upload_id):
    """
    Faz upload de um chunk
    """
    try:
        # Obter offset do header
        offset = int(request.headers.get("Upload-Offset", 0))
        
        # Obter dados do chunk
        chunk_data = request.get_data()
        
        if not chunk_data:
            return jsonify({"error": "Nenhum dado recebido"}), 400
        
        # Fazer upload do chunk
        result = tus_manager.upload_chunk(upload_id, offset, chunk_data)
        
        # Se upload completo, processar arquivo
        if result["status"] == "completed":
            # Processar em background (ou imediatamente para demo)
            process_completed_upload.delay(upload_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@upload_bp.route("/status/<upload_id>", methods=["GET"])
def get_upload_status(upload_id):
    """
    Retorna status do upload
    """
    try:
        status = tus_manager.get_upload_status(upload_id)
        
        if not status:
            return jsonify({"error": "Upload não encontrado"}), 404
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_completed_upload(upload_id):
    """
    Processa upload completo (análise + precificação)
    Esta função seria executada em background com Celery
    """
    try:
        # Obter metadata do upload
        upload_status = tus_manager.get_upload_status(upload_id)
        if not upload_status:
            return
        
        # Caminho temporário do arquivo
        temp_path = tus_manager._get_upload_path(upload_id)
        
        # Analisar vídeo
        analysis = VideoAnalyzer.analyze_video(temp_path)
        
        # Calcular preço
        pricing = AutomaticPricing.calculate_price(
            duration_seconds=analysis["duration"],
            codec=analysis["codec"],
            resolution=analysis["resolution"],
            project_type="SDR"  # Default, pode ser alterado pelo cliente
        )
        
        # Mover arquivo para local permanente
        final_filename = f"{upload_id}_{upload_status['filename']}"
        final_path = os.path.join("uploads/projects", final_filename)
        
        tus_manager.finalize_upload(upload_id, final_path)
        
        # Criar projeto no banco
        metadata = tus_manager._load_metadata(upload_id)
        
        project = Project(
            name=metadata["metadata"]["project_name"],
            client_email=metadata["metadata"]["client_email"],
            original_filename=upload_status["filename"],
            file_format=analysis["codec"],
            color_space=analysis["color_space"],
            resolution=analysis["resolution"],
            duration=analysis["duration"],
            file_size=upload_status["file_size"],
            estimated_price=pricing["final_price"],
            status="analyzed"
        )
        
        # Adicionar metadados extras
        project.set_metadata({
            "analysis": analysis,
            "pricing_breakdown": pricing,
            "upload_id": upload_id,
            "file_path": final_path
        })
        
        db.session.add(project)
        db.session.commit()
        
        print(f"Projeto {project.id} criado com sucesso para upload {upload_id}")
        
    except Exception as e:
        print(f"Erro ao processar upload {upload_id}: {str(e)}")

@upload_bp.route("/analyze/<upload_id>", methods=["POST"])
def analyze_upload(upload_id):
    """
    Força análise de um upload (para testes)
    """
    try:
        process_completed_upload(upload_id)
        return jsonify({"message": "Análise iniciada"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@upload_bp.route("/r2-part/<upload_id>", methods=["PUT"])
def upload_r2_part():
    """
    Faz upload de uma parte para R2
    """
    try:
        if not r2_service:
            return jsonify({"error": "R2 service não configurado"}), 500
        
        data = request.get_json()
        upload_id = data.get("upload_id")
        key = data.get("key")
        part_number = data.get("part_number")
        part_data = data.get("data")  # Base64 encoded
        
        if not all([upload_id, key, part_number, part_data]):
            return jsonify({"error": "upload_id, key, part_number e data são obrigatórios"}), 400
        
        # Decodificar dados base64
        import base64
        decoded_data = base64.b64decode(part_data)
        
        # Upload da parte
        result = r2_service.upload_part(upload_id, key, part_number, decoded_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@upload_bp.route("/r2-complete/<upload_id>", methods=["POST"])
def complete_r2_upload(upload_id):
    """
    Finaliza upload R2 multipart
    """
    try:
        if not r2_service:
            return jsonify({"error": "R2 service não configurado"}), 500
        
        data = request.get_json()
        key = data.get("key")
        parts = data.get("parts")  # [{"PartNumber": 1, "ETag": "xxx"}, ...]
        
        if not all([key, parts]):
            return jsonify({"error": "key e parts são obrigatórios"}), 400
        
        # Completar upload
        result = r2_service.complete_multipart_upload(upload_id, key, parts)
        
        if result["success"]:
            # TODO: Processar arquivo RAW (análise, precificação, etc.)
            pass
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@upload_bp.route("/r2-abort/<upload_id>", methods=["DELETE"])
def abort_r2_upload(upload_id):
    """
    Cancela upload R2 multipart
    """
    try:
        if not r2_service:
            return jsonify({"error": "R2 service não configurado"}), 500
        
        data = request.get_json()
        key = data.get("key")
        
        if not key:
            return jsonify({"error": "key é obrigatório"}), 400
        
        # Cancelar upload
        result = r2_service.abort_multipart_upload(upload_id, key)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
