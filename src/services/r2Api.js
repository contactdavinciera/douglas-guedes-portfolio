import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const r2Api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const uploadFile = async (file, onProgress) => {
  try {
    // Iniciar o upload multipart no backend para obter um UploadId e URLs pré-assinadas
    const initResponse = await r2Api.post('/upload/r2/init', {
      filename: file.name,
      file_size: file.size,
      file_type: file.type,
    });

    const { upload_id, key, urls } = initResponse.data;

    const chunkSize = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadedParts = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const partNumber = i + 1;
      const uploadUrl = urls[i]; // URL pré-assinada para esta parte

      const uploadPartResponse = await axios.put(uploadUrl, chunk, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(((i / totalChunks) + (percentCompleted / 100 / totalChunks)) * 100);
        },
      });

      uploadedParts.push({
        PartNumber: partNumber,
        ETag: uploadPartResponse.headers.etag,
      });
    }

    // Completar o upload multipart no backend
    const completeResponse = await r2Api.post(`/upload/r2/complete/${upload_id}`, {
      key,
      parts: uploadedParts,
    });

    return { success: true, key, ...completeResponse.data };

  } catch (error) {
    console.error('Erro ao fazer upload para R2:', error);
    throw error;
  }
};

export default { uploadFile };

