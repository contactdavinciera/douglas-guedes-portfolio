from typing import Dict
import math

class AutomaticPricing:
    """Sistema de precificação automática baseado em parâmetros do vídeo"""
    
    # Preços base por minuto (em USD)
    BASE_RATES = {
        'SDR': 15.0,      # $15/min para SDR
        'HDR': 22.5,      # $22.5/min para HDR (+50%)
        'DolbyVision': 24.0  # $24/min para Dolby Vision (+60%)
    }
    
    # Multiplicadores por codec (complexidade de processamento)
    CODEC_MULTIPLIERS = {
        'BRAW': 1.3,      # RAW requer mais processamento
        'PRORES': 1.0,    # Baseline
        'H264': 0.8,      # Mais simples
        'H265': 0.9,
        'HEVC': 0.9,
        'DNX': 1.1,
        'CINEFORM': 1.2,
    }
    
    # Multiplicadores por resolução
    RESOLUTION_MULTIPLIERS = {
        '8K': 2.0,        # 7680x4320+
        '6K': 1.6,        # 6144x3160+
        '4K': 1.3,        # 3840x2160+
        '2K': 1.0,        # 1920x1080+
        'HD': 0.8,        # 1280x720+
        'SD': 0.6,        # Abaixo de 1280x720
    }
    
    # Descontos por volume (número de clips)
    VOLUME_DISCOUNTS = [
        (1, 0),           # 1 clip: sem desconto
        (5, 0.05),        # 5+ clips: 5% desconto
        (10, 0.10),       # 10+ clips: 10% desconto
        (20, 0.15),       # 20+ clips: 15% desconto
        (50, 0.20),       # 50+ clips: 20% desconto
    ]
    
    @staticmethod
    def calculate_price(
        duration_seconds: float,
        codec: str,
        resolution: str,
        project_type: str = 'SDR',
        num_clips: int = 1,
        is_rush: bool = False
    ) -> Dict:
        """
        Calcula o preço de um projeto
        
        Returns:
            Dict com breakdown detalhado do preço
        """
        # Converter duração para minutos
        duration_minutes = duration_seconds / 60.0
        
        # Preço base
        base_rate = AutomaticPricing.BASE_RATES.get(project_type, AutomaticPricing.BASE_RATES['SDR'])
        base_price = duration_minutes * base_rate
        
        # Aplicar multiplicador de codec
        codec_upper = codec.upper()
        codec_multiplier = AutomaticPricing.CODEC_MULTIPLIERS.get(
            codec_upper,
            1.0  # Default se codec não reconhecido
        )
        
        # Aplicar multiplicador de resolução
        resolution_category = AutomaticPricing._categorize_resolution(resolution)
        resolution_multiplier = AutomaticPricing.RESOLUTION_MULTIPLIERS.get(
            resolution_category,
            1.0
        )
        
        # Calcular preço antes de descontos
        price_before_discount = base_price * codec_multiplier * resolution_multiplier
        
        # Aplicar desconto por volume
        volume_discount_rate = AutomaticPricing._get_volume_discount(num_clips)
        volume_discount_amount = price_before_discount * volume_discount_rate
        
        # Preço após desconto
        price_after_discount = price_before_discount - volume_discount_amount
        
        # Taxa de urgência (rush)
        rush_fee = 0
        if is_rush:
            rush_fee = price_after_discount * 0.5  # +50% para rush
        
        # Preço final
        final_price = price_after_discount + rush_fee
        
        return {
            'base_price': round(base_price, 2),
            'codec_multiplier': codec_multiplier,
            'resolution_multiplier': resolution_multiplier,
            'price_before_discount': round(price_before_discount, 2),
            'volume_discount_rate': volume_discount_rate,
            'volume_discount_amount': round(volume_discount_amount, 2),
            'price_after_discount': round(price_after_discount, 2),
            'rush_fee': round(rush_fee, 2),
            'final_price': round(final_price, 2),
            'breakdown': {
                'duration_minutes': round(duration_minutes, 2),
                'base_rate_per_minute': base_rate,
                'project_type': project_type,
                'codec': codec_upper,
                'resolution_category': resolution_category,
                'num_clips': num_clips,
                'is_rush': is_rush
            }
        }
    
    @staticmethod
    def calculate_batch_price(clips: list) -> Dict:
        """
        Calcula preço para múltiplos clips com desconto por volume
        """
        total_duration = sum(clip.get('duration', 0) for clip in clips)
        num_clips = len(clips)
        
        # Usar parâmetros do primeiro clip como referência
        # (assumindo que todos são do mesmo projeto)
        first_clip = clips[0] if clips else {}
        
        return AutomaticPricing.calculate_price(
            duration_seconds=total_duration,
            codec=first_clip.get('codec', 'PRORES'),
            resolution=first_clip.get('resolution', '1920x1080'),
            project_type=first_clip.get('project_type', 'SDR'),
            num_clips=num_clips,
            is_rush=first_clip.get('is_rush', False)
        )
    
    @staticmethod
    def _categorize_resolution(resolution: str) -> str:
        """
        Categoriza a resolução em faixas de preço
        """
        try:
         width, height = map(int, resolution.lower().replace(\'x\', \' \').split())           total_pixels = width * height
            
            if total_pixels >= 7680 * 4320:
                return '8K'
            elif total_pixels >= 6144 * 3160:
                return '6K'
            elif total_pixels >= 3840 * 2160:
                return '4K'
            elif total_pixels >= 1920 * 1080:
                return '2K'
            elif total_pixels >= 1280 * 720:
                return 'HD'
            else:
                return 'SD'
        except:
            return '2K'  # Default
    
    @staticmethod
    def _get_volume_discount(num_clips: int) -> float:
        """
        Retorna a taxa de desconto baseada no número de clips
        """
        for threshold, discount in reversed(AutomaticPricing.VOLUME_DISCOUNTS):
            if num_clips >= threshold:
                return discount
        return 0.0
    
    @staticmethod
    def get_pricing_table() -> Dict:
        """
        Retorna tabela de preços para exibição ao cliente
        """
        return {
            'base_rates': AutomaticPricing.BASE_RATES,
            'codec_multipliers': AutomaticPricing.CODEC_MULTIPLIERS,
            'resolution_multipliers': AutomaticPricing.RESOLUTION_MULTIPLIERS,
            'volume_discounts': [
                {'clips': threshold, 'discount': f'{int(discount*100)}%'}
                for threshold, discount in AutomaticPricing.VOLUME_DISCOUNTS
            ],
            'rush_fee': '50%'
        }

