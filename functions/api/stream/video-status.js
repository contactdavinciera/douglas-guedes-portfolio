// API endpoint para verificar status de upload e obter informações do vídeo
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId é obrigatório' });
    }

    // Configurações do Cloudflare Stream
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.CLOUDFLARE_EMAIL;

    if (!accountId || !apiToken || !email) {
      console.error('Credenciais do Cloudflare Stream não configuradas');
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    // Buscar informações do vídeo na API do Cloudflare Stream
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        method: 'GET',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiToken,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Vídeo não encontrado',
          videoId 
        });
      }

      const errorData = await response.text();
      console.error('Erro na API do Cloudflare Stream:', errorData);
      return res.status(response.status).json({ 
        error: 'Erro ao buscar informações do vídeo',
        details: errorData 
      });
    }

    const data = await response.json();
    const video = data.result;

    // Detectar customer code automaticamente das URLs de playback
    let customerCode = 'demo';
    if (video.playback?.hls) {
      const match = video.playback.hls.match(/customer-([^.]+)/);
      if (match) customerCode = match[1];
    }

    // Processar informações do vídeo
    const videoInfo = {
      videoId: video.uid,
      customerCode,
      status: video.status?.state || 'unknown',
      ready: video.readyToStream || false,
      duration: video.duration || 0,
      size: video.size || 0,
      created: video.created,
      modified: video.modified,
      metadata: {
        filename: video.meta?.name || 'unknown',
        format: detectFormat(video.meta?.name || ''),
        colorSpace: detectColorSpace(video.meta?.name || ''),
        width: video.input?.width || 0,
        height: video.input?.height || 0,
        isRaw: isRawFormat(video.meta?.name || '')
      },
      playback: {
        hls: video.playback?.hls || null,
        dash: video.playback?.dash || null
      },
      preview: video.preview || null,
      thumbnail: video.thumbnail || null,
      watermark: video.watermark || null
    };

    // Adicionar URLs de reprodução se o vídeo estiver pronto
    if (videoInfo.ready) {
        videoInfo.streamUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoInfo.videoId}`;
        videoInfo.iframeUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoInfo.videoId}/iframe`;
    }

    res.status(200).json({
      success: true,
      video: videoInfo
    });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

// Funções auxiliares para detectar formato e color space
function detectFormat(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const formats = {
    'braw': 'BRAW',
    'r3d': 'RED R3D',
    'ari': 'ALEXA',
    'mov': 'QuickTime',
    'mp4': 'MP4',
    'mxf': 'Sony MXF',
    'dng': 'Cinema DNG'
  };
  return formats[extension] || 'Unknown';
}

function detectColorSpace(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const colorSpaces = {
    'braw': 'Blackmagic Wide Gamut',
    'r3d': 'REDWideGamutRGB',
    'ari': 'LogC',
    'mov': 'Rec.709',
    'mp4': 'Rec.709',
    'mxf': 'S-Gamut3',
    'dng': 'Linear'
  };
  return colorSpaces[extension] || 'Unknown';
}

function isRawFormat(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const rawFormats = ['braw', 'r3d', 'ari', 'mxf', 'dng'];
  return rawFormats.includes(extension);
}
