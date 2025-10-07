// API endpoint para gerar URLs de upload direto para Cloudflare Stream
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { uploadLength, uploadMetadata, maxDurationSeconds = 3600 } = req.body;

    // Validar parâmetros obrigatórios
    if (!uploadLength) {
      return res.status(400).json({ error: 'uploadLength é obrigatório' });
    }

    // Configurações do Cloudflare Stream
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.CLOUDFLARE_EMAIL;

    if (!accountId || !apiToken || !email) {
      console.error('Credenciais do Cloudflare Stream não configuradas');
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    // Determinar se usar upload básico ou TUS baseado no tamanho
    const maxBasicUploadSize = 200 * 1024 * 1024; // 200MB
    const useBasicUpload = uploadLength <= maxBasicUploadSize;

    let uploadUrl;
    let videoId;

    if (useBasicUpload) {
      // Upload básico para arquivos menores que 200MB
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
        {
          method: 'POST',
          headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxDurationSeconds,
            requireSignedURLs: false,
            allowedOrigins: ['*'],
            meta: {
              uploadedVia: 'ColorStudioPro',
              timestamp: new Date().toISOString()
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na API do Cloudflare Stream:', errorData);
        return res.status(response.status).json({ 
          error: 'Erro ao gerar URL de upload',
          details: errorData 
        });
      }

      const data = await response.json();
      uploadUrl = data.result.uploadURL;
      videoId = data.result.uid;

    } else {
      // Upload TUS para arquivos maiores que 200MB
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
        {
          method: 'POST',
          headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': apiToken,
            'Tus-Resumable': '1.0.0',
            'Upload-Length': uploadLength.toString(),
            'Upload-Metadata': uploadMetadata || `maxDurationSeconds ${btoa(maxDurationSeconds.toString())}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na API TUS do Cloudflare Stream:', errorData);
        return res.status(response.status).json({ 
          error: 'Erro ao gerar URL de upload TUS',
          details: errorData 
        });
      }

      uploadUrl = response.headers.get('Location');
      
      // Extrair videoId da URL de upload TUS
      const urlParts = uploadUrl.split('/');
      videoId = urlParts[urlParts.length - 1];
    }

    // Retornar informações do upload
    res.status(200).json({
      success: true,
      uploadUrl,
      videoId,
      customerCode: 'auto-detect', // Será detectado automaticamente no frontend
      uploadType: useBasicUpload ? 'basic' : 'tus',
      maxDurationSeconds,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

// Configuração para Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
