/**
 * Serviço de Upload para Color Studio
 * Gerencia uploads para Cloudflare Stream e R2
 */

import { API_ENDPOINTS, apiRequest } from '../config/api';

// ✅ ADICIONADO: Constantes de validação
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
const ALLOWED_RAW_EXTENSIONS = ['.braw', '.r3d', '.arri', '.ari', '.mxf', '.dng', '.dpx', '.cin'];
const ALLOWED_EXTENSIONS = [...ALLOWED_VIDEO_EXTENSIONS, ...ALLOWED_RAW_EXTENSIONS];

/**
 * Verifica se o arquivo é formato RAW
 */
export const isRawFormat = (filename) => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_RAW_EXTENSIONS.includes(extension);
};

/**
 * ✅ ADICIONADO: Valida arquivo antes do upload
 */
export const validateFile = (file) => {
  const errors = [];
  
  // Validar se o arquivo existe
  if (!file) {
    errors.push('Nenhum arquivo foi selecionado');
    return { valid: false, errors };
  }
  
  // Validar tamanho
  if (file.size === 0) {
    errors.push('O arquivo está vazio');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeGB = (MAX_FILE_SIZE / (1024 ** 3)).toFixed(2);
    const fileSizeGB = (file.size / (1024 ** 3)).toFixed(2);
    errors.push(`Arquivo muito grande (${fileSizeGB}GB). Tamanho máximo: ${maxSizeGB}GB`);
  }
  
  // Validar extensão
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(`Formato não suportado: ${extension}. Formatos permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  
  // Validar nome do arquivo
  if (file.name.length > 255) {
    errors.push('Nome do arquivo muito longo (máximo 255 caracteres)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    info: {
      name: file.name,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      extension,
      isRaw: isRawFormat(file.name),
      type: file.type
    }
  };
};

/**
 * ✅ ADICIONADO: Formata tamanho de arquivo
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Inicializa upload para Cloudflare Stream (vídeos standard)
 */
export const initStreamUpload = async (file) => {
  try {
    console.log('📤 Initializing Stream upload:', file.name);
    
    const response = await apiRequest(API_ENDPOINTS.COLOR_STUDIO_UPLOAD_STREAM, {
      method: 'POST',
      body: JSON.stringify({
        fileSize: file.size,
        fileName: file.name,
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize upload');
    }

    console.log('✅ Stream upload initialized:', response.uid);
    return response;
  } catch (error) {
    console.error('❌ Error initializing Stream upload:', error);
    throw error;
  }
};

/**
 * Faz upload do arquivo para Cloudflare Stream via TUS
 */
export const uploadToStream = async (file, uploadURL, onProgress) => {
  try {
    console.log('📤 Uploading to Stream via TUS...');
    
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      
      const response = await fetch(uploadURL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': offset.toString(),
          'Tus-Resumable': '1.0.0',
        },
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Upload failed at offset ${offset}`);
      }

      offset += chunk.size;
      
      // Callback de progresso
      if (onProgress) {
        onProgress({
          loaded: offset,
          total: file.size,
          percentage: Math.round((offset / file.size) * 100),
        });
      }

      console.log(`✅ Uploaded ${offset} / ${file.size} bytes`);
    }

    console.log('🎉 Upload to Stream complete!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error uploading to Stream:', error);
    throw error;
  }
};

/**
 * Inicializa upload para R2 (arquivos RAW)
 */
export const initRawUpload = async (file) => {
  try {
    console.log('📤 Initializing RAW upload:', file.name);
    
    const response = await apiRequest(API_ENDPOINTS.COLOR_STUDIO_UPLOAD_RAW_INIT, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize RAW upload');
    }

    console.log('✅ RAW upload initialized:', response.uploadId);
    return response;
  } catch (error) {
    console.error('❌ Error initializing RAW upload:', error);
    throw error;
  }
};

/**
 * Verifica status de um vídeo no Stream
 */
export const checkVideoStatus = async (videoId) => {
  try {
    const url = `${API_ENDPOINTS.COLOR_STUDIO_VIDEO_STATUS}?videoId=${videoId}`;
    const response = await apiRequest(url);
    return response;
  } catch (error) {
    console.error('❌ Error checking video status:', error);
    throw error;
  }
};

/**
 * Função principal de upload - detecta tipo e roteia
 */
export const uploadFile = async (file, onProgress) => {
  try {
    console.log('🎬 Starting upload for:', file.name);
    
    // ✅ ADICIONADO: Validar arquivo antes de enviar
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorMessage = validation.errors.join('; ');
      console.error('❌ Validação falhou:', validation.errors);
      throw new Error(`Validação do arquivo falhou: ${errorMessage}`);
    }
    
    console.log('✅ Arquivo validado:', validation.info);
    
    // Verificar se é RAW ou Standard
    const isRaw = isRawFormat(file.name);
    
    if (isRaw) {
      // Upload RAW para R2
      console.log('🎥 Detected RAW format, uploading to R2...');
      const initResponse = await initRawUpload(file);
      
      // TODO: Implementar upload multipart para R2
      // Por enquanto, retorna apenas a inicialização
      return {
        success: true,
        type: 'raw',
        data: initResponse,
      };
    } else {
      // Upload Standard para Stream
      console.log('📹 Detected standard format, uploading to Stream...');
      const initResponse = await initStreamUpload(file);
      
      // Fazer upload via TUS
      await uploadToStream(file, initResponse.uploadURL, onProgress);
      
      return {
        success: true,
        type: 'stream',
        uid: initResponse.uid,
      };
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
};

// ✅ ADICIONADO: Exportar novas funções de validação
export default {
  isRawFormat,
  validateFile,
  formatFileSize,
  initStreamUpload,
  uploadToStream,
  initRawUpload,
  checkVideoStatus,
  uploadFile,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
};
