from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    client_email = db.Column(db.String(255), nullable=False)
    
    # Informações do arquivo
    original_filename = db.Column(db.String(255), nullable=False)
    file_format = db.Column(db.String(50), nullable=False)
    color_space = db.Column(db.String(100), nullable=False)
    resolution = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Float, nullable=False)  # em segundos
    file_size = db.Column(db.BigInteger, nullable=False)  # em bytes
    
    # Configurações de color grading
    selected_lut = db.Column(db.String(100), nullable=True)
    processing_mode = db.Column(db.String(50), default='auto')  # 'auto' ou 'advanced'
    output_format = db.Column(db.String(50), default='rec709')  # 'rec709', 'hdr10', 'p3'
    
    # Preços e status
    estimated_price = db.Column(db.Float, nullable=False)
    final_price = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), default='uploaded')  # 'uploaded', 'processing', 'completed', 'delivered'
    
    # Metadados adicionais
    extra_metadata = db.Column(db.Text, nullable=True)  # JSON string para metadados extras
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f'<Project {self.name} - {self.status}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'client_email': self.client_email,
            'original_filename': self.original_filename,
            'file_format': self.file_format,
            'color_space': self.color_space,
            'resolution': self.resolution,
            'duration': self.duration,
            'file_size': self.file_size,
            'selected_lut': self.selected_lut,
            'processing_mode': self.processing_mode,
            'output_format': self.output_format,
            'estimated_price': self.estimated_price,
            'final_price': self.final_price,
            'status': self.status,
            'metadata': json.loads(self.extra_metadata) if self.extra_metadata else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def set_metadata(self, metadata_dict):
        """Converte um dicionário em JSON string para armazenar metadados"""
        self.extra_metadata = json.dumps(metadata_dict)
    
    def get_metadata(self):
        """Retorna os metadados como dicionário"""
        return json.loads(self.extra_metadata) if self.extra_metadata else {}
