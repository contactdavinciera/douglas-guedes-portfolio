import os
import sys
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

# Inicializar SQLAlchemy (instância não vinculada a app ainda)
db = SQLAlchemy()

def create_app():
    """Cria e configura uma instância do aplicativo Flask."""
    # Paths absolutos
    here = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.abspath(os.path.join(here, ".."))

    # Adicionar root do projeto ao sys.path para importações absolutas (se necessário)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Inicializar app
    static_folder = os.path.join(here, 'static')
    app = Flask(__name__, static_folder=static_folder)

    # Configuração do Aplicativo
    secret = os.getenv('SECRET_KEY')
    if not secret and os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError("SECRET_KEY não definido em produção")
    app.config['SECRET_KEY'] = secret or 'dev-secret-key'
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024  # atenção: 5GB

    # DB
    db_dir = os.path.join(here, 'database')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.abspath(db_path)}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicialização das extensões
    db.init_app(app)

    # Importar modelos e blueprints agora que db existe e sys.path está ok
    # Import aqui reduz chances de circular import
    from src.models.user import User
    from src.models.project import Project
    from src.models.media_file import MediaFile

    from src.routes.user import user_bp
    from src.routes.color_studio import color_studio_bp
    from src.routes.upload_routes import upload_bp
    from src.routes.pricing_routes import pricing_bp
    from src.routes.colorist_routes import colorist_bp
    from src.routes.conversion_routes import conversion_bp

    # Configurar CORS (use regex para resources)
    cors_origins = [
        "https://douglas-guedes-portfolio.onrender.com",
        "https://douglas-guedes-portfolio.pages.dev",
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    CORS(app,
         resources={r"^/api/.*$": {
             "origins": cors_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
             "allow_headers": ["Content-Type", "Authorization", "Upload-Offset", "Upload-Length", "Tus-Resumable"],
             "expose_headers": ["Content-Length", "Content-Type", "Upload-Offset", "Upload-Length", "Tus-Resumable", "Location"]
         }},
         supports_credentials=True)

    # Registrar blueprints
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(color_studio_bp, url_prefix='/api/color-studio')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(pricing_bp, url_prefix='/api/pricing')
    app.register_blueprint(colorist_bp, url_prefix='/api/colorist')
    app.register_blueprint(conversion_bp, url_prefix='/api/conversion')

    # Criar tabelas (apenas como fallback; prefira migrations)
    with app.app_context():
        db.create_all()

    # Servir SPA / arquivos estáticos
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        full_path = os.path.join(app.static_folder, path)
        if path and os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app

app = create_app()

if __name__ == '__main__':
    debug_env = os.getenv('FLASK_DEBUG', '0').lower()
    debug = debug_env in ('1', 'true', 'yes')
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=debug)

