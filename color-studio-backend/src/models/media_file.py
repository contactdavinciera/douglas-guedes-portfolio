from src.models import db
from datetime import datetime

class MediaFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # 'raw', 'stream', 'proxy'
    storage_location = db.Column(db.String(50), nullable=False)  # 'r2', 'cloudflare_stream'
    storage_key = db.Column(db.String(255), nullable=False)  # R2 key or Cloudflare Stream UID
    # file_key is now storage_key for R2 files, removed for clarity
    original_url = db.Column(db.String(500), nullable=True) # URL para download (presigned ou Cloudflare Stream)
    file_metadata = db.Column(db.JSON, nullable=True)  # Renamed from metadata
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    proxy_file_key = db.Column(db.String(255), nullable=True)
    proxy_stream_url = db.Column(db.String(500), nullable=True)
    converted_file_key = db.Column(db.String(255), nullable=True)
    stream_url = db.Column(db.String(500), nullable=True)
    conversion_status = db.Column(db.String(50), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
            "file_key": self.file_key,
            "original_url": self.original_url,
            "metadata": self.file_metadata,
            "uploaded_at": self.uploaded_at.isoformat(),
            "proxy_file_key": self.proxy_file_key,
            "proxy_stream_url": self.proxy_stream_url,
            "converted_file_key": self.converted_file_key,
            "stream_url": self.stream_url,
            "conversion_status": self.conversion_status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

