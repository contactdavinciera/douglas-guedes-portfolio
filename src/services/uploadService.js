/**
 * Serviço de Upload para Color Studio
 * FLUXO CORRETO: Stream direto OU RAW → R2 → H.265 → Stream
 */

import { API_ENDPOINTS, apiRequest } from "../config/api";

/**
 * Verifica se o arquivo é formato RAW
 */
export const isRawFormat = (filename) => {
  const rawExtensions = [".braw", ".r3d", ".arri", ".ari", ".mxf", ".dng", ".dpx", ".cin"];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return rawExtensions.includes(ext);
};

/**
 * FLUXO 1: Upload para Cloudflare Stream (vídeos standard)
 */
export const uploadToStream = async (file, onProgress) => {
  try {
    console.log("📹 FLUXO STREAM: Iniciando upload standard...");
    console.log("   Arquivo:", file.name);
    console.log("   Tamanho:", (file.size / 1024 / 1024).toFixed(2), "MB");
    
    // 1. Inicializar upload no Stream
    const initResponse = await apiRequest(API_ENDPOINTS.UPLOAD_STREAM, {
      method: "POST",
      body: JSON.stringify({
        fileSize: file.size,
        fileName: file.name,
      }),
    });

    if (!initResponse.success || !initResponse.uploadURL) {
      throw new Error("Failed to get upload URL from Stream");
    }

    console.log("✅ Stream session created:", initResponse.uid);
    
    // 2. Upload via TUS protocol
    const uploadURL = initResponse.uploadURL;
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      
      console.log(`📤 Uploading chunk: ${offset} - ${offset + chunk.size} / ${file.size}`);
      
      const response = await fetch(uploadURL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/offset+octet-stream",
          "Upload-Offset": offset.toString(),
          "Tus-Resumable": "1.0.0",
        },
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Upload failed at offset ${offset}: ${response.status}`);
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
    }

    console.log("🎉 Upload to Stream complete!");
    console.log("   Stream UID:", initResponse.uid);
    console.log("   ✅ PREVIEW DISPONÍVEL após processamento!");
    
    return {
      success: true,
      type: "stream",
      uid: initResponse.uid,
      message: "Upload concluído! Processando preview...",
    };
    
  } catch (error) {
    console.error("❌ Error uploading to Stream:", error);
    throw error;
  }
};

/**
 * FLUXO 2: Upload RAW para R2 → Conversão → Stream
 */
export const uploadRawToR2 = async (file, onProgress) => {
  try {
    console.log("🎥 FLUXO RAW: Iniciando upload RAW...");
    console.log("   Arquivo:", file.name);
    console.log("   Tamanho:", (file.size / 1024 / 1024).toFixed(2), "MB");
    console.log("   1️⃣ Upload para R2");
    console.log("   2️⃣ Conversão para H.265");
    console.log("   3️⃣ Upload para Stream");
    console.log("   4️⃣ Preview disponível");
    
    // 1. Inicializar upload multipart no R2
    const initResponse = await apiRequest(API_ENDPOINTS.UPLOAD_RAW_INIT, {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
      }),
    });

    if (!initResponse.success) {
      throw new Error("Failed to initialize RAW upload");
    }

    console.log("✅ R2 multipart upload initialized");
    console.log("   Upload ID:", initResponse.uploadId);
    console.log("   Key:", initResponse.key);
    
    // TODO: Implementar upload multipart completo
    // Por enquanto, apenas retorna inicialização
    
    return {
      success: true,
      type: "raw",
      uploadId: initResponse.uploadId,
      key: initResponse.key,
      message: "Upload RAW iniciado! Aguardando implementação completa...",
    };
    
  } catch (error) {
    console.error("❌ Error uploading RAW:", error);
    throw error;
  }
};

/**
 * Função principal: detecta tipo e roteia para fluxo correto
 */
export const uploadFile = async (file, onProgress) => {
  try {
    console.log("═══════════════════════════════════════");
    console.log("🎬 INICIANDO UPLOAD");
    console.log("   Arquivo:", file.name);
    console.log("   Tipo:", file.type);
    console.log("   Tamanho:", (file.size / 1024 / 1024).toFixed(2), "MB");
    console.log("═══════════════════════════════════════");
    
    const isRaw = isRawFormat(file.name);
    
    if (isRaw) {
      // FLUXO RAW
      console.log("🎯 Detectado: ARQUIVO RAW");
      console.log("📍 Rota: R2 → H.265 → Stream → Preview");
      return await uploadRawToR2(file, onProgress);
    } else {
      // FLUXO STREAM DIRETO
      console.log("🎯 Detectado: VÍDEO STANDARD");
      console.log("📍 Rota: Stream → Preview");
      return await uploadToStream(file, onProgress);
    }
    
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
};

export default {
  isRawFormat,
  uploadToStream,
  uploadRawToR2,
  uploadFile,
};
