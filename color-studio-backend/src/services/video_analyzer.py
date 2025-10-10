import subprocess
import json
import os
from typing import Dict, Optional

class VideoAnalyzer:
    """Analisa vídeos para extrair metadados técnicos"""
    
    # Mapeamento de color spaces detectados
    COLOR_SPACE_MAP = {
        'bt709': 'Rec.709',
        'bt2020': 'Rec.2020',
        'smpte170m': 'Rec.601',
        'bt2020nc': 'Rec.2020',
        'smpte2084': 'PQ (HDR10)',
        'arib-std-b67': 'HLG',
    }
    
    GAMMA_MAP = {
        'bt709': 'Gamma 2.4',
        'smpte2084': 'PQ',
        'arib-std-b67': 'HLG',
        'linear': 'Linear',
    }
    
    @staticmethod
    def analyze_video(file_path: str) -> Dict:
        """
        Analisa um arquivo de vídeo e retorna metadados completos
        """
        try:
            # Comando ffprobe para extrair informações
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                file_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            data = json.loads(result.stdout)
            
            # Extrair stream de vídeo
            video_stream = next(
                (s for s in data.get('streams', []) if s['codec_type'] == 'video'),
                None
            )
            
            # Extrair stream de áudio
            audio_stream = next(
                (s for s in data.get('streams', []) if s['codec_type'] == 'audio'),
                None
            )
            
            if not video_stream:
                raise ValueError("Nenhum stream de vídeo encontrado")
            
            # Detectar color space e gamma
            color_space = VideoAnalyzer._detect_color_space(video_stream)
            gamma = VideoAnalyzer._detect_gamma(video_stream)
            
            # Detectar se é HDR
            is_hdr = VideoAnalyzer._is_hdr(video_stream)
            
            # Calcular duração
            duration = float(data.get('format', {}).get('duration', 0))
            
            # Tamanho do arquivo
            file_size = int(data.get('format', {}).get('size', 0))
            
            return {
                'codec': video_stream.get('codec_name', 'unknown').upper(),
                'color_space': color_space,
                'gamma': gamma,
                'is_hdr': is_hdr,
                'resolution': f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}",
                'width': video_stream.get('width', 0),
                'height': video_stream.get('height', 0),
                'fps': VideoAnalyzer._get_fps(video_stream),
                'duration': duration,
                'file_size': file_size,
                'bit_depth': video_stream.get('bits_per_raw_sample', 8),
                'has_audio': audio_stream is not None,
                'audio_codec': audio_stream.get('codec_name', None) if audio_stream else None,
                'format': data.get('format', {}).get('format_name', 'unknown'),
                'bitrate': int(data.get('format', {}).get('bit_rate', 0)),
            }
            
        except Exception as e:
            raise Exception(f"Erro ao analisar vídeo: {str(e)}")
    
    @staticmethod
    def _detect_color_space(stream: Dict) -> str:
        """Detecta o color space do vídeo"""
        color_space = stream.get('color_space', '').lower()
        color_primaries = stream.get('color_primaries', '').lower()
        
        # Tentar pelo color_space primeiro
        if color_space in VideoAnalyzer.COLOR_SPACE_MAP:
            return VideoAnalyzer.COLOR_SPACE_MAP[color_space]
        
        # Tentar por color_primaries
        if color_primaries in VideoAnalyzer.COLOR_SPACE_MAP:
            return VideoAnalyzer.COLOR_SPACE_MAP[color_primaries]
        
        # Detectar por codec
        codec = stream.get('codec_name', '').lower()
        if 'prores' in codec:
            profile = stream.get('profile', '').lower()
            if '4444' in profile or 'xq' in profile:
                return 'Rec.709'  # ProRes geralmente é Rec.709
        
        return 'Rec.709'  # Default
    
    @staticmethod
    def _detect_gamma(stream: Dict) -> str:
        """Detecta a curva gamma do vídeo"""
        color_transfer = stream.get('color_transfer', '').lower()
        
        if color_transfer in VideoAnalyzer.GAMMA_MAP:
            return VideoAnalyzer.GAMMA_MAP[color_transfer]
        
        # Se for HDR, provavelmente é PQ
        if VideoAnalyzer._is_hdr(stream):
            return 'PQ'
        
        return 'Gamma 2.4'  # Default para SDR
    
    @staticmethod
    def _is_hdr(stream: Dict) -> bool:
        """Verifica se o vídeo é HDR"""
        color_transfer = stream.get('color_transfer', '').lower()
        color_space = stream.get('color_space', '').lower()
        
        hdr_indicators = ['smpte2084', 'arib-std-b67', 'bt2020']
        
        return any(indicator in color_transfer or indicator in color_space 
                   for indicator in hdr_indicators)
    
    @staticmethod
    def _get_fps(stream: Dict) -> float:
        """Calcula o FPS do vídeo"""
        fps_str = stream.get('r_frame_rate', '0/1')
        try:
            num, den = map(int, fps_str.split('/'))
            return round(num / den, 2) if den != 0 else 0
        except:
            return 0
    
    @staticmethod
    def get_compatible_luts(color_space: str, gamma: str, project_type: str) -> list:
        """
        Retorna lista de LUTs compatíveis com o color space e gamma detectados
        """
        from .lut_manager import LUTManager
        return LUTManager.get_compatible_luts(color_space, gamma, project_type)
