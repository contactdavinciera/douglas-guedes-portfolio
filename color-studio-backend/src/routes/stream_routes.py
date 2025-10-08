from flask import Blueprint, jsonify, request
import requests
import os

stream_bp = Blueprint('stream', __name__)

CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')

@stream_bp.route('/api/stream/upload-url', methods=['POST'])
def get_stream_upload_url():
    """
    Obtém URL de upload do Cloudflare Stream
    """
    try:
        # Validar credenciais
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            return jsonify({
                'success': False,
                'error': 'Credenciais do Cloudflare não configuradas'
            }), 500
        
        # Fazer requisição ao Cloudflare Stream
        url = f'https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload'
        
        headers = {
            'Authorization': f'Bearer {CLOUDFLARE_API_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'maxDurationSeconds': 3600,
            'requireSignedURLs': False
        }
        
        response = requests.post(url, headers=headers, json=data)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('success'):
            return jsonify({
                'success': True,
                'result': {
                    'uploadURL': response_data['result']['uploadURL'],
                    'uid': response_data['result']['uid']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': response_data
            }), response.status_code
            
    except Exception as e:
        print(f"Erro ao obter URL de upload: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
