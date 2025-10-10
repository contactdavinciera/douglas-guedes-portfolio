/**
 * Configuração da API do Color Studio
 * Usa VITE_API_URL do ambiente ou fallback para localhost
 */

// Pegar URL da API das variáveis de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Remover barra final se existir
const baseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Endpoints da API
export const API_ENDPOINTS = {
  // Color Studio
  COLOR_STUDIO_STATUS: `${baseURL}/api/color-studio/status`,
  COLOR_STUDIO_UPLOAD_STREAM: `${baseURL}/api/color-studio/upload-url`,
  COLOR_STUDIO_UPLOAD_RAW_INIT: `${baseURL}/api/color-studio/upload/raw/init`,
  COLOR_STUDIO_UPLOAD_RAW_PART: `${baseURL}/api/color-studio/upload/raw/part-url`,
  COLOR_STUDIO_UPLOAD_RAW_COMPLETE: `${baseURL}/api/color-studio/upload/raw/complete`,
  COLOR_STUDIO_VIDEO_STATUS: `${baseURL}/api/color-studio/video-status`,
  COLOR_STUDIO_CONVERT_RAW: `${baseURL}/api/color-studio/convert/raw`,
};

// Configuração padrão do Axios/Fetch
export const API_CONFIG = {
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos
};

// Helper para fazer requisições
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Log da configuração (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  Base URL:', baseURL);
  console.log('  Environment:', import.meta.env.MODE);
  console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
}

export default {
  API_URL: baseURL,
  API_ENDPOINTS,
  API_CONFIG,
  apiRequest,
};

