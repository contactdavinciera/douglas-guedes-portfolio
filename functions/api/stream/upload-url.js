
// API endpoint para gerar URLs de upload direto para Cloudflare Stream
export const onRequestPost = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uploadLength, uploadMetadata, maxDurationSeconds = 3600 } = await request.json();

    // Validar parâmetros obrigatórios
    if (!uploadLength) {
      return new Response(JSON.stringify({ error: 'uploadLength é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Configurações do Cloudflare Stream - Lendo do KV Namespace
    const accountId = await env.ENV_VARS.get(\'CLOUDFLARE_ACCOUNT_ID\');
    const apiToken = await env.ENV_VARS.get(\'CLOUDFLARE_API_TOKEN\');
    const email = await env.ENV_VARS.get(\'CLOUDFLARE_EMAIL\');

    if (!accountId || !apiToken || !email) {
      console.error('Credenciais do Cloudflare Stream não configuradas no KV Namespace. accountId:', accountId, 'apiToken:', apiToken, 'email:', email);
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta: Variáveis de ambiente ausentes no KV Namespace',
        details: {
          accountId: accountId ? 'Configurado' : 'Não configurado',
          apiToken: apiToken ? 'Configurado' : 'Não configurado',
          email: email ? 'Configurado' : 'Não configurado',
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        console.error("Erro na API do Cloudflare Stream (status:", response.status, "):", errorData);
        return new Response(JSON.stringify({ 
          error: 'Erro ao gerar URL de upload',
          details: errorData 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        const errorText = await response.text();
        console.error("Erro na API TUS do Cloudflare Stream (resposta de texto):\n", errorText);
        return new Response(JSON.stringify({ 
          error: 'Erro ao gerar URL de upload TUS',
          details: errorText 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      uploadUrl = response.headers.get('Location');
      
      // Extrair videoId da URL de upload TUS
      const urlParts = uploadUrl.split('/');
      videoId = urlParts[urlParts.length - 1];
    }

    // Retornar informações do upload
    return new Response(JSON.stringify({
      success: true,
      uploadUrl,
      videoId,
      customerCode: 'auto-detect', // Será detectado automaticamente no frontend
      uploadType: useBasicUpload ? 'basic' : 'tus',
      maxDurationSeconds,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

