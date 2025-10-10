
import os
import sys
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Carregar variáveis de ambiente do .env
load_dotenv()

# Adicionar o diretório raiz do projeto ao sys.path para importações absolutas
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Inicializar SQLAlchemy aqui para evitar importações circulares
db = SQLAlchemy()

# Importar os modelos para que o SQLAlchemy possa encontrá-los e usar a instância `db`
from src.models.user import User
from src.models.project import Project
from src.models.media_file import MediaFile

# Importar os blueprints
from src.routes.user import user_bp
from src.routes.color_studio import color_studio_bp
from src.routes.upload_routes import upload_bp
from src.routes.pricing_routes import pricing_bp
from src.routes.colorist_routes import colorist_bp
from src.routes.conversion_routes import conversion_bp

def create_app():
    """Cria e configura uma instância do aplicativo Flask."""
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

    # --- Configuração do Aplicativo ---
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024  # 5GB
    
    # Configuração do Banco de Dados
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Inicialização das Extensões ---
    db.init_app(app)

    # --- Configuração do CORS ---
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # --- Tratamento de requisições OPTIONS (Preflight) ---
    @app.before_request
    def handle_options_requests():
        if request.method == 'OPTIONS':
            response = app.make_response('')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization, Upload-Offset, Upload-Length, Tus-Resumable")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD")
            response.headers.add("Access-Control-Expose-Headers", "Upload-Offset, Upload-Length, Tus-Resumable, Location")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

    # --- Registro dos Blueprints ---
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(color_studio_bp, url_prefix='/api/color-studio')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(pricing_bp, url_prefix='/api/pricing')
    app.register_blueprint(colorist_bp, url_prefix='/api/colorist')
    app.register_blueprint(conversion_bp, url_prefix='/api/conversion')

    # --- Criação do Banco de Dados ---
    with app.app_context():
        # Garante que todos os modelos sejam importados antes de criar as tabelas
        db.create_all()

    # --- Rota para servir o frontend ---
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder = app.static_folder
        if path != "" and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        else:
            return send_from_directory(static_folder, 'index.html')

    return app

app = create_app()

if __name__ == '__main__':
    # O modo debug é ativado pela variável de ambiente FLASK_DEBUG=1
    app.run(host='0.0.0.0', port=5001, debug=os.getenv('FLASK_DEBUG') == '1')

