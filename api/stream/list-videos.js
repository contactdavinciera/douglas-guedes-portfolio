// API endpoint para listar vídeos do usuário no Cloudflare Stream
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
    const { 
      page = 1, 
      limit = 20, 
      status = 'all',
      search = '',
      sortBy = 'created',
      sortOrder = 'desc'
    } = req.query;

    // Configurações do Cloudflare Stream
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.CLOUDFLARE_EMAIL;

    if (!accountId || !apiToken || !email) {
      console.error('Credenciais do Cloudflare Stream não configuradas');
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    // Construir parâmetros da query
    const queryParams = new URLSearchParams({
      per_page: Math.min(parseInt(limit), 100).toString(),
      page: Math.max(parseInt(page), 1).toString()
    });

    // Adicionar filtros se especificados
    if (search) {
      queryParams.append('search', search);
    }

    // Buscar vídeos na API do Cloudflare Stream
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?${queryParams.toString()}`,
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
      const errorData = await response.text();
      console.error('Erro na API do Cloudflare Stream:', errorData);
      return res.status(response.status).json({ 
        error: 'Erro ao buscar lista de vídeos',
        details: errorData 
      });
    }

    const data = await response.json();
    const videos = data.result || [];
    const resultInfo = data.result_info || {};

    // Processar lista de vídeos
    const processedVideos = videos
      .filter(video => {
        // Filtrar por status se especificado
        if (status !== 'all') {
          const videoStatus = video.status?.state || 'unknown';
          return videoStatus === status;
        }
        return true;
      })
      .map(video => {
        // Detectar customer code automaticamente
        let customerCode = 'demo';
        if (video.playback?.hls) {
          const match = video.playback.hls.match(/customer-([^.]+)/);
          if (match) customerCode = match[1];
        }

        return {
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
        thumbnail: video.thumbnail || null,
        preview: video.preview || null,
        streamUrl: video.readyToStream 
          ? `https://customer-${customerCode}.cloudflarestream.com/${video.uid}`
          : null,
        iframeUrl: video.readyToStream 
          ? `https://customer-${customerCode}.cloudflarestream.com/${video.uid}/iframe`
          : null
        };
      })
      .sort((a, b) => {
        // Aplicar ordenação
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'created' || sortBy === 'modified') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

    // Calcular estatísticas
    const stats = {
      total: processedVideos.length,
      ready: processedVideos.filter(v => v.ready).length,
      processing: processedVideos.filter(v => v.status === 'inprogress').length,
      error: processedVideos.filter(v => v.status === 'error').length,
      totalSize: processedVideos.reduce((sum, v) => sum + v.size, 0),
      totalDuration: processedVideos.reduce((sum, v) => sum + v.duration, 0)
    };

    res.status(200).json({
      success: true,
      videos: processedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: resultInfo.total_count || processedVideos.length,
        totalPages: Math.ceil((resultInfo.total_count || processedVideos.length) / parseInt(limit))
      },
      stats,
      filters: {
        status,
        search,
        sortBy,
        sortOrder
      }
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
