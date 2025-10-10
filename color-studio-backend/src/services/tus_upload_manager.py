import os
import hashlib
import json
from typing import Dict, Optional
from datetime import datetime, timedelta

class TUSUploadManager:
    """Gerenciador de uploads TUS (Tus Resumable Upload Protocol)"""
    
    def __init__(self, upload_dir: str = "uploads/temp"):
        self.upload_dir = upload_dir
        self.metadata_dir = os.path.join(upload_dir, "metadata")
        
        # Criar diretórios se não existirem
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.metadata_dir, exist_ok=True)
    
    def create_upload(self, file_size: int, filename: str, metadata: Dict = None) -> str:
        """
        Cria um novo upload e retorna o upload_id
        """
        upload_id = self._generate_upload_id(filename, file_size)
        
        upload_metadata = {
            'upload_id': upload_id,
            'filename': filename,
            'file_size': file_size,
            'bytes_uploaded': 0,
            'created_at': datetime.utcnow().isoformat(),
            'last_modified': datetime.utcnow().isoformat(),
            'metadata': metadata or {},
            'status': 'created'
        }
        
        # Salvar metadata
        self._save_metadata(upload_id, upload_metadata)
        
        # Criar arquivo vazio
        upload_path = self._get_upload_path(upload_id)
        with open(upload_path, 'wb') as f:
            f.seek(file_size - 1)
            f.write(b'\0')
        
        return upload_id
    
    def upload_chunk(self, upload_id: str, offset: int, chunk_data: bytes) -> Dict:
        """
        Faz upload de um chunk de dados
        """
        metadata = self._load_metadata(upload_id)
        if not metadata:
            raise ValueError(f"Upload {upload_id} não encontrado")
        
        upload_path = self._get_upload_path(upload_id)
        
        # Verificar se o offset está correto
        if offset != metadata['bytes_uploaded']:
            raise ValueError(f"Offset incorreto. Esperado: {metadata['bytes_uploaded']}, Recebido: {offset}")
        
        # Escrever chunk
        with open(upload_path, 'r+b') as f:
            f.seek(offset)
            f.write(chunk_data)
        
        # Atualizar metadata
        metadata['bytes_uploaded'] = offset + len(chunk_data)
        metadata['last_modified'] = datetime.utcnow().isoformat()
        
        # Verificar se upload está completo
        if metadata['bytes_uploaded'] >= metadata['file_size']:
            metadata['status'] = 'completed'
            metadata['completed_at'] = datetime.utcnow().isoformat()
        
        self._save_metadata(upload_id, metadata)
        
        return {
            'upload_id': upload_id,
            'bytes_uploaded': metadata['bytes_uploaded'],
            'file_size': metadata['file_size'],
            'progress': (metadata['bytes_uploaded'] / metadata['file_size']) * 100,
            'status': metadata['status']
        }
    
    def get_upload_status(self, upload_id: str) -> Optional[Dict]:
        """
        Retorna o status de um upload
        """
        metadata = self._load_metadata(upload_id)
        if not metadata:
            return None
        
        return {
            'upload_id': upload_id,
            'filename': metadata['filename'],
            'file_size': metadata['file_size'],
            'bytes_uploaded': metadata['bytes_uploaded'],
            'progress': (metadata['bytes_uploaded'] / metadata['file_size']) * 100,
            'status': metadata['status'],
            'created_at': metadata['created_at'],
            'last_modified': metadata['last_modified']
        }
    
    def finalize_upload(self, upload_id: str, final_destination: str) -> Dict:
        """
        Finaliza o upload movendo o arquivo para o destino final
        """
        metadata = self._load_metadata(upload_id)
        if not metadata:
            raise ValueError(f"Upload {upload_id} não encontrado")
        
        if metadata['status'] != 'completed':
            raise ValueError(f"Upload {upload_id} não está completo")
        
        upload_path = self._get_upload_path(upload_id)
        
        # Criar diretório de destino se não existir
        os.makedirs(os.path.dirname(final_destination), exist_ok=True)
        
        # Mover arquivo
        os.rename(upload_path, final_destination)
        
        # Atualizar metadata
        metadata['final_path'] = final_destination
        metadata['status'] = 'finalized'
        metadata['finalized_at'] = datetime.utcnow().isoformat()
        
        self._save_metadata(upload_id, metadata)
        
        return {
            'upload_id': upload_id,
            'final_path': final_destination,
            'file_size': metadata['file_size'],
            'status': metadata['status']
        }
    
    def cleanup_expired_uploads(self, max_age_hours: int = 24):
        """
        Remove uploads expirados
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        for filename in os.listdir(self.metadata_dir):
            if filename.endswith('.json'):
                upload_id = filename[:-5]  # Remove .json
                metadata = self._load_metadata(upload_id)
                
                if metadata:
                    last_modified = datetime.fromisoformat(metadata['last_modified'])
                    if last_modified < cutoff_time and metadata['status'] != 'finalized':
                        self._cleanup_upload(upload_id)
    
    def _generate_upload_id(self, filename: str, file_size: int) -> str:
        """Gera um ID único para o upload"""
        data = f"{filename}_{file_size}_{datetime.utcnow().isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _get_upload_path(self, upload_id: str) -> str:
        """Retorna o caminho do arquivo de upload"""
        return os.path.join(self.upload_dir, f"{upload_id}.tmp")
    
    def _get_metadata_path(self, upload_id: str) -> str:
        """Retorna o caminho do arquivo de metadata"""
        return os.path.join(self.metadata_dir, f"{upload_id}.json")
    
    def _save_metadata(self, upload_id: str, metadata: Dict):
        """Salva metadata do upload"""
        metadata_path = self._get_metadata_path(upload_id)
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _load_metadata(self, upload_id: str) -> Optional[Dict]:
        """Carrega metadata do upload"""
        metadata_path = self._get_metadata_path(upload_id)
        if not os.path.exists(metadata_path):
            return None
        
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except:
            return None
    
    def _cleanup_upload(self, upload_id: str):
        """Remove arquivos de um upload"""
        upload_path = self._get_upload_path(upload_id)
        metadata_path = self._get_metadata_path(upload_id)
        
        # Remover arquivo de upload
        if os.path.exists(upload_path):
            os.remove(upload_path)
        
        # Remover metadata
        if os.path.exists(metadata_path):
            os.remove(metadata_path)

