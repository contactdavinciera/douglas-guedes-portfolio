"""
Backend principal do Douglas Guedes Portfolio
Versão corrigida com CORS funcionando para Color Studio
"""

import os
import sys
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

# Inicializar SQLAlchemy
db = SQLAlchemy()

def create_app():
    """Cria e configura uma instância do aplicativo Flask."""
    # Paths absolutos
    here = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.abspath(os.path.join(here, ".."))

    # Adicionar root ao sys.path
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Inicializar app
    static_folder = os.path.join(here, 'static')
    app = Flask(__name__, static_folder=static_folder)

    # ==========================================
    # CONFIGURAÇÃO DO APLICATIVO
    # ==========================================
    secret = os.getenv('SECRET_KEY')
    if not secret and os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError("SECRET_KEY não definido em produção")
    app.config['SECRET_KEY'] = secret or 'dev-secret-key'
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024  # 5GB

    # Database
    db_dir = os.path.join(here, 'database')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.abspath(db_path)}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicializar extensões
    db.init_app(app)

    # ==========================================
    # CONFIGURAÇÃO CORS - CRÍTICO!
    # ==========================================
    cors_origins = [
        "https://douglas-guedes-portfolio.onrender.com",
        "https://douglas-guedes-portfolio.pages.dev",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ]

    # CORS global para todas as rotas /api/*
    CORS(app,
         resources={
             r"/api/*": {
                 "origins": cors_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
                 "allow_headers": [
                     "Content-Type", 
                     "Authorization", 
                     "Upload-Offset", 
                     "Upload-Length", 
                     "Tus-Resumable",
                     "X-Requested-With"
                 ],
                 "expose_headers": [
                     "Content-Length", 
                     "Content-Type", 
                     "Upload-Offset", 
                     "Upload-Length", 
                     "Tus-Resumable", 
                     "Location",
                     "ETag"
                 ],
                 "supports_credentials": True,
                 "max_age": 3600
             }
         })

    # ==========================================
    # MIDDLEWARE CORS ADICIONAL (FALLBACK)
    # ==========================================
    @app.after_request
    def after_request(response):
        """Adiciona headers CORS manualmente como fallback"""
        origin = request.headers.get('Origin')
        
        # Permitir apenas origins conhecidas
        if origin in cors_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Upload-Offset, Upload-Length, Tus-Resumable, X-Requested-With'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Upload-Offset, Upload-Length, Tus-Resumable, Location, ETag'
            response.headers['Access-Control-Max-Age'] = '3600'
        
        return response

    # ==========================================
    # IMPORTAR MODELOS E BLUEPRINTS
    # ==========================================
    try:
        from src.models.user import User
        from src.models.project import Project
        from src.models.media_file import MediaFile
    except ImportError as e:
        print(f"⚠️ Warning: Could not import models: {e}")

    from src.routes.user import user_bp
    from src.routes.color_studio import color_studio_bp
    from src.routes.upload_routes import upload_bp
    from src.routes.pricing_routes import pricing_bp
    from src.routes.colorist_routes import colorist_bp
    from src.routes.conversion_routes import conversion_bp

    # ==========================================
    # REGISTRAR BLUEPRINTS
    # ==========================================
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(color_studio_bp, url_prefix='/api/color-studio')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(pricing_bp, url_prefix='/api/pricing')
    app.register_blueprint(colorist_bp, url_prefix='/api/colorist')
    app.register_blueprint(conversion_bp, url_prefix='/api/conversion')

    # ==========================================
    # CRIAR TABELAS
    # ==========================================
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"⚠️ Database creation warning: {e}")

    # ==========================================
    # HEALTH CHECK
    # ==========================================
    @app.route('/health', methods=['GET', 'HEAD'])
    def health_check():
        return {
            "status": "ok",
            "service": "Douglas Guedes Portfolio Backend",
            "version": "1.0.0"
        }, 200

    # ==========================================
    # SERVIR SPA / ARQUIVOS ESTÁTICOS
    # ==========================================
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        """Serve frontend SPA"""
        full_path = os.path.join(app.static_folder, path)
        if path and os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    print("=" * 60)
    print("🚀 Backend initialized successfully")
    print(f"📁 Static folder: {static_folder}")
    print(f"💾 Database: {db_path}")
    print(f"🌐 CORS enabled for: {', '.join(cors_origins)}")
    print("=" * 60)

    return app

# ==========================================
# CRIAR INSTÂNCIA DO APP
# ==========================================
app = create_app()

if __name__ == '__main__':
    debug_env = os.getenv('FLASK_DEBUG', '0').lower()
    debug = debug_env in ('1', 'true', 'yes')
    port = int(os.getenv('PORT', 5001))
    
    print(f"\n🔥 Starting server on port {port} (debug={debug})\n")
    app.run(host='0.0.0.0', port=port, debug=debug)

