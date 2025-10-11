/**
 * Configuração da API do Color Studio
 * AJUSTADO PARA USAR O BACKEND CORRETO
 */

// IMPORTANTE: URL do BACKEND (não do frontend!)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Remover barra final se existir
const baseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

console.log('🔧 API Config loaded:');
console.log('   Base URL:', baseURL);
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);

// Export as API_BASE_URL for compatibility
export const API_BASE_URL = baseURL;

// Endpoints da API
export const API_ENDPOINTS = {
  // Color Studio
  STATUS: `${baseURL}/api/color-studio/status`,
  UPLOAD_STREAM: `${baseURL}/api/color-studio/upload-url`,
  UPLOAD_RAW_INIT: `${baseURL}/api/color-studio/upload/raw/init`,
  UPLOAD_RAW_COMPLETE: `${baseURL}/api/color-studio/upload/raw/complete`,
  VIDEO_STATUS: `${baseURL}/api/color-studio/video-status`,
  CONVERT_RAW: `${baseURL}/api/color-studio/convert/raw`,
};

// Helper para fazer requisições
export const apiRequest = async (url, options = {}) => {
  try {
    console.log(`📡 API Request: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Response OK:`, data);
    return data;
    
  } catch (error) {
    console.error('❌ API Request Error:', error);
    throw error;
  }
};

export default {
  baseURL,
  API_ENDPOINTS,
  apiRequest,
};
