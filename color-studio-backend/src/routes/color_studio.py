import os
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src.models.project import Project, db
import subprocess
import mimetypes
import requests  # ← ADICIONADO

color_studio_bp = Blueprint('color_studio', __name__)

# Configurações de upload
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'braw', 'r3d', 'ari', 'mov', 'mp4', 'mxf', 'dng', 'mkv', 'avi'}
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_file_format(filename):
    """Detecta o formato do arquivo e suas características"""
    extension = filename.rsplit('.', 1)[1].lower()
    
    formats = {
        'braw': {
            'format': 'BRAW',
            'color_space': 'Blackmagic Wide Gamut',
            'needs_transform': True,
            'multiplier': 1.3
        },
        'r3d': {
            'format': 'RED R3D',
            'color_space': 'REDWideGamutRGB',
            'needs_transform': True,
            'multiplier': 1.4
        },
        'ari': {
            'format': 'ALEXA',
            'color_space': 'LogC',
            'needs_transform': True,
            'multiplier': 1.2
        },
        'mov': {
            'format': 'QuickTime',
            'color_space': 'Rec.709',
            'needs_transform': False,
            'multiplier': 1.0
        },
        'mp4': {
            'format': 'MP4',
            'color_space': 'Rec.709',
            'needs_transform': False,
            'multiplier': 1.0
        },
        'mxf': {
            'format': 'Sony MXF',
            'color_space': 'S-Gamut3',
            'needs_transform': True,
            'multiplier': 1.2
        },
        'dng': {
            'format': 'Cinema DNG',
            'color_space': 'Linear',
            'needs_transform': True,
            'multiplier': 1.5
        }
    }
    
    return formats.get(extension, {
        'format': 'Unknown',
        'color_space': 'Unknown',
        'needs_transform': False,
        'multiplier': 1.0
    })

def calculate_price(file_format, duration=60, resolution='4K', file_size_mb=1000):
    """Calcula o preço baseado na complexidade do projeto"""
    base_price = 150  # Preço base para 1 minuto em 4K
    
    # Multiplicadores por resolução
    resolution_multipliers = {
        '1080p': 0.7,
        '4K': 1.0,
        '6K': 1.3,
        '8K': 1.6
    }
    
    format_info = detect_file_format(f"dummy.{file_format.lower()}")
    format_multiplier = format_info.get('multiplier', 1.0)
    res_multiplier = resolution_multipliers.get(resolution, 1.0)
    duration_multiplier = max(duration / 60, 0.5)  # Mínimo 30 segundos
    
    # Multiplicador por tamanho do arquivo (arquivos maiores = mais complexos)
    size_multiplier = min(file_size_mb / 1000, 2.0)  # Máximo 2x
    
    final_price = base_price * format_multiplier * res_multiplier * duration_multiplier * size_multiplier
    return round(final_price, 2)

def extract_video_metadata(filepath):
    """Extrai metadados do vídeo usando ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filepath
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            metadata = json.loads(result.stdout)
            
            # Extrair informações do primeiro stream de vídeo
            video_stream = None
            for stream in metadata.get('streams', []):
                if stream.get('codec_type') == 'video':
                    video_stream = stream
                    break
            
            if video_stream:
                duration = float(metadata.get('format', {}).get('duration', 0))
                width = video_stream.get('width', 0)
                height = video_stream.get('height', 0)
                
                # Determinar resolução
                if height >= 2160:
                    resolution = '4K'
                elif height >= 1440:
                    resolution = '2K'
                elif height >= 1080:
                    resolution = '1080p'
                else:
                    resolution = '720p'
                
                return {
                    'duration': duration,
                    'resolution': resolution,
                    'width': width,
                    'height': height,
                    'codec': video_stream.get('codec_name', 'unknown'),
                    'bitrate': video_stream.get('bit_rate', 0),
                    'fps': eval(video_stream.get('r_frame_rate', '0/1'))
                }
    except Exception as e:
        print(f"Erro ao extrair metadados: {e}")
    
    # Valores padrão se não conseguir extrair
    return {
        'duration': 60,
        'resolution': '4K',
        'width': 3840,
        'height': 2160,
        'codec': 'unknown',
        'bitrate': 0,
        'fps': 24
    }

@color_studio_bp.route('/upload', methods=['POST'])
def upload_file():
    """Endpoint para upload de arquivos de vídeo"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Formato de arquivo não suportado'}), 400
        
        # Dados adicionais do formulário
        project_name = request.form.get('project_name', 'Projeto sem nome')
        client_email = request.form.get('client_email', '')
        
        if not client_email:
            return jsonify({'error': 'Email do cliente é obrigatório'}), 400
        
        # Criar diretório de upload se não existir
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Gerar nome único para o arquivo
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(upload_dir, unique_filename)
        
        # Salvar arquivo
        file.save(filepath)
        file_size = os.path.getsize(filepath)
        
        # Verificar tamanho do arquivo
        if file_size > MAX_FILE_SIZE:
            os.remove(filepath)
            return jsonify({'error': 'Arquivo muito grande (máximo 5GB)'}), 400
        
        # Detectar formato
        format_info = detect_file_format(filename)
        
        # Extrair metadados do vídeo
        video_metadata = extract_video_metadata(filepath)
        
        # Calcular preço
        file_size_mb = file_size / (1024 * 1024)
        estimated_price = calculate_price(
            format_info['format'],
            video_metadata['duration'],
            video_metadata['resolution'],
            file_size_mb
        )
        
        # Criar projeto no banco de dados
        project = Project(
            name=project_name,
            client_email=client_email,
            original_filename=filename,
            file_format=format_info['format'],
            color_space=format_info['color_space'],
            resolution=video_metadata['resolution'],
            duration=video_metadata['duration'],
            file_size=file_size,
            estimated_price=estimated_price
        )
        
        # Adicionar metadados extras
        project.set_metadata({
            'filepath': filepath,
            'unique_filename': unique_filename,
            'video_metadata': video_metadata,
            'format_info': format_info
        })
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'project': project.to_dict(),
            'message': 'Arquivo enviado e analisado com sucesso'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@color_studio_bp.route('/projects', methods=['GET'])
def get_projects():
    """Lista todos os projetos"""
    try:
        projects = Project.query.order_by(Project.created_at.desc()).all()
        return jsonify({
            'projects': [project.to_dict() for project in projects]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erro ao buscar projetos: {str(e)}'}), 500

@color_studio_bp.route('/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """Busca um projeto específico"""
    try:
        project = Project.query.get_or_404(project_id)
        return jsonify({'project': project.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': f'Erro ao buscar projeto: {str(e)}'}), 500

@color_studio_bp.route('/projects/<int:project_id>/apply-lut', methods=['POST'])
def apply_lut(project_id):
    """Aplica um LUT a um projeto"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        lut_id = data.get('lut_id')
        processing_mode = data.get('processing_mode', 'auto')
        output_format = data.get('output_format', 'rec709')
        
        if not lut_id:
            return jsonify({'error': 'LUT ID é obrigatório'}), 400
        
        # Atualizar projeto
        project.selected_lut = lut_id
        project.processing_mode = processing_mode
        project.output_format = output_format
        project.status = 'processing'
        project.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Aqui seria iniciado o processamento real do vídeo
        # Por enquanto, apenas simulamos
        
        return jsonify({
            'success': True,
            'project': project.to_dict(),
            'message': f'LUT {lut_id} aplicado com sucesso'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro ao aplicar LUT: {str(e)}'}), 500

@color_studio_bp.route('/projects/<int:project_id>/quote', methods=['POST'])
def request_quote(project_id):
    """Solicita orçamento para um projeto"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        notes = data.get('notes', '')
        
        # Atualizar projeto com notas do cliente
        project.notes = notes
        project.status = 'quote_requested'
        project.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Aqui seria enviado um email para Douglas com os detalhes do projeto
        
        return jsonify({
            'success': True,
            'project': project.to_dict(),
            'message': 'Orçamento solicitado com sucesso. Você receberá uma resposta em breve.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro ao solicitar orçamento: {str(e)}'}), 500

@color_studio_bp.route('/luts', methods=['GET'])
def get_luts():
    """Retorna a biblioteca de LUTs disponíveis"""
    lut_library = {
        'cinema': [
            {'id': 'blockbuster', 'name': 'Blockbuster', 'description': 'Estilo Hollywood épico'},
            {'id': 'indie', 'name': 'Indie Film', 'description': 'Look cinematográfico independente'},
            {'id': 'noir', 'name': 'Film Noir', 'description': 'Alto contraste, sombras dramáticas'},
            {'id': 'thriller', 'name': 'Thriller', 'description': 'Tons frios, atmosfera tensa'}
        ],
        'commercial': [
            {'id': 'clean', 'name': 'Clean & Bright', 'description': 'Limpo e vibrante para comerciais'},
            {'id': 'corporate', 'name': 'Corporate', 'description': 'Profissional e confiável'},
            {'id': 'fashion', 'name': 'Fashion', 'description': 'Cores saturadas, pele perfeita'},
            {'id': 'food', 'name': 'Food & Beverage', 'description': 'Cores apetitosas e quentes'}
        ],
        'social': [
            {'id': 'instagram-warm', 'name': 'Instagram Warm', 'description': 'Tons quentes para redes sociais'},
            {'id': 'instagram-cool', 'name': 'Instagram Cool', 'description': 'Tons frios modernos'},
            {'id': 'vintage', 'name': 'Vintage', 'description': 'Look retrô nostálgico'},
            {'id': 'moody', 'name': 'Moody', 'description': 'Atmosfera dramática e escura'}
        ],
        'special': [
            {'id': 'teal-orange', 'name': 'Teal & Orange', 'description': 'Clássico contraste complementar'},
            {'id': 'bleach-bypass', 'name': 'Bleach Bypass', 'description': 'Alto contraste, cores dessaturadas'},
            {'id': 'desaturated', 'name': 'Desaturated', 'description': 'Cores suaves e naturais'},
            {'id': 'cyberpunk', 'name': 'Cyberpunk', 'description': 'Neons vibrantes, futuro distópico'}
        ]
    }
    
    return jsonify({'luts': lut_library}), 200

# ============================================
# NOVO ENDPOINT PARA CLOUDFLARE STREAM
# ============================================
@color_studio_bp.route('/upload-url', methods=['POST'])
def get_stream_upload_url():
    """
    Obtém URL de upload do Cloudflare Stream
    """
    try:
        CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
        CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')
        
        # Validar credenciais
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({
                'success': False,
                'error': 'Credenciais do Cloudflare não configuradas'
            }), 500
        
        # Log para debug
        print(f"🔑 Account ID: {CLOUDFLARE_ACCOUNT_ID[:8]}...")
        
        # Fazer requisição ao Cloudflare Stream
        url = f'https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true'
        
        headers = {
            'Authorization': f'Bearer {CLOUDFLARE_API_TOKEN}',
        }
        
        print(f"📤 Fazendo requisição TUS para: {url}")
        
        response = requests.post(url, headers=headers)

        response_data = response.json()
        
        print(f"📥 Status: {response.status_code}")
        print(f"📥 Response: {response_data}")
        
        if response.status_code == 200 and response_data.get('success'):
            return jsonify({
                'success': True,
                'uploadURL': response_data['result']['uploadURL'],
                'uid': response_data['result']['uid']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': response_data.get('errors', [{'message': 'Erro desconhecido'}])
            }), response.status_code
            
    except Exception as e:
        print(f"❌ Erro ao obter URL de upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
