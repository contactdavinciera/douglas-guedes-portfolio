/**
 * Serviço de Upload para Color Studio
 * Gerencia uploads para Cloudflare Stream e R2
 */

import { API_ENDPOINTS, apiRequest } from '../config/api';

/**
 * Verifica se o arquivo é formato RAW
 */
export const isRawFormat = (filename) => {
  const rawExtensions = ['.braw', '.r3d', '.arri', '.ari', '.mxf', '.dng', '.dpx', '.cin'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return rawExtensions.includes(extension);
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

export default {
  isRawFormat,
  initStreamUpload,
  uploadToStream,
  initRawUpload,
  checkVideoStatus,
  uploadFile,
};
