import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

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
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gerar URL do iframe do Cloudflare Stream
  const getStreamUrl = () => {
    if (!videoId || !customerCode) return null;
    
    const params = new URLSearchParams({
      autoplay: autoplay ? 'true' : 'false',
      controls: controls ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
      loop: loop ? 'true' : 'false',
      primaryColor: primaryColor.replace('#', ''),
      letterboxColor: letterboxColor === 'transparent' ? 'transparent' : letterboxColor.replace('#', '')
    });

    return `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe?${params.toString()}`;
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
    if (!videoId || !customerCode) return;

    const initializePlayer = () => {
      if (window.Stream && iframeRef.current) {
        try {
          const streamPlayer = window.Stream(iframeRef.current);
          setPlayer(streamPlayer);
          setIsLoading(false);

          // Event listeners
          streamPlayer.addEventListener('loadedmetadata', () => {
            setDuration(streamPlayer.duration);
            onPlayerReady?.(streamPlayer);
          });

          streamPlayer.addEventListener('play', () => {
            setIsPlaying(true);
          });

          streamPlayer.addEventListener('pause', () => {
            setIsPlaying(false);
          });

          streamPlayer.addEventListener('ended', () => {
            setIsPlaying(false);
            onVideoEnd?.(streamPlayer);
          });

          streamPlayer.addEventListener('timeupdate', () => {
            setCurrentTime(streamPlayer.currentTime);
            onTimeUpdate?.(streamPlayer.currentTime, streamPlayer.duration);
          });

          streamPlayer.addEventListener('volumechange', () => {
            setIsMuted(streamPlayer.muted);
          });

          streamPlayer.addEventListener('error', (event) => {
            console.error('Stream player error:', event);
            setError('Erro ao carregar o vídeo');
            setIsLoading(false);
          });

          // Configurações iniciais
          streamPlayer.muted = muted;
          streamPlayer.loop = loop;

        } catch (err) {
          console.error('Erro ao inicializar Stream player:', err);
          setError('Erro ao inicializar o player');
          setIsLoading(false);
        }
      }
    };

    // Carregar o SDK do Cloudflare Stream se não estiver carregado
    if (!window.Stream) {
      const script = document.createElement('script');
      script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
      script.onload = initializePlayer;
      script.onerror = () => {
        setError('Erro ao carregar o SDK do Cloudflare Stream');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        // Cleanup se necessário
      }
    };
  }, [videoId, customerCode]);

  // Controles do player
  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play().catch(() => {
        // Se falhar, tentar com muted
        player.muted = true;
        player.play();
      });
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !player.muted;
  };

  const seekTo = (time) => {
    if (!player) return;
    player.currentTime = time;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const restart = () => {
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
        className="w-full h-full"
        style={{ border: 'none' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
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
