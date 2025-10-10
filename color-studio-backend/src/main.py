import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from src.models.user import db
from src.models.project import Project
from src.routes.user import user_bp
from src.routes.color_studio import color_studio_bp
from src.routes.upload_routes import upload_bp
from src.routes.pricing_routes import pricing_bp
from src.routes.colorist_routes import colorist_bp

from flask_cors import CORS

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://douglas-guedes-portfolio.pages.dev",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "Upload-Offset", "Upload-Length"]
    }
})
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.register_blueprint(user_bp, url_prefix=\"/api\")
app.register_blueprint(color_studio_bp, url_prefix=\"/api/color-studio\")
app.register_blueprint(upload_bp, url_prefix=\"/api/upload\")
app.register_blueprint(pricing_bp, url_prefix=\"/api/pricing\")
app.register_blueprint(colorist_bp, url_prefix=\"/api/colorist\")
# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
