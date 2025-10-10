import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  Music,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';

const AudioManager = ({
  videoHasAudio = false,
  externalAudioUrl = null,
  onAudioChange,
  onVolumeChange,
  videoRef = null
}) => {
  const [audioSource, setAudioSource] = useState('video'); // 'video', 'external', 'none'
  const [externalAudio, setExternalAudio] = useState(externalAudioUrl);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInfo, setAudioInfo] = useState(null);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (externalAudioUrl) {
      setExternalAudio(externalAudioUrl);
      setAudioSource('external');
    }
  }, [externalAudioUrl]);

  // Sincronizar áudio externo com vídeo
  useEffect(() => {
    if (videoRef && audioRef.current && audioSource === 'external') {
      const video = videoRef.current;
      const audio = audioRef.current;

      const syncAudio = () => {
        if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
          audio.currentTime = video.currentTime;
        }
      };

      const handleVideoPlay = () => {
        audio.play();
        setIsPlaying(true);
      };

      const handleVideoPause = () => {
        audio.pause();
        setIsPlaying(false);
      };

      const handleVideoSeeked = () => {
        audio.currentTime = video.currentTime;
      };

      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
      video.addEventListener('seeked', handleVideoSeeked);
      video.addEventListener('timeupdate', syncAudio);

      return () => {
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
        video.removeEventListener('seeked', handleVideoSeeked);
        video.removeEventListener('timeupdate', syncAudio);
      };
    }
  }, [videoRef, audioSource]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/aac', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        alert('Formato de áudio não suportado. Use MP3, WAV, AAC ou OGG.');
        return;
      }

      // Criar URL do arquivo
      const url = URL.createObjectURL(file);
      setUploadedFile(file);
      setExternalAudio(url);
      setAudioSource('external');

      // Extrair informações do áudio
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioInfo({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          duration: audio.duration,
          type: file.type
        });
      });

      // Notificar componente pai
      onAudioChange && onAudioChange({
        source: 'external',
        url: url,
        file: file
      });
    }
  };

  const handleRemoveExternalAudio = () => {
    if (externalAudio && uploadedFile) {
      URL.revokeObjectURL(externalAudio);
    }
    setExternalAudio(null);
    setUploadedFile(null);
    setAudioInfo(null);
    setAudioSource('video');
    
    onAudioChange && onAudioChange({
      source: 'video',
      url: null,
      file: null
    });
  };

  const handleAudioSourceChange = (source) => {
    setAudioSource(source);
    
    if (videoRef && videoRef.current) {
      if (source === 'video') {
        videoRef.current.muted = false;
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else if (source === 'external') {
        videoRef.current.muted = true;
        if (audioRef.current && isPlaying) {
          audioRef.current.play();
        }
      } else if (source === 'none') {
        videoRef.current.muted = true;
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }

    onAudioChange && onAudioChange({
      source: source,
      url: source === 'external' ? externalAudio : null,
      file: source === 'external' ? uploadedFile : null
    });
  };

  const handleVolumeChange = (newVolume) => {
    const vol = newVolume[0];
    setVolume(vol);
    
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    
    if (videoRef && videoRef.current && audioSource === 'video') {
      videoRef.current.volume = vol;
    }

    setIsMuted(vol === 0);
    onVolumeChange && onVolumeChange(vol);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
    
    if (videoRef && videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio Manager
        </CardTitle>
        <CardDescription>
          Gerencie o áudio do seu projeto
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Audio Source Selection */}
        <div className="space-y-3">
          <Label>Audio Source</Label>
          
          <div className="grid gap-2">
            {/* Video Audio Option */}
            <button
              onClick={() => handleAudioSourceChange('video')}
              disabled={!videoHasAudio}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${audioSource === 'video' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!videoHasAudio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Video Audio</p>
                  <p className="text-sm text-gray-600">
                    {videoHasAudio 
                      ? 'Usar áudio original do vídeo' 
                      : 'Vídeo não possui áudio'
                    }
                  </p>
                </div>
                {audioSource === 'video' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>

            {/* External Audio Option */}
            <button
              onClick={() => externalAudio && handleAudioSourceChange('external')}
              disabled={!externalAudio}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${audioSource === 'external' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!externalAudio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">External Audio</p>
                  <p className="text-sm text-gray-600">
                    {externalAudio 
                      ? 'Usar áudio externo carregado' 
                      : 'Nenhum áudio externo carregado'
                    }
                  </p>
                </div>
                {audioSource === 'external' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>

            {/* No Audio Option */}
            <button
              onClick={() => handleAudioSourceChange('none')}
              className={`
                p-4 rounded-lg border-2 text-left transition-all cursor-pointer
                ${audioSource === 'none' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">No Audio</p>
                  <p className="text-sm text-gray-600">
                    Reproduzir sem áudio
                  </p>
                </div>
                {audioSource === 'none' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Upload External Audio */}
        <div className="space-y-3">
          <Label>Upload External Audio</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </Button>
            {externalAudio && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleRemoveExternalAudio}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {audioInfo && (
            <Alert>
              <Music className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{audioInfo.name}</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>{audioInfo.size}</span>
                    <span>{formatDuration(audioInfo.duration)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {audioInfo.type.split('/')[1].toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Volume Control */}
        {audioSource !== 'none' && (
          <div className="space-y-3">
            <Label>Volume Control</Label>
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
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
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
              
              <span className="text-sm font-medium w-12 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* External Audio Preview */}
        {audioSource === 'external' && externalAudio && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label>Audio Preview</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <p className="text-sm text-gray-600">
                Preview do áudio externo (sincronizado com vídeo)
              </p>
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        {externalAudio && (
          <audio
            ref={audioRef}
            src={externalAudio}
            preload="auto"
          />
        )}

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {audioSource === 'external' 
              ? 'O áudio externo será sincronizado automaticamente com o vídeo durante a reprodução.'
              : audioSource === 'video'
              ? 'Usando o áudio original do vídeo.'
              : 'Reprodução sem áudio.'
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AudioManager;

