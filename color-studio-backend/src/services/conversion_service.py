import os
import subprocess
import mimetypes
import uuid
import json
from src.services.r2_upload_service import R2UploadService
from src.models.media_file import MediaFile
from src.models.project import db
from datetime import datetime

class ConversionService:
    def __init__(self):
        self.r2_service = R2UploadService()

    def create_proxy(self, media_file_id: int, project_id: int, original_file_key: str, output_format: str = "mp4"):
        media_file = MediaFile.query.get(media_file_id)
        if not media_file:
            return {"success": False, "error": "MediaFile not found"}

        # 1. Baixar o arquivo original do R2
        download_url_response = self.r2_service.generate_presigned_url(original_file_key)
        if not download_url_response["success"]:
            return {"success": False, "error": f"Failed to get presigned URL: {download_url_response['error']}"}
        download_url = download_url_response["url"]

        # Criar diretório temporário para download e conversão
        temp_dir = f"/tmp/conversion_{media_file_id}"
        os.makedirs(temp_dir, exist_ok=True)
        original_path = os.path.join(temp_dir, f"original_{media_file_id}.{media_file.get_file_extension(original_file_key)}")

        try:
            # Baixar o arquivo
            if self.r2_service.is_test_mode():
                print(f"🧪 [TEST MODE] Simulando download de {download_url} para {original_path}")
                with open(original_path, "w") as f:
                    f.write("dummy video content") # Criar um arquivo dummy
            else:
                subprocess.run(["wget", "-O", original_path, download_url], check=True)

            # 2. Converter para proxy (ex: MP4 H.264)
            proxy_filename = f"proxy_{media_file_id}.{output_format}"
            proxy_path = os.path.join(temp_dir, proxy_filename)

            # Exemplo de comando FFmpeg para proxy de baixa resolução
            # Adapte conforme a necessidade (resolução, bitrate, codec)
            ffmpeg_command = [
                "ffmpeg",
                "-i", original_path,
                "-vf", "scale=1280:-1",  # Reduzir para 1280 de largura, altura automática
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "28",
                "-c:a", "aac",
                "-b:a", "128k",
                "-y", # Sobrescrever se existir
                proxy_path
            ]
            subprocess.run(ffmpeg_command, check=True)

            # 3. Fazer upload do proxy para o Cloudflare Stream
            # (Aqui você precisaria de um serviço de upload para o Cloudflare Stream)
            # Por simplicidade, vamos simular o upload e gerar uma URL de stream fictícia
            stream_uid = f"cf_stream_uid_{uuid.uuid4()}"
            stream_url = f"https://customer-stream.cloudflarestream.com/{stream_uid}/manifest/video.m3u8"

            # 4. Atualizar MediaFile com o proxy
            media_file.proxy_file_key = proxy_filename  # Adicionar este campo ao modelo MediaFile
            media_file.proxy_stream_url = stream_url    # Adicionar este campo ao modelo MediaFile
            media_file.updated_at = datetime.utcnow() # Adicionar este campo ao modelo MediaFile
            db.session.commit()

            return {"success": True, "proxy_url": stream_url, "proxy_key": proxy_filename}

        except subprocess.CalledProcessError as e:
            return {"success": False, "error": f"FFmpeg/Wget error: {e.stderr.decode()}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            # Limpar arquivos temporários
            if os.path.exists(temp_dir):
                subprocess.run(["rm", "-rf", temp_dir])

    def get_proxy_status(self, media_file_id: int):
        media_file = MediaFile.query.get(media_file_id)
        if not media_file:
            return {"success": False, "error": "MediaFile not found"}

        if media_file.proxy_stream_url:
            return {"success": True, "status": "completed", "proxy_url": media_file.proxy_stream_url}
        else:
            return {"success": True, "status": "pending"}

    def get_media_metadata(self, file_key: str):
        """
        Extrai metadados de um arquivo (do R2 ou localmente após download)
        """
        # Implementar lógica para baixar do R2 e usar ffprobe
        # Por enquanto, um mock
        return {
            "codec": "H264",
            "resolution": "1920x1080",
            "duration": 120.5,
            "bitrate": "10Mbps"
        }

    def start_h265_conversion(self, media_file_id: int, output_format: str = "h265", quality: str = "high"):
        """Iniciar conversão de arquivo RAW para H.265"""
        media_file = MediaFile.query.get(media_file_id)
        if not media_file:
            return {"success": False, "error": "MediaFile not found"}

        # Gerar ID único para a conversão
        conversion_id = str(uuid.uuid4())
        
        # Criar diretório temporário para conversão
        temp_dir = f"/tmp/h265_conversion_{conversion_id}"
        os.makedirs(temp_dir, exist_ok=True)
        
        original_path = None
        output_path = None

        try:
            # 1. Baixar o arquivo original do R2
            download_url_response = self.r2_service.generate_presigned_url(media_file.storage_key)

            if not download_url_response["success"]:
                return {"success": False, "error": f"Failed to get presigned URL: {download_url_response['error']}"}
            
            download_url = download_url_response["url"]
            original_path = os.path.join(temp_dir, f"original_{media_file_id}.{self._get_file_extension(media_file.filename)}")
            
            # Baixar o arquivo
            if self.r2_service.is_test_mode():
                print(f"🧪 [TEST MODE] Simulando download de {download_url} para {original_path}")
                with open(original_path, "w") as f:
                    f.write("dummy video content") # Criar um arquivo dummy
            else:
                subprocess.run(["wget", "-O", original_path, download_url], check=True)
            
            # 2. Configurar parâmetros de conversão H.265
            output_filename = f"h265_{media_file_id}_{conversion_id}.mp4"
            output_path = os.path.join(temp_dir, output_filename)
            
            # Definir qualidade baseada no parâmetro
            quality_settings = {
                "low": {"crf": "32", "preset": "fast"},
                "medium": {"crf": "28", "preset": "medium"},
                "high": {"crf": "23", "preset": "slow"},
                "ultra": {"crf": "18", "preset": "veryslow"}
            }
            
            settings = quality_settings.get(quality, quality_settings["high"])
            
            # 3. Comando FFmpeg para conversão H.265
            ffmpeg_command = [
                "ffmpeg",
                "-i", original_path,
                "-c:v", "libx265",
                "-preset", settings["preset"],
                "-crf", settings["crf"],
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",  # Otimização para streaming
                "-y",  # Sobrescrever se existir
                output_path
            ]
            
            # Executar conversão em background (simulado)
            # Em produção, isso deveria ser executado em uma fila de tarefas (Celery, RQ, etc.)
            if self.r2_service.is_test_mode():
                print(f"🧪 [TEST MODE] Simulando conversão FFmpeg para {output_path}")
                with open(output_path, "w") as f:
                    f.write("dummy converted video content") # Criar um arquivo dummy
            else:
                subprocess.run(ffmpeg_command, check=True)

            
            # 4. Upload do arquivo convertido para Cloudflare Stream
            # Simular upload para Cloudflare Stream
            stream_uid = f"h265_{conversion_id}"
            stream_url = f"https://customer-5dr3ublgoe3wg2wj.cloudflarestream.com/{stream_uid}/manifest/video.m3u8"
            
            # 5. Atualizar MediaFile com informações da conversão
            media_file.converted_file_key = output_filename
            media_file.stream_url = stream_url
            media_file.conversion_status = "completed"
            media_file.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Salvar status da conversão em arquivo temporário (em produção, usar Redis ou banco)
            status_file = f"/tmp/conversion_status_{conversion_id}.json"
            with open(status_file, 'w') as f:
                json.dump({
                    "conversion_id": conversion_id,
                    "status": "completed",
                    "media_file_id": media_file_id,
                    "output_url": stream_url,
                    "created_at": datetime.utcnow().isoformat()
                }, f)
            
            return {
                "success": True, 
                "conversion_id": conversion_id,
                "status": "completed",
                "stream_url": stream_url
            }
            
        except subprocess.CalledProcessError as e:
            # Salvar status de erro
            status_file = f"/tmp/conversion_status_{conversion_id}.json"
            with open(status_file, 'w') as f:
                json.dump({
                    "conversion_id": conversion_id,
                    "status": "failed",
                    "error": str(e),
                    "created_at": datetime.utcnow().isoformat()
                }, f)
            
            return {"success": False, "error": f"Conversion failed: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            # Limpar arquivos temporários (manter apenas o status)
            if original_path and os.path.exists(original_path):
                os.remove(original_path)
            if output_path and os.path.exists(output_path):
                os.remove(output_path)
            if os.path.exists(temp_dir):
                subprocess.run(["rm", "-rf", temp_dir])

    def get_conversion_status(self, conversion_id: str):
        """Obter status da conversão"""
        status_file = f"/tmp/conversion_status_{conversion_id}.json"
        
        if not os.path.exists(status_file):
            return {"success": False, "error": "Conversion not found"}
        
        try:
            with open(status_file, 'r') as f:
                status_data = json.load(f)
            
            return {"success": True, **status_data}
        except Exception as e:
            return {"success": False, "error": f"Failed to read conversion status: {str(e)}"}

    def _get_file_extension(self, filename: str) -> str:
        """Extrair extensão do arquivo"""
        return filename.split('.')[-1].lower() if '.' in filename else 'unknown'

