import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { CORS_CONFIG, checkCORSIssues, generateOptimizedIframeUrl } from '../services/corsConfig';

console.log('CloudflareStreamPlayer: Componente carregado');

const CloudflareStreamPlayer = ({
  videoId,
  customerCode,
  onPlayerReady,
  onVideoEnd,
  onTimeUpdate,
  className = "",
  aspectRatio = "16:9",
  autoplay = false,
  controls = true,
  muted = false,
  loop = false,
  primaryColor = "#3b82f6",
  letterboxColor = "transparent"
}) => {
  console.log('CloudflareStreamPlayer: Renderizando com videoId:', videoId, 'customerCode:', customerCode);
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gerar URL do iframe do Cloudflare Stream com configurações otimizadas
  const getStreamUrl = () => {
    console.log('CloudflareStreamPlayer: Gerando URL do Stream para videoId:', videoId);
    if (!videoId) {
      console.log('CloudflareStreamPlayer: videoId ausente. Não é possível gerar URL.');
      return null;
    }
    
    // Usar customer code da configuração se não fornecido
    const finalCustomerCode = customerCode || CORS_CONFIG.cloudflareStream.customerCode;
    
    const options = {
      autoplay: autoplay ? 'true' : 'false',
      controls: controls ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
      loop: loop ? 'true' : 'false',
      primaryColor: primaryColor.replace('#', ''),
      letterboxColor: letterboxColor === 'transparent' ? 'transparent' : letterboxColor.replace('#', '')
    };

    const url = generateOptimizedIframeUrl(videoId, options);
    console.log('CloudflareStreamPlayer: URL do Stream gerada:', url);
    return url;
  };

  // Obter classes CSS baseadas no aspect ratio
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '21:9':
        return 'aspect-[21/9]';
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      case '9:16':
        return 'aspect-[9/16]';
      case '1:1':
        return 'aspect-square';
      default:
        return 'aspect-video';
    }
  };

  // Inicializar o player quando o iframe carregar
  useEffect(() => {
    console.log('CloudflareStreamPlayer: useEffect acionado. videoId:', videoId, 'customerCode:', customerCode);
    if (!videoId) {
      console.log('CloudflareStreamPlayer: videoId ausente no useEffect. Abortando inicialização.');
      return;
    }

    // Verificar problemas de CORS
    const checkCORS = async () => {
      try {
        const corsCheck = await checkCORSIssues(videoId);
        if (corsCheck.hasCORSIssue) {
          console.warn('CloudflareStreamPlayer: Possível problema de CORS detectado:', corsCheck);
        }
      } catch (error) {
        console.warn('CloudflareStreamPlayer: Erro ao verificar CORS:', error);
      }
    };

    checkCORS();

    const initializePlayer = () => {
      console.log('CloudflareStreamPlayer: Tentando inicializar o player. window.Stream:', !!window.Stream, 'iframeRef.current:', !!iframeRef.current);
      if (window.Stream && iframeRef.current) {
        try {
          const streamPlayer = window.Stream(iframeRef.current);
          setPlayer(streamPlayer);
          setIsLoading(false);
          console.log('CloudflareStreamPlayer: Player inicializado com sucesso.');

          // Event listeners
          streamPlayer.addEventListener('loadedmetadata', () => {
            setDuration(streamPlayer.duration);
            onPlayerReady?.(streamPlayer);
            console.log('CloudflareStreamPlayer: Evento loadedmetadata. Duração:', streamPlayer.duration);
          });

          streamPlayer.addEventListener('play', () => {
            setIsPlaying(true);
            console.log('CloudflareStreamPlayer: Evento play.');
          });

          streamPlayer.addEventListener('pause', () => {
            setIsPlaying(false);
            console.log('CloudflareStreamPlayer: Evento pause.');
          });

          streamPlayer.addEventListener('ended', () => {
            setIsPlaying(false);
            onVideoEnd?.(streamPlayer);
            console.log('CloudflareStreamPlayer: Evento ended.');
          });

          streamPlayer.addEventListener('timeupdate', () => {
            setCurrentTime(streamPlayer.currentTime);
            onTimeUpdate?.(streamPlayer.currentTime, streamPlayer.duration);
            // console.log('CloudflareStreamPlayer: Evento timeupdate. Tempo atual:', streamPlayer.currentTime);
          });

          streamPlayer.addEventListener('volumechange', () => {
            setIsMuted(streamPlayer.muted);
            console.log('CloudflareStreamPlayer: Evento volumechange. Muted:', streamPlayer.muted);
          });

          streamPlayer.addEventListener('error', (event) => {
            console.error('CloudflareStreamPlayer: Erro do player Stream:', event);
            setError('Erro ao carregar o vídeo');
            setIsLoading(false);
          });

          // Configurações iniciais
          streamPlayer.muted = muted;
          streamPlayer.loop = loop;
          console.log('CloudflareStreamPlayer: Configurações iniciais aplicadas. Muted:', muted, 'Loop:', loop);

        } catch (err) {
          console.error('CloudflareStreamPlayer: Erro ao inicializar Stream player:', err);
          setError('Erro ao inicializar o player');
          setIsLoading(false);
        }
      }
    };

    // Carregar o SDK do Cloudflare Stream se não estiver carregado
    if (!window.Stream) {
      console.log('CloudflareStreamPlayer: SDK do Cloudflare Stream não carregado. Carregando...');
      const script = document.createElement('script');
      script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
      script.onload = initializePlayer;
      script.onerror = () => {
        console.error('CloudflareStreamPlayer: Erro ao carregar o SDK do Cloudflare Stream.');
        setError('Erro ao carregar o SDK do Cloudflare Stream');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('CloudflareStreamPlayer: SDK do Cloudflare Stream já carregado. Inicializando player diretamente.');
      initializePlayer();
    }

    return () => {
      if (player) {
        console.log('CloudflareStreamPlayer: Função de limpeza do useEffect.');
        // Cleanup se necessário
      }
    };
  }, [videoId, customerCode]);

  // Controles do player
  const togglePlay = () => {
    console.log('CloudflareStreamPlayer: togglePlay acionado. isPlaying:', isPlaying);
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play().catch((e) => {
        console.warn('CloudflareStreamPlayer: Falha ao reproduzir automaticamente, tentando com muted:', e);
        // Se falhar, tentar com muted
        player.muted = true;
        player.play();
      });
    }
  };

  const toggleMute = () => {
    console.log('CloudflareStreamPlayer: toggleMute acionado. isMuted antes:', isMuted);
    if (!player) return;
    player.muted = !player.muted;
  };

  const seekTo = (time) => {
    console.log('CloudflareStreamPlayer: seekTo acionado. Tempo:', time);
    if (!player) return;
    player.currentTime = time;
  };

  const toggleFullscreen = () => {
    console.log('CloudflareStreamPlayer: toggleFullscreen acionado. isFullscreen antes:', isFullscreen);
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const restart = () => {
    console.log('CloudflareStreamPlayer: restart acionado.');
    if (!player) return;
    player.currentTime = 0;
    player.play();
  };

  // Formatação de tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoId || !customerCode) {
    console.log('CloudflareStreamPlayer: Renderizando estado sem vídeo/customerCode.');
    return (
      <div className={`${getAspectRatioClasses()} ${className} bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <Play size={48} className="mx-auto mb-4" />
          <p>Nenhum vídeo carregado</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('CloudflareStreamPlayer: Renderizando estado de erro:', error);
    return (
      <div className={`${getAspectRatioClasses()} ${className} bg-gray-900 rounded-xl border border-red-500 flex items-center justify-center`}>
        <div className="text-center text-red-400">
          <p className="mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('CloudflareStreamPlayer: Renderizando player com iframe. isLoading:', isLoading);
  return (
    <div className={`${getAspectRatioClasses()} ${className} relative group bg-gray-900 rounded-xl overflow-hidden border border-gray-700`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Cloudflare Stream iframe */}
      <iframe
        ref={iframeRef}
        src={getStreamUrl()}
        className="w-full h-full video-content"
        style={{ border: 'none' }}
        allow={CORS_CONFIG.cloudflareStream.iframeAttributes.allow}
        allowFullScreen={CORS_CONFIG.cloudflareStream.iframeAttributes.allowFullScreen}
        referrerPolicy={CORS_CONFIG.cloudflareStream.iframeAttributes.referrerPolicy}
        title="Cloudflare Stream Player"
      />

      {/* Custom controls overlay */}
      {!isLoading && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          {/* Top controls */}
          <div className="absolute top-4 right-4 flex space-x-2 pointer-events-auto">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/70 rounded-lg hover:bg-black/90 transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            {/* Progress bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-600 rounded-full h-1 cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const percent = (e.clientX - rect.left) / rect.width;
                     seekTo(percent * duration);
                   }}>
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-150"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="p-2 bg-black/70 rounded-lg hover:bg-black/90 transition-colors"
                  title={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                  onClick={restart}
                  className="p-2 bg-black/70 rounded-lg hover:bg-black/90 transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw size={20} />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2 bg-black/70 rounded-lg hover:bg-black/90 transition-colors"
                  title={isMuted ? "Ativar som" : "Silenciar"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <div className="text-sm text-white bg-black/70 px-3 py-1 rounded-lg">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudflareStreamPlayer;

