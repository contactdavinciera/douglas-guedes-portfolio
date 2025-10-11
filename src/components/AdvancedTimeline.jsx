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
  Settings,
  GripVertical,
  Plus,
  Trash2,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';

const AdvancedTimeline = ({
  projectId,
  projectFormat = 'SDR',
  takes = [],
  onTakesReorder,
  onTakeSelect,
  selectedTakeId,
  onMarkerAdd,
  markers = [],
  userRole = 'client'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previewMode, setPreviewMode] = useState('RAW');
  const [draggedTakeId, setDraggedTakeId] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);

  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const totalDuration = takes.reduce((acc, take) => acc + (take.duration || 0), 0);

  const getCurrentTake = () => {
    let accumulatedTime = 0;
    for (const take of takes) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + take.duration) {
        return { ...take, startTime: accumulatedTime };
      }
      accumulatedTime += take.duration;
    }
    return null;
  };

  const currentTake = getCurrentTake();

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
    setIsMuted(vol === 0);
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

  const formatTimecode = (seconds, fps = 24) => {
    const totalFrames = Math.floor(seconds * fps);
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const secs = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = () => {
    if (!currentTake) return null;

    switch (previewMode) {
      case 'RAW':
        return currentTake.source_url;
      case 'CLIENT':
        return currentTake.client_preview_url || currentTake.source_url;
      case 'FINAL':
        return currentTake.graded_url || currentTake.source_url;
      default:
        return currentTake.source_url;
    }
  };

  const handleDragStart = (e, takeId) => {
    setDraggedTakeId(takeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTakeId) => {
    e.preventDefault();
    if (draggedTakeId === targetTakeId) return;

    const draggedIndex = takes.findIndex(t => t.id === draggedTakeId);
    const targetIndex = takes.findIndex(t => t.id === targetTakeId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTakes = [...takes];
    const [removed] = newTakes.splice(draggedIndex, 1);
    newTakes.splice(targetIndex, 0, removed);

    const reorderedTakes = newTakes.map((take, index) => ({
      ...take,
      order_index: index
    }));

    onTakesReorder && onTakesReorder(reorderedTakes);
    setDraggedTakeId(null);
  };

  const handleTimelineClick = (e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const clickTime = clickPercent * totalDuration;

    if (e.shiftKey && currentTake) {
      const fps = currentTake.fps || 24;
      const frame = Math.floor(clickTime * fps);
      onMarkerAdd && onMarkerAdd({
        take_id: currentTake.id,
        timecode: clickTime,
        frame_number: frame,
        type: 'note',
        category: 'general'
      });
    } else {
      handleSeek([clickTime]);
    }
  };

  const getTakeMarkers = (takeId) => {
    return markers.filter(m => m.take_id === takeId);
  };

  const getColorSpaceBadgeColor = (colorSpace) => {
    const colors = {
      'BRAW_FILM_GEN5': 'bg-orange-900/30 text-orange-400 border-orange-700',
      'ARRI_LOG_C3': 'bg-green-900/30 text-green-400 border-green-700',
      'RED_IPP2': 'bg-red-900/30 text-red-400 border-red-700',
      'SONY_SLOG3': 'bg-blue-900/30 text-blue-400 border-blue-700',
      'REC709': 'bg-gray-900/30 text-gray-400 border-gray-700',
      'REC2020': 'bg-purple-900/30 text-purple-400 border-purple-700'
    };
    return colors[colorSpace] || 'bg-gray-900/30 text-gray-400 border-gray-700';
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
        case '1':
          setPreviewMode('RAW');
          break;
        case '2':
          setPreviewMode('CLIENT');
          break;
        case '3':
          setPreviewMode('FINAL');
          break;
        case 'M':
          if (e.shiftKey) {
            setShowMarkers(!showMarkers);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, showMarkers, previewMode]);

  return (
    <div className="w-full space-y-4">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-0">
          <div className="relative bg-black aspect-video">
            {currentTake ? (
              <video
                ref={videoRef}
                src={getVideoUrl()}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Adicione takes à timeline para começar</p>
              </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant={previewMode === 'RAW' ? 'default' : 'secondary'}
                onClick={() => setPreviewMode('RAW')}
                className="text-xs"
              >
                RAW [1]
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'CLIENT' ? 'default' : 'secondary'}
                onClick={() => setPreviewMode('CLIENT')}
                className="text-xs"
              >
                Cliente + LUT [2]
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'FINAL' ? 'default' : 'secondary'}
                onClick={() => setPreviewMode('FINAL')}
                className="text-xs"
              >
                Grade Final [3]
              </Button>
            </div>

            {currentTake && (
              <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur">
                <p className="text-sm font-medium">{currentTake.name}</p>
                <div className="flex gap-3 text-xs text-gray-300 mt-1">
                  <span>{currentTake.resolution}</span>
                  <span>{currentTake.codec}</span>
                  <span className={`px-2 py-0.5 rounded border ${getColorSpaceBadgeColor(currentTake.color_space)}`}>
                    {currentTake.color_space}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimecode(currentTime, currentTake.fps)}
                </p>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded text-xs text-white backdrop-blur">
              Projeto: <span className="font-semibold text-blue-400">{projectFormat}</span>
            </div>
          </div>

          <div className="p-4 space-y-3 bg-gray-950">
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.01}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={skipBackward}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={skipForward}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMarkers(!showMarkers)}
                  className={showMarkers ? 'text-blue-400' : ''}
                >
                  {showMarkers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-white">Timeline</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                {takes.length} takes • {formatTime(totalDuration)}
              </Badge>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Take
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={timelineRef}
            className="relative h-32 bg-black rounded-lg overflow-x-auto border border-gray-800"
            onClick={handleTimelineClick}
          >
            <div className="flex h-full">
              {takes.map((take, index) => {
                const widthPercent = (take.duration / totalDuration) * 100;
                const isSelected = take.id === selectedTakeId;
                const takeMarkers = getTakeMarkers(take.id);

                return (
                  <div
                    key={take.id || index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, take.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, take.id)}
                    className={`
                      relative border-r border-gray-700 cursor-move
                      transition-all hover:bg-gray-800
                      ${isSelected ? 'bg-gray-800 ring-2 ring-blue-500' : 'bg-gray-900'}
                      ${draggedTakeId === take.id ? 'opacity-50' : ''}
                    `}
                    style={{ width: `${widthPercent}%`, minWidth: '100px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakeSelect && onTakeSelect(take);
                    }}
                  >
                    <div className="h-full p-2 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <GripVertical className="h-3 w-3 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate text-white">
                            {take.name || `Take ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {take.codec}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTakeSelect && onTakeSelect(take);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getColorSpaceBadgeColor(take.color_space)}`}
                        >
                          {take.color_space}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {formatTime(take.duration)}
                        </div>
                      </div>
                    </div>

                    {showMarkers && takeMarkers.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 flex items-end h-6 px-1 pb-1">
                        {takeMarkers.map((marker) => {
                          const markerPercent = (marker.timecode / take.duration) * 100;
                          const markerColors = {
                            'note': 'bg-blue-500',
                            'issue': 'bg-red-500',
                            'approval': 'bg-green-500',
                            'question': 'bg-yellow-500',
                            'change_request': 'bg-orange-500'
                          };

                          return (
                            <div
                              key={marker.id}
                              className={`absolute w-1 h-4 ${markerColors[marker.type]} rounded-t cursor-pointer hover:h-5 transition-all`}
                              style={{ left: `${markerPercent}%` }}
                              title={`${marker.type}: ${marker.text}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            >
              <div className="absolute -top-2 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              <div className="absolute -top-1 -left-6 bg-red-500 text-white text-xs px-1 rounded whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <div>
              {currentTake && (
                <span className="text-white">
                  Reproduzindo: <strong className="text-blue-400">{currentTake.name}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-4">
              <span>Modo: <strong className="text-white">{previewMode}</strong></span>
              <span>FPS: <strong className="text-white">{currentTake?.fps || 24}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div className="space-y-1">
              <p className="font-semibold text-white mb-2">Controles de Reprodução</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">Space</kbd> Play/Pause</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">←</kbd> -5s  |  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">→</kbd> +5s</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">M</kbd> Mute</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white mb-2">Modos de Visualização</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">1</kbd> RAW (Sem Correção)</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">2</kbd> Cliente + LUT</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">3</kbd> Grade Final do Colorista</p>
              <p><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">Shift+M</kbd> Toggle Markers  |  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white">Shift+Click</kbd> Add Marker</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTimeline;
