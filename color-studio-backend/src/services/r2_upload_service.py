import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import mimetypes
import uuid
from datetime import datetime

class R2UploadService:
    """
    Serviço para upload de arquivos RAW no Cloudflare R2 (S3-compatible)
    """
    
    # Formatos RAW que vão para R2
    RAW_FORMATS = {
        'braw',      # Blackmagic RAW
        'r3d',       # RED RAW
        'ari',       # ARRIRAW
        'dng',       # Cinema DNG
        'crm',       # Canon RAW
        'mxf',       # MXF (pode conter RAW)
    }
    
    # Formatos de vídeo que vão para Stream
    STREAM_FORMATS = {
        'mp4', 'mov', 'mkv', 'avi', 'webm', 
        'flv', 'mpg', 'mpeg', '3gp', 'wmv'
    }
    
    def __init__(self):
        self.account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
        self.access_key_id = os.getenv('R2_ACCESS_KEY_ID')
        self.secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
        self.bucket_name = os.getenv('R2_BUCKET_NAME', 'color-studio-raw')
        
        # Verificar se estamos em modo de teste
        if self.access_key_id == 'test_access_key' or not all([self.account_id, self.access_key_id, self.secret_access_key]):
            print("⚠️ R2 Service em modo de teste - funcionalidades simuladas")
            self.test_mode = True
            self.s3_client = None
            self.endpoint_url = 'https://test.r2.cloudflarestorage.com'
            return
        
        self.test_mode = False
        
        # Endpoint R2
        self.endpoint_url = f'https://{self.account_id}.r2.cloudflarestorage.com'
        
        # Cliente S3 configurado para R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        print(f"✅ R2 Service initialized: {self.endpoint_url}/{self.bucket_name}")

    def is_test_mode(self):
        return self.test_mode
    
    @staticmethod
    def is_raw_format(filename):
        """Verifica se o arquivo é RAW"""
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in R2UploadService.RAW_FORMATS
    
    @staticmethod
    def is_stream_format(filename):
        """Verifica se o arquivo é compatível com Stream"""
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in R2UploadService.STREAM_FORMATS
    
    @staticmethod
    def get_file_extension(filename):
        """Retorna a extensão do arquivo"""
        return filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'raw'
    
    def create_multipart_upload(self, filename, metadata=None):
        """
        Inicia upload multipart no R2
        """
        # Modo de teste - simular resposta
        if self.test_mode:
            file_ext = self.get_file_extension(filename)
            key = f"raw/{uuid.uuid4()}.{file_ext}"
            upload_id = f"test_upload_{uuid.uuid4()}"
            
            print(f"🧪 [TEST MODE] Multipart upload simulado: {key} (UploadId: {upload_id})")
            
            return {
                'success': True,
                'upload_id': upload_id,
                'key': key,
                'bucket': self.bucket_name
            }
        
        try:
            # Gerar key único
            file_ext = self.get_file_extension(filename)
            key = f"raw/{uuid.uuid4()}.{file_ext}"
            
            # Detectar content type
            content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            
            # Metadata adicional
            extra_args = {
                'ContentType': content_type,
            }
            
            # Adicionar metadata customizado se fornecido
            if metadata:
                extra_args['Metadata'] = metadata
            
            # Iniciar multipart upload
            response = self.s3_client.create_multipart_upload(
                Bucket=self.bucket_name,
                Key=key,
                **extra_args
            )
            
            upload_id = response['UploadId']
            
            print(f"✅ Multipart upload iniciado: {key} (UploadId: {upload_id})")
            
            return {
                'success': True,
                'upload_id': upload_id,
                'key': key,
                'bucket': self.bucket_name
            }
            
        except ClientError as e:
            print(f"❌ Erro ao criar multipart upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao criar multipart upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_part(self, upload_id, key, part_number, data):
        """
        Faz upload de uma parte do arquivo
        """
        try:
            response = self.s3_client.upload_part(
                Bucket=self.bucket_name,
                Key=key,
                UploadId=upload_id,
                PartNumber=part_number,
                Body=data
            )
            
            etag = response['ETag']
            
            print(f"✅ Part {part_number} uploaded: {etag}")
            
            return {
                'success': True,
                'part_number': part_number,
                'etag': etag
            }
            
        except ClientError as e:
            print(f"❌ Erro ao fazer upload da parte {part_number}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao fazer upload da parte {part_number}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def complete_multipart_upload(self, upload_id, key, parts):
        """
        Finaliza o upload multipart
        parts = [{'PartNumber': 1, 'ETag': 'xxx'}, ...]
        """
        try:
            response = self.s3_client.complete_multipart_upload(
                Bucket=self.bucket_name,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )
            
            # URL público (R2 endpoint)
            public_url = f"{self.endpoint_url}/{self.bucket_name}/{key}"
            
            print(f"✅ Upload completo: {public_url}")
            
            return {
                'success': True,
                'url': public_url,
                'key': key,
                'location': response.get('Location')
            }
            
        except ClientError as e:
            print(f"❌ Erro ao completar upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao completar upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def abort_multipart_upload(self, upload_id, key):
        """
        Cancela um upload multipart
        """
        try:
            self.s3_client.abort_multipart_upload(
                Bucket=self.bucket_name,
                Key=key,
                UploadId=upload_id
            )
            
            print(f"✅ Upload cancelado: {key}")
            
            return {'success': True}
            
        except ClientError as e:
            print(f"❌ Erro ao cancelar upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao cancelar upload: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_presigned_url(self, key, expiration=86400):
        """
        Gera URL assinada para download (padrão: 24h)
        """
        # Modo de teste - simular URL
        if self.test_mode:
            url = f"https://test.r2.cloudflarestorage.com/{self.bucket_name}/{key}?test=true"
            print(f"🧪 [TEST MODE] Gerando URL presigned simulada para {key}")
            # Retornar uma URL dummy válida para simular o download
            return {"success": True, "url": f"https://test.r2.cloudflarestorage.com/{self.bucket_name}/{key}?test=true", 'expires_in': expiration}
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            
            print(f"✅ Presigned URL gerada: {key} (expira em {expiration}s)")
            
            return {
                'success': True,
                'url': url,
                'expires_in': expiration
            }
            
        except ClientError as e:
            print(f"❌ Erro ao gerar presigned URL: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao gerar presigned URL: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, key):
        """
        Deleta um arquivo do R2
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            print(f"✅ Arquivo deletado: {key}")
            
            return {'success': True}
            
        except ClientError as e:
            print(f"❌ Erro ao deletar arquivo: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao deletar arquivo: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_files(self, prefix='raw/', max_keys=1000):
        """
        Lista arquivos no bucket
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat(),
                        'etag': obj['ETag']
                    })
            
            print(f"✅ Listados {len(files)} arquivos")
            
            return {
                'success': True,
                'files': files,
                'count': len(files)
            }
            
        except ClientError as e:
            print(f"❌ Erro ao listar arquivos: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Erro inesperado ao listar arquivos: {e}")
            return {
                'success': False,
                'error': str(e)
            }

