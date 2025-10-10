from src.models.user import db
from datetime import datetime

class MediaFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # 'raw', 'stream', 'proxy'
    storage_location = db.Column(db.String(50), nullable=False)  # 'r2', 'cloudflare_stream'
    storage_key = db.Column(db.String(255), nullable=False)  # R2 key or Cloudflare Stream UID
    original_url = db.Column(db.String(500), nullable=True) # URL para download (presigned ou Cloudflare Stream)
    metadata = db.Column(db.JSON, nullable=True)  # Metadados do arquivo (resolução, codec, etc.)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    project = db.relationship("Project", backref=db.backref("media_files", lazy=True))

    def __repr__(self):
        return f"<MediaFile {self.filename} ({self.file_type})>"

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "filename": self.filename,
            "file_type": self.file_type,
            "storage_location": self.storage_location,
            "storage_key": self.storage_key,
            "original_url": self.original_url,
            "metadata": self.metadata,
            "uploaded_at": self.uploaded_at.isoformat()
        }
