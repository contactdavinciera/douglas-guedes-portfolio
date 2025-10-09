import * as tus from "tus-js-client";

/**
 * Serviço para interagir com Cloudflare Stream API
 * Versão otimizada com tratamento de erros robusto
 */
class StreamApiService {
  constructor() {
    this.baseUrl = "https://color-studio-backend.onrender.com";
    this.frontendOrigin = "douglas-guedes-portfolio.pages.dev";
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  /**
   * Retry helper para requisições que falharam
   */
  async retryRequest(fn, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Tentativa ${i + 1} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  /**
   * Obter URL de upload direto do Cloudflare Stream
   */
  async getUploadUrl(file) {
    try {
      console.log(`📤 Solicitando URL de upload para: ${file.name} (${file.size} bytes)`);
      
      const response = await fetch(`${this.baseUrl}/api/color-studio/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: file.size,
          fileName: file.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Erro ao obter URL de upload`);
      }

      const data = await response.json();
      
      if (!data.uploadURL || !data.uid) {
        throw new Error("Resposta inválida do backend para URL de upload");
      }

      console.log(`✅ URL de upload recebida: ${data.uploadURL}`);
      return data;

    } catch (error) {
      console.error("❌ Erro ao obter URL de upload:", error);
      throw new Error(`Falha ao obter URL de upload: ${error.message}`);
    }
  }

  /**
   * Upload usando TUS com a biblioteca oficial tus-js-client
   */
/**
 * Upload usando TUS com a biblioteca oficial tus-js-client
 */
async uploadWithTus(file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    console.log(`📤 Iniciando upload TUS para: ${uploadUrl}`);

    const upload = new tus.Upload(file, {
      // USA A URL RETORNADA DIRETAMENTE (já é a Location do POST)
      uploadUrl: uploadUrl,
      
      // Desabilita criação de nova sessão (já foi criada no backend)
      resume: false,
      
      // Configurações TUS
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 52428800, // 50 MB
      
      onError: (error) => {
        console.error("❌ Erro TUS:", error);
        reject(new Error(`Upload falhou: ${error.message}`));
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.floor((bytesUploaded / bytesTotal) * 100);
        console.log(`📊 Progresso: ${percentage}% (${bytesUploaded}/${bytesTotal})`);
        
        if (onProgress) {
          onProgress(percentage, bytesUploaded, bytesTotal);
        }
      },

      onSuccess: () => {
        console.log("🎉 Upload TUS concluído com sucesso!");
        resolve({
          success: true,
          uploadedBytes: file.size
        });
      }
    });

    // Inicia o upload
    upload.start();
  });
}

  async getVideoStatus(videoId) {
    try {
      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${this.baseUrl}/api/stream/video-status?videoId=${videoId}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        return res.json();
      });

      if (!response.cf?.result) {
        throw new Error("Resposta inválida ao verificar status");
      }

      return response.cf.result;

    } catch (error) {
      console.error("❌ Erro ao verificar status:", error);
      throw new Error(`Falha ao verificar status: ${error.message}`);
    }
  }

  /**
   * Listar vídeos do Stream
   */
  async listVideos(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = "all",
        search = "",
        sortBy = "created",
        sortOrder = "desc"
      } = options;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
        sortBy,
        sortOrder
      });

      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${this.baseUrl}/api/stream/list-videos?${queryParams.toString()}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        return res.json();
      });

      return {
        videos: response.cf?.result?.videos || [],
        total: response.cf?.result?.total || 0
      };

    } catch (error) {
      console.error("❌ Erro ao listar vídeos:", error);
      throw new Error(`Falha ao listar vídeos: ${error.message}`);
    }
  }

  /**
   * Analisar arquivo e detectar metadados
   */
  analyzeFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    
    const formats = {
      "braw": { format: "BRAW", colorSpace: "Blackmagic Wide Gamut", isRaw: true },
      "r3d": { format: "RED R3D", colorSpace: "REDWideGamutRGB", isRaw: true },
      "ari": { format: "ALEXA", colorSpace: "LogC", isRaw: true },
      "mov": { format: "QuickTime", colorSpace: "Rec.709", isRaw: false },
      "mp4": { format: "MP4", colorSpace: "Rec.709", isRaw: false },
      "mxf": { format: "Sony MXF", colorSpace: "S-Gamut3", isRaw: true },
      "dng": { format: "Cinema DNG", colorSpace: "Linear", isRaw: true }
    };

    const fileInfo = formats[extension] || { 
      format: "Unknown", 
      colorSpace: "Unknown", 
      isRaw: false 
    };
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension,
      ...fileInfo
    };
  }

  /**
   * Aguardar processamento do vídeo com polling
   */
  async waitForProcessing(videoId, maxAttempts = 60, interval = 2000) {
    console.log(`⏳ Aguardando processamento do vídeo ${videoId}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const statusResponse = await this.getVideoStatus(videoId);
        const video = statusResponse.video || statusResponse;

        console.log(`Tentativa ${attempt}/${maxAttempts} - Status: ${video.status}`);

        if (video.ready) {
          console.log("✅ Vídeo processado com sucesso!");
          return video;
        }

        if (video.status === "error") {
          throw new Error("Erro no processamento do vídeo pelo Cloudflare Stream");
        }

        // Aguardar antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, interval));
        
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Timeout: Vídeo não processado após ${maxAttempts} tentativas`);
        }
        
        // Se não for a última tentativa, aguarda e tenta novamente
        console.warn(`⚠️ Erro na tentativa ${attempt}, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error("Timeout: Vídeo não foi processado no tempo esperado");
  }

  /**
   * Formatar tamanho de arquivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Formatar duração
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Obter cor do formato
   */
  getFormatColor(format) {
    const colors = {
      "BRAW": "#ff6b35",
      "RED R3D": "#dc2626",
      "ALEXA": "#059669",
      "Sony MXF": "#3b82f6",
      "Cinema DNG": "#8b5cf6",
      "QuickTime": "#6b7280",
      "MP4": "#6b7280",
    };
    return colors[format] || "#6b7280";
  }
}

// Exportar instância singleton
const streamApi = new StreamApiService();
export default streamApi;

