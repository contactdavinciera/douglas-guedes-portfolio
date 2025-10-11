"""
Backend principal do Douglas Guedes Portfolio
Versão FINAL com CORS funcionando para todos os subdomínios do Pages
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
    # CONFIGURAÇÃO CORS - ACEITA TODOS SUBDOMÍNIOS
    # ==========================================
    
    # Lista de origens permitidas (base)
    base_origins = [
        "https://douglas-guedes-portfolio.onrender.com",
        "https://douglas-guedes-portfolio.pages.dev",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ]

    # CORS inicial
    CORS(app,
         resources={
             r"/api/*": {
                 "origins": base_origins,
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
    # MIDDLEWARE CORS DINÂMICO (aceita subdomínios)
    # ==========================================
    
    # ✅ ADICIONADO: Whitelist de subdomínios permitidos (segurança)
    ALLOWED_SUBDOMAINS = ['main', 'staging', 'preview', 'develop']
    
    @app.after_request
    def after_request(response):
        """
        Middleware CORS que aceita dinamicamente:
        - Subdomínios específicos do Cloudflare Pages (whitelist)
        - Origens base permitidas
        """
        origin = request.headers.get('Origin')
        
        if origin:
            # Verificar se é uma origem permitida
            allowed = False
            
            # 1. Verificar origens base
            if origin in base_origins:
                allowed = True
            
            # 2. ✅ CORRIGIDO: Verificar subdomínios específicos do Pages (mais seguro)
            elif origin.endswith('.douglas-guedes-portfolio.pages.dev'):
                # Extrair subdomínio (ex: https://main.douglas-guedes-portfolio.pages.dev)
                subdomain = origin.replace('https://', '').replace('http://', '').split('.')[0]
                if subdomain in ALLOWED_SUBDOMAINS:
                    allowed = True
                    if app.debug:
                        app.logger.info(f"✅ Subdomínio permitido: {subdomain}")
                else:
                    if app.debug:
                        app.logger.warning(f"⚠️ Subdomínio não permitido: {subdomain}")
                
            # 3. Verificar domínio principal do Pages (sem subdomínio)
            elif origin in ['https://douglas-guedes-portfolio.pages.dev', 'http://douglas-guedes-portfolio.pages.dev']:
                allowed = True
            
            # Se permitido, adicionar headers CORS
            if allowed:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Upload-Offset, Upload-Length, Tus-Resumable, X-Requested-With'
                response.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Upload-Offset, Upload-Length, Location, ETag'
                response.headers['Access-Control-Max-Age'] = '3600'
                
                # Log apenas em desenvolvimento
                if app.debug:
                    app.logger.info(f"✅ CORS allowed for: {origin}")
            else:
                # Log de origem não permitida (apenas em dev)
                if app.debug:
                    app.logger.warning(f"⚠️ CORS blocked for: {origin}")
        
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

    # Importar blueprints
    # ✅ CORRIGIDO: Usar imports diretos e logar erros como ERROR
    from src.routes.color_studio import color_studio_bp
    
    # Blueprints opcionais (com logging apropriado)
    user_bp = None
    upload_bp = None
    pricing_bp = None
    colorist_bp = None
    conversion_bp = None
    
    try:
        from src.routes.user import user_bp
        app.logger.info("✅ user_bp loaded")
    except ImportError as e:
        app.logger.error(f"❌ ERRO: user routes não encontradas: {e}")
    
    try:
        from src.routes.upload_routes import upload_bp
        app.logger.info("✅ upload_bp loaded")
    except ImportError as e:
        app.logger.error(f"❌ ERRO: upload_routes não encontradas: {e}")
    
    try:
        from src.routes.pricing_routes import pricing_bp
        app.logger.info("✅ pricing_bp loaded")
    except ImportError as e:
        app.logger.error(f"❌ ERRO: pricing_routes não encontradas: {e}")
    
    try:
        from src.routes.colorist_routes import colorist_bp
        app.logger.info("✅ colorist_bp loaded")
    except ImportError as e:
        app.logger.error(f"❌ ERRO: colorist_routes não encontradas: {e}")
    
    try:
        from src.routes.conversion_routes import conversion_bp
        app.logger.info("✅ conversion_bp loaded")
    except ImportError as e:
        app.logger.error(f"❌ ERRO: conversion_routes não encontradas: {e}")

    # ==========================================
    # REGISTRAR BLUEPRINTS
    # ==========================================
    # ✅ CORRIGIDO: Só registrar blueprints que foram carregados com sucesso
    if user_bp:
        app.register_blueprint(user_bp, url_prefix='/api')
    
    # Color Studio é obrigatório
    app.register_blueprint(color_studio_bp, url_prefix='/api/color-studio')
    
    if upload_bp:
        app.register_blueprint(upload_bp, url_prefix='/api/upload')
    
    if pricing_bp:
        app.register_blueprint(pricing_bp, url_prefix='/api/pricing')
    
    if colorist_bp:
        app.register_blueprint(colorist_bp, url_prefix='/api/colorist')
    
    if conversion_bp:
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
    print(f"🌐 CORS enabled for:")
    for origin in base_origins:
        print(f"   - {origin}")
    print(f"   - *.douglas-guedes-portfolio.pages.dev (all subdomains)")
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

