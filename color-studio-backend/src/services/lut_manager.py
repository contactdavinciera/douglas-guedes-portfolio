from typing import List, Dict

class LUTManager:
    """Gerencia biblioteca de LUTs e compatibilidade"""
    
    # Biblioteca de LUTs organizadas por formato de entrada
    LUT_LIBRARY = {
        'BRAW': {
            'SDR': [
                {'id': 'braw_rec709_natural', 'name': 'BRAW to Rec.709 Natural', 'input_space': 'BMD Film Gen5', 'output_space': 'Rec.709'},
                {'id': 'braw_rec709_vivid', 'name': 'BRAW to Rec.709 Vivid', 'input_space': 'BMD Film Gen5', 'output_space': 'Rec.709'},
                {'id': 'braw_rec709_flat', 'name': 'BRAW to Rec.709 Flat', 'input_space': 'BMD Film Gen5', 'output_space': 'Rec.709'},
            ],
            'HDR': [
                {'id': 'braw_hdr10', 'name': 'BRAW to HDR10', 'input_space': 'BMD Film Gen5', 'output_space': 'Rec.2020 PQ'},
                {'id': 'braw_hlg', 'name': 'BRAW to HLG', 'input_space': 'BMD Film Gen5', 'output_space': 'Rec.2020 HLG'},
            ],
            'DolbyVision': [
                {'id': 'braw_dolby', 'name': 'BRAW to Dolby Vision', 'input_space': 'BMD Film Gen5', 'output_space': 'Dolby Vision'},
            ]
        },
        'ProRes': {
            'SDR': [
                {'id': 'prores_rec709_natural', 'name': 'ProRes Rec.709 Natural', 'input_space': 'Rec.709', 'output_space': 'Rec.709'},
                {'id': 'prores_rec709_cinematic', 'name': 'ProRes Cinematic', 'input_space': 'Rec.709', 'output_space': 'Rec.709'},
            ],
            'HDR': [
                {'id': 'prores_hdr10', 'name': 'ProRes to HDR10', 'input_space': 'Rec.709', 'output_space': 'Rec.2020 PQ'},
            ],
            'DolbyVision': [
                {'id': 'prores_dolby', 'name': 'ProRes to Dolby Vision', 'input_space': 'Rec.709', 'output_space': 'Dolby Vision'},
            ]
        },
        'LOG': {
            'SDR': [
                {'id': 'slog3_rec709', 'name': 'S-Log3 to Rec.709', 'input_space': 'S-Gamut3.Cine', 'output_space': 'Rec.709'},
                {'id': 'vlog_rec709', 'name': 'V-Log to Rec.709', 'input_space': 'V-Gamut', 'output_space': 'Rec.709'},
                {'id': 'clog3_rec709', 'name': 'C-Log3 to Rec.709', 'input_space': 'Cinema Gamut', 'output_space': 'Rec.709'},
            ],
            'HDR': [
                {'id': 'slog3_hdr10', 'name': 'S-Log3 to HDR10', 'input_space': 'S-Gamut3.Cine', 'output_space': 'Rec.2020 PQ'},
                {'id': 'vlog_hdr10', 'name': 'V-Log to HDR10', 'input_space': 'V-Gamut', 'output_space': 'Rec.2020 PQ'},
            ],
            'DolbyVision': [
                {'id': 'slog3_dolby', 'name': 'S-Log3 to Dolby Vision', 'input_space': 'S-Gamut3.Cine', 'output_space': 'Dolby Vision'},
            ]
        },
        'Rec.709': {
            'SDR': [
                {'id': 'rec709_enhance', 'name': 'Rec.709 Enhancement', 'input_space': 'Rec.709', 'output_space': 'Rec.709'},
                {'id': 'rec709_warm', 'name': 'Rec.709 Warm', 'input_space': 'Rec.709', 'output_space': 'Rec.709'},
                {'id': 'rec709_cool', 'name': 'Rec.709 Cool', 'input_space': 'Rec.709', 'output_space': 'Rec.709'},
            ],
            'HDR': [
                {'id': 'rec709_to_hdr10', 'name': 'Rec.709 to HDR10', 'input_space': 'Rec.709', 'output_space': 'Rec.2020 PQ'},
            ],
            'DolbyVision': [
                {'id': 'rec709_to_dolby', 'name': 'Rec.709 to Dolby Vision', 'input_space': 'Rec.709', 'output_space': 'Dolby Vision'},
            ]
        }
    }
    
    @staticmethod
    def get_compatible_luts(color_space: str, gamma: str, project_type: str) -> List[Dict]:
        """
        Retorna LUTs compatíveis baseado no color space detectado e tipo de projeto
        """
        # Determinar categoria do formato
        format_category = LUTManager._categorize_format(color_space, gamma)
        
        # Buscar LUTs compatíveis
        if format_category in LUTManager.LUT_LIBRARY:
            if project_type in LUTManager.LUT_LIBRARY[format_category]:
                return LUTManager.LUT_LIBRARY[format_category][project_type]
        
        # Fallback para Rec.709 SDR
        return LUTManager.LUT_LIBRARY['Rec.709']['SDR']
    
    @staticmethod
    def _categorize_format(color_space: str, gamma: str) -> str:
        """Categoriza o formato detectado"""
        color_space_lower = color_space.lower()
        gamma_lower = gamma.lower()
        
        # Detectar BRAW
        if 'bmd' in color_space_lower or 'blackmagic' in color_space_lower:
            return 'BRAW'
        
        # Detectar LOG
        if 'log' in color_space_lower or 'log' in gamma_lower:
            return 'LOG'
        
        # Detectar ProRes (geralmente vem como Rec.709 mas com codec ProRes)
        # Isso será refinado com informações do codec
        
        # Default
        return 'Rec.709'
    
    @staticmethod
    def get_all_luts() -> Dict:
        """
        Retorna toda a biblioteca de LUTs
        """
        return LUTManager.LUT_LIBRARY
    
    @staticmethod
    def get_lut_by_id(lut_id: str) -> Dict:
        """
        Busca uma LUT específica por ID
        """
        for format_cat in LUTManager.LUT_LIBRARY.values():
            for project_type in format_cat.values():
                for lut in project_type:
                    if lut['id'] == lut_id:
                        return lut
        return None

