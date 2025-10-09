/**
 * Configurações para resolver problemas de CORS com Cloudflare Stream
 * e melhorar a integração do Color Studio
 */

export const CORS_CONFIG = {
  // Headers necessários para requisições ao Cloudflare Stream
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  },

  // Configurações específicas do Cloudflare Stream
  cloudflareStream: {
    // Customer code para o domínio
    customerCode: '5dr3ub1goe3wg2wj',
    
    // URLs base do Cloudflare Stream
    baseUrl: 'https://cloudflarestream.com',
    embedUrl: 'https://embed.cloudflarestream.com',
    customerUrl: 'https://customer-5dr3ub1goe3wg2wj.cloudflarestream.com',
    
    // Configurações de iframe
    iframeParams: {
      autoplay: false,
      controls: true,
      muted: false,
      loop: false,
      primaryColor: '3b82f6',
      letterboxColor: 'transparent'
    },

    // Configurações de CORS para iframe
    iframeAttributes: {
      allow: 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture',
      allowFullScreen: true,
      referrerPolicy: 'strict-origin-when-cross-origin'
    }
  },

  // Configurações de webhook/callback
  webhooks: {
    // URL do backend para receber webhooks do Cloudflare Stream
    callbackUrl: 'https://color-studio-backend.onrender.com/api/webhooks/cloudflare-stream',
    
    // Eventos que devem ser monitorados
    events: [
      'video.live.input.connected',
      'video.live.input.disconnected',
      'video.upload.complete',
      'video.ready'
    ],
    
    // Configurações de retry para webhooks
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    }
  },

  // Configurações de fallback para problemas de CORS
  fallback: {
    // URL alternativa para preview direto
    directPreviewUrl: (videoId) => `https://customer-5dr3ub1goe3wg2wj.cloudflarestream.com/${videoId}/watch`,
    
    // URL para download do vídeo processado
    downloadUrl: (videoId) => `https://customer-5dr3ub1goe3wg2wj.cloudflarestream.com/${videoId}/downloads/default.mp4`,
    
    // URL para thumbnail
    thumbnailUrl: (videoId) => `https://customer-5dr3ub1goe3wg2wj.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`
  }
};

/**
 * Função para verificar se há problemas de CORS
 */
export const checkCORSIssues = async (videoId) => {
  try {
    const testUrl = `${CORS_CONFIG.cloudflareStream.customerUrl}/${videoId}/manifest/video.m3u8`;
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'cors'
    });
    
    return {
      hasCORSIssue: !response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('CORS Check Error:', error);
    return {
      hasCORSIssue: true,
      error: error.message
    };
  }
};

/**
 * Função para configurar headers CORS em requisições
 */
export const addCORSHeaders = (headers = {}) => {
  return {
    ...headers,
    ...CORS_CONFIG.headers
  };
};

/**
 * Função para gerar URL de iframe com configurações otimizadas
 */
export const generateOptimizedIframeUrl = (videoId, options = {}) => {
  const { customerCode } = CORS_CONFIG.cloudflareStream;
  const params = {
    ...CORS_CONFIG.cloudflareStream.iframeParams,
    ...options
  };
  
  const queryString = new URLSearchParams(params).toString();
  return `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe?${queryString}`;
};

/**
 * Função para configurar webhook no Cloudflare Stream
 */
export const configureWebhook = async (apiToken, accountId) => {
  try {
    const webhookConfig = {
      targetUrl: CORS_CONFIG.webhooks.callbackUrl,
      secret: 'webhook-secret-key', // Em produção, usar uma chave segura
      events: CORS_CONFIG.webhooks.events
    };

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/webhook`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookConfig)
    });

    if (!response.ok) {
      throw new Error(`Failed to configure webhook: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Webhook Configuration Error:', error);
    throw error;
  }
};

export default CORS_CONFIG;
