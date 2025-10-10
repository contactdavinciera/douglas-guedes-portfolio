import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const InteractiveTimeline = ({
  clips = [],
  onClipSelect,
  selectedClipId,
  audioUrl = null,
  onAudioChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState('RAW'); // RAW, CLIENT_LUT, GRADED
  
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  // Calcular duração total do projeto
  const totalDuration = clips.reduce((acc, clip) => acc + (clip.duration || 0), 0);

  // Encontrar clip atual baseado no tempo
  const getCurrentClip = () => {
    let accumulatedTime = 0;
    for (const clip of clips) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + clip.duration) {
        return { ...clip, startTime: accumulatedTime };
      }
      accumulatedTime += clip.duration;
    }
    return null;
  };

  const currentClip = getCurrentClip();

  // Controles de reprodução
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (newTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const handleVolumeChange = (newVolume) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(currentTime + 5, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(currentTime - 5, 0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obter URL do vídeo baseado no modo de visualização
  const getVideoUrl = () => {
    if (!currentClip) return null;
    
    switch (viewMode) {
      case 'RAW':
        return currentClip.raw_url || currentClip.url;
      case 'CLIENT_LUT':
        return currentClip.client_lut_url || currentClip.url;
      case 'GRADED':
        return currentClip.graded_url || currentClip.url;
      default:
        return currentClip.url;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skipBackward();
          break;
        case 'ArrowRight':
          skipForward();
          break;
        case 'm':
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime]);

  return (
    <div className="w-full space-y-4">
      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-black aspect-video">
            {currentClip ? (
              <video
                ref={videoRef}
                src={getVideoUrl()}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p>Selecione um clip para visualizar</p>
              }
            )}

            {/* View Mode Selector */}
            <div className="absolute top-4 right-4 flex gap-2">
              {['RAW', 'CLIENT_LUT', 'GRADED'].map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'secondary'}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.replace('_', ' ')}
                </Button>
              ))}
            </div>

            {/* Current Clip Info */}
            {currentClip && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded">
                <p className="text-sm font-medium">{currentClip.name}</p>
                <p className="text-xs text-gray-300">
                  {currentClip.resolution} • {currentClip.codec}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-3">
            {/* Timeline Slider */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={skipBackward}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={skipForward}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={toggleMute}>
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              <Button size="icon" variant="ghost">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline with Clips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Timeline</span>
            <Badge variant="secondary">
              {clips.length} clips • {formatTime(totalDuration)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={timelineRef}
            className="relative h-24 bg-gray-100 rounded overflow-x-auto"
          >
            <div className="flex h-full">
              {clips.map((clip, index) => {
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected = clip.id === selectedClipId;
                
                return (
                  <div
                    key={clip.id || index}
                    className={`
                      relative border-r border-gray-300 cursor-pointer
                      transition-all hover:bg-blue-100
                      ${isSelected ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-white'}
                    `}
                    style={{ width: `${widthPercent}%`, minWidth: '60px' }}
                    onClick={() => onClipSelect && onClipSelect(clip)}
                  >
                    {/* Clip Thumbnail */}
                    <div className="h-full p-2 flex flex-col justify-between">
                      <div className="text-xs font-medium truncate">
                        {clip.name || `Clip ${index + 1}`}
                      </div>
                      
                      {/* LUT Indicator */}
                      {clip.selected_lut && (
                        <Badge variant="outline" className="text-xs">
                          {clip.selected_lut}
                        </Badge>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {formatTime(clip.duration)}
                      </div>
                    </div>

                    {/* Settings Icon */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipSelect && onClipSelect(clip);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>

                    {/* Markers */}
                    {clip.markers && clip.markers.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>

          {/* Timeline Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              {currentClip && (
                <span>
                  Reproduzindo: <strong>{currentClip.name}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-4">
              <span>Modo: <strong>{viewMode}</strong></span>
              <span>FPS: <strong>{currentClip?.fps || 24}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex gap-6 text-xs text-gray-600">
            <span><kbd className="px-2 py-1 bg-white rounded">Space</kbd> Play/Pause</span>
            <span><kbd className="px-2 py-1 bg-white rounded">←</kbd> -5s</span>
            <span><kbd className="px-2 py-1 bg-white rounded">→</kbd> +5s</span>
            <span><kbd className="px-2 py-1 bg-white rounded">M</kbd> Mute</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveTimeline;

