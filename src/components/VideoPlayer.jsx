import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Settings
} from 'lucide-react';

/**
 * Video Player integrado com Cloudflare Stream
 * Suporta controles profissionais e sync com timeline
 */
const VideoPlayer = ({ 
  videoId, 
  onTimeUpdate, 
  onDurationChange,
  currentTime,
  className = ''
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId) {
      setError('Nenhum vídeo selecionado');
      setIsLoading(false);
      return;
    }

    console.log('🎬 VideoPlayer: Loading video ID:', videoId);
    setIsLoading(true);
    setError(null);

    // Criar iframe do Cloudflare Stream com autoplay
    const iframe = document.createElement('iframe');
    const streamUrl = `https://customer-5dr3ublgoe3wg2wj.cloudflarestream.com/${videoId}/iframe?preload=auto&autoplay=false&muted=false&loop=false&controls=true`;
    console.log('🎬 Stream URL:', streamUrl);
    iframe.src = streamUrl;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;';
    iframe.allowFullscreen = true;
    iframe.loading = 'eager';

    // Limpar container anterior
    if (playerRef.current) {
      playerRef.current.innerHTML = '';
      playerRef.current.appendChild(iframe);
    }

    // Evento de carregamento do iframe
    iframe.onload = () => {
      console.log('✅ Iframe loaded successfully');
      setIsLoading(false);
      setError(null);
    };

    iframe.onerror = () => {
      console.error('❌ Iframe failed to load');
      setError('Falha ao carregar iframe do vídeo');
      setIsLoading(false);
    };

    // Stream Player API via postMessage (opcional - para controles avançados)
    const handleMessage = (event) => {
      if (event.origin !== 'https://customer-5dr3ublgoe3wg2wj.cloudflarestream.com') return;

      const data = event.data;
      console.log('📨 Message from Stream:', data);
      
      if (data.event === 'loaded') {
        setIsLoading(false);
      } else if (data.event === 'timeupdate') {
        if (onTimeUpdate) {
          onTimeUpdate(data.currentTime);
        }
      } else if (data.event === 'durationchange') {
        setDuration(data.duration);
        if (onDurationChange) {
          onDurationChange(data.duration);
        }
      } else if (data.event === 'play') {
        setIsPlaying(true);
      } else if (data.event === 'pause') {
        setIsPlaying(false);
      } else if (data.event === 'error') {
        setError('Erro ao carregar vídeo');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout de 10 segundos para carregamento
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        console.error('⚠️ Video loading timeout');
        setError('Timeout ao carregar vídeo. Verifique o video ID.');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadTimeout);
    };
  }, [videoId]);

  const sendCommand = (command, value = null) => {
    if (!playerRef.current) return;
    
    const iframe = playerRef.current.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(
      { event: command, value },
      'https://customer-5dr3ubl3goe3wg2wj.cloudflarestream.com'
    );
  };

  const togglePlay = () => {
    sendCommand(isPlaying ? 'pause' : 'play');
  };

  const handleSeek = (newTime) => {
    sendCommand('seek', newTime);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    sendCommand('volume', newVolume);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sendCommand('volume', newMuted ? 0 : volume);
  };

  const skipBackward = () => {
    handleSeek(Math.max(0, currentTime - 5));
  };

  const skipForward = () => {
    handleSeek(Math.min(duration, currentTime + 5));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoId) {
    return (
      <Card className={`bg-gray-950 border-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-12">
          <Settings className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">Selecione um take para visualizar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      ref={containerRef}
      className={`bg-gray-950 border-gray-800 overflow-hidden ${className}`}
    >
      {/* Player Container */}
      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando vídeo...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-red-400">
              <p className="text-lg mb-2">⚠️ {error}</p>
              <p className="text-sm text-gray-500">Video ID: {videoId}</p>
            </div>
          </div>
        )}

        <div ref={playerRef} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* Timeline Scrubber */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={([value]) => handleSeek(value)}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="text-gray-300 hover:text-white"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="text-gray-300 hover:text-white"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-xs mx-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-gray-300 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={([value]) => handleVolumeChange(value)}
              className="cursor-pointer"
            />
          </div>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoPlayer;
