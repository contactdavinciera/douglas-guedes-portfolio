import os
import subprocess
import mimetypes
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

