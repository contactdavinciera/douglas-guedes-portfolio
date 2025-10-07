// Serviço para interagir com as APIs do Cloudflare Stream
class StreamApiService {
  constructor() {
    this.baseUrl = ''; // Usar caminho relativo para Cloudflare Pages Functions
    this.frontendOrigin = "douglas-guedes-portfolio.pages.dev"; // Adicionar o domínio do frontend sem protocolo para uso em allowedOrigins
  }

  // Obter URL de upload direto
  async getUploadUrl(file, maxDurationSeconds = 3600) {
    try {
      const metadata = this.analyzeFile(file);
      
      // Preparar metadados para o upload
      const uploadMetadata = {
        filename: btoa(file.name),
        filetype: btoa(file.type),
        format: btoa(metadata.format),
        colorSpace: btoa(metadata.colorSpace),
        maxDurationSeconds: btoa(maxDurationSeconds.toString())
      };

      // Converter metadados para o formato esperado pelo TUS
      const metadataString = Object.entries(uploadMetadata)
        .map(([key, value]) => `${key} ${value}`)
        .join(',');

      const response = await fetch(`${this.baseUrl}/api/stream/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadLength: file.size,
          uploadMetadata: metadataString,
          maxDurationSeconds,
          allowedOrigins: [this.frontendOrigin] // Passar o origin do frontend para o backend
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao obter URL de upload');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter URL de upload:', error);
      throw error;
    }
  }

  // Verificar status do vídeo
  async getVideoStatus(videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/stream/video-status?videoId=${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar status do vídeo');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status do vídeo:', error);
      throw error;
    }
  }

  // Listar vídeos
  async listVideos(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        search = '',
        sortBy = 'created',
        sortOrder = 'desc'
      } = options;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
        sortBy,
        sortOrder
      });

      const response = await fetch(`${this.baseUrl}/api/stream/list-videos?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao listar vídeos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar vídeos:', error);
      throw error;
    }
  }

  // Upload usando TUS (Tus Resumable Upload)
  async uploadWithTus(file, uploadUrl, onProgress) {
    return new Promise((resolve, reject) => {
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      let uploadedBytes = 0;

      const uploadChunk = async () => {
        try {
          const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);
          
          // Fazer upload do chunk
          const response = await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/offset+octet-stream',
              'Upload-Offset': uploadedBytes.toString(),
              'Tus-Resumable': '1.0.0'
            },
            body: chunk
          });

          if (!response.ok) {
            throw new Error(`Erro no upload: ${response.statusText}`);
          }

          uploadedBytes += chunk.size;
          const progress = Math.round((uploadedBytes / file.size) * 100);
          
          onProgress?.(progress, uploadedBytes, file.size);

          if (uploadedBytes < file.size) {
            // Continuar upload
            uploadChunk();
          } else {
            // Upload completo
            resolve({
              success: true,
              uploadedBytes,
              totalBytes: file.size
            });
          }
        } catch (error) {
          reject(error);
        }
      };

      uploadChunk();
    });
  }

  // Upload básico para arquivos pequenos
  async uploadBasic(file, uploadUrl, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress, event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            uploadedBytes: file.size,
            totalBytes: file.size
          });
        } else {
          reject(new Error(`Erro no upload: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de rede durante o upload'));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  // Analisar arquivo e detectar metadados
  analyzeFile(file) {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const formats = {
      'braw': { format: 'BRAW', colorSpace: 'Blackmagic Wide Gamut', isRaw: true },
      'r3d': { format: 'RED R3D', colorSpace: 'REDWideGamutRGB', isRaw: true },
      'ari': { format: 'ALEXA', colorSpace: 'LogC', isRaw: true },
      'mov': { format: 'QuickTime', colorSpace: 'Rec.709', isRaw: false },
      'mp4': { format: 'MP4', colorSpace: 'Rec.709', isRaw: false },
      'mxf': { format: 'Sony MXF', colorSpace: 'S-Gamut3', isRaw: true },
      'dng': { format: 'Cinema DNG', colorSpace: 'Linear', isRaw: true }
    };

    const fileInfo = formats[extension] || { format: 'Unknown', colorSpace: 'Unknown', isRaw: false };
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      ...fileInfo
    };
  }

  // Aguardar processamento do vídeo
  async waitForProcessing(videoId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse = await this.getVideoStatus(videoId);
        const video = statusResponse.video;

        if (video.ready) {
          return video;
        }

        if (video.status === 'error') {
          throw new Error('Erro no processamento do vídeo');
        }

        // Aguardar antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Timeout: Vídeo não foi processado no tempo esperado');
  }
}

// Exportar instância singleton
const streamApi = new StreamApiService();
export default streamApi;
