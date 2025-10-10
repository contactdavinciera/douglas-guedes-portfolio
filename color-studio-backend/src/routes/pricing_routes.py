from flask import Blueprint, request, jsonify
from src.services.automatic_pricing import AutomaticPricing
from src.services.lut_manager import LUTManager

pricing_bp = Blueprint("pricing", __name__)

@pricing_bp.route("/calculate", methods=["POST"])
def calculate_pricing():
    """
    Calcula preço para um projeto
    """
    try:
        data = request.get_json()
        
        duration = data.get("duration_seconds")
        codec = data.get("codec", "PRORES")
        resolution = data.get("resolution", "1920x1080")
        project_type = data.get("project_type", "SDR")
        num_clips = data.get("num_clips", 1)
        is_rush = data.get("is_rush", False)
        
        if duration is None:
            return jsonify({"error": "duration_seconds é obrigatório"}), 400
        
        pricing = AutomaticPricing.calculate_price(
            duration_seconds=duration,
            codec=codec,
            resolution=resolution,
            project_type=project_type,
            num_clips=num_clips,
            is_rush=is_rush
        )
        
        return jsonify(pricing)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pricing_bp.route("/batch-calculate", methods=["POST"])
def calculate_batch_pricing():
    """
    Calcula preço para múltiplos clips
    """
    try:
        data = request.get_json()
        clips = data.get("clips", [])
        
        if not clips:
            return jsonify({"error": "Lista de clips é obrigatória"}), 400
        
        pricing = AutomaticPricing.calculate_batch_price(clips)
        
        return jsonify(pricing)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pricing_bp.route("/table", methods=["GET"])
def get_pricing_table():
    """
    Retorna tabela de preços
    """
    try:
        table = AutomaticPricing.get_pricing_table()
        return jsonify(table)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pricing_bp.route("/luts/compatible", methods=["POST"])
def get_compatible_luts():
    """
    Retorna LUTs compatíveis com um formato
    """
    try:
        data = request.get_json()
        
        color_space = data.get("color_space", "Rec.709")
        gamma = data.get("gamma", "Gamma 2.4")
        project_type = data.get("project_type", "SDR")
        
        luts = LUTManager.get_compatible_luts(color_space, gamma, project_type)
        
        return jsonify({
            "compatible_luts": luts,
            "input_format": {
                "color_space": color_space,
                "gamma": gamma,
                "project_type": project_type
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pricing_bp.route("/luts/all", methods=["GET"])
def get_all_luts():
    """
    Retorna toda biblioteca de LUTs
    """
    try:
        library = LUTManager.get_all_luts()
        return jsonify(library)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pricing_bp.route("/estimate-quick", methods=["POST"])
def quick_estimate():
    """
    Estimativa rápida baseada em parâmetros básicos
    """
    try:
        data = request.get_json()
        
        # Parâmetros básicos
        duration_minutes = data.get("duration_minutes", 1)
        project_type = data.get("project_type", "SDR")
        quality = data.get("quality", "standard")  # standard, premium, rush
        
        # Converter para segundos
        duration_seconds = duration_minutes * 60
        
        # Determinar se é rush
        is_rush = quality == "rush"
        
        # Usar codec padrão baseado na qualidade
        codec = "PRORES" if quality == "premium" else "H264"
        
        pricing = AutomaticPricing.calculate_price(
            duration_seconds=duration_seconds,
            codec=codec,
            resolution="1920x1080",
            project_type=project_type,
            is_rush=is_rush
        )
        
        return jsonify({
            "estimate": pricing["final_price"],
            "breakdown": pricing["breakdown"],
            "per_minute_rate": round(pricing["final_price"] / duration_minutes, 2)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

