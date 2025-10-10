from flask import Blueprint, request, jsonify
from src.services.conversion_service import ConversionService

conversion_bp = Blueprint("conversion", __name__)
conversion_service = ConversionService()

@conversion_bp.route("/create-proxy", methods=["POST"])
def create_proxy_route():
    data = request.get_json()
    media_file_id = data.get("media_file_id")
    project_id = data.get("project_id")
    original_file_key = data.get("original_file_key")

    if not all([media_file_id, project_id, original_file_key]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    result = conversion_service.create_proxy(media_file_id, project_id, original_file_key)
    return jsonify(result), 200 if result["success"] else 500

@conversion_bp.route("/proxy-status/<int:media_file_id>", methods=["GET"])
def get_proxy_status_route(media_file_id):
    result = conversion_service.get_proxy_status(media_file_id)
    return jsonify(result), 200 if result["success"] else 500

@conversion_bp.route("/start", methods=["POST"])
def start_conversion_route():
    """Iniciar conversão de arquivo RAW para H.265"""
    data = request.get_json()
    media_file_id = data.get("media_file_id")
    output_format = data.get("output_format", "h265")
    quality = data.get("quality", "high")

    if not media_file_id:
        return jsonify({"success": False, "error": "media_file_id is required"}), 400

    result = conversion_service.start_h265_conversion(media_file_id, output_format, quality)
    return jsonify(result), 200 if result["success"] else 500

@conversion_bp.route("/status/<conversion_id>", methods=["GET"])
def get_conversion_status_route(conversion_id):
    """Obter status da conversão"""
    result = conversion_service.get_conversion_status(conversion_id)
    return jsonify(result), 200 if result["success"] else 500

