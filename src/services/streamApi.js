import * as tus from "tus-js-client";

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
          maxDurationSeconds: Math.min(maxDurationSeconds, 21600), // garante limite de 6h,
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

  // Upload usando TUS (Tus Resumable Upload) com tus-js-client
  async uploadWithTus(file, uploadUrl, onProgress) {
    console.log(\'uploadWithTus: Iniciando upload TUS com tus-js-client para:\', uploadUrl, \'com arquivo:\', file.name);
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        uploadUrl: uploadUrl, // Usar uploadUrl para retomar um recurso já criado
        removeFingerprintOnSuccess: true, // Desabilitar fingerprinting para depuração
        uploadSize: file.size,
        metadata: {
          filename: file.name,
          filetype: file.type || \'application/octet-stream\',
        },
        chunkSize: 5 * 1024 * 1024, // 5 MB
        retryDelays: [0, 1000, 3000, 5000],

        onError: (error) => {
          console.error(\'TUS error:\', error);
          reject(error);
        },

        onProgress: (bytesSent, bytesTotal) => {
          const pct = Math.floor((bytesSent / bytesTotal) * 100);
          if (onProgress) onProgress(pct, bytesSent, bytesTotal);
        },

        onSuccess: () => {
          console.log(\'TUS upload concluído. URL:\', upload.url);
          resolve({ tusUrl: upload.url });
        },
      });

      upload.start();
    });
  }

  // Upload básico para arquivos pequenos
  async uploadBasic(file, uploadUrl, onProgress) {
    console.log('uploadBasic: Iniciando upload básico para:', uploadUrl, 'com arquivo:', file.name);
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress, event.loaded, event.total);
          console.log('uploadBasic: Progresso:', progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('uploadBasic: Upload básico concluído.');
          resolve({
            success: true,
            uploadedBytes: file.size,
            totalBytes: file.size
          });
        } else {
          console.error('uploadBasic: Erro no upload:', xhr.status, xhr.statusText);
          reject(new Error(`Erro no upload: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('uploadBasic: Erro de rede durante o upload.');
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
