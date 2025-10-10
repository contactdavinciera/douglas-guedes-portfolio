import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Download, Settings, Monitor, Palette, Zap, Award, AlertCircle, ChevronDown, ChevronUp, Film, Maximize, Minimize } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProcessingControls from '../components/ProcessingControls';
import LUTLibrary from '../components/LUTLibrary';
import InteractiveTimeline from '../components/InteractiveTimeline';
import ClipOptionsPanel from '../components/ClipOptionsPanel';
import StreamUploader from '../components/StreamUploader';
import colorStudioApi from '../services/colorStudioApi';

const ColorStudio = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  console.log('ColorStudio: Componente carregado');
  const [streamVideo, setStreamVideo] = useState(null); // { videoId, customerCode, metadata, clips: [] }
  const [selectedLUT, setSelectedLUT] = useState(null);
  const [isHDRCapable, setIsHDRCapable] = useState(false);
  const [previewMode, setPreviewMode] = useState('auto'); // 'auto', 'advanced'
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingSettings, setProcessingSettings] = useState({});
  const [selectedClip, setSelectedClip] = useState(null);
  const [showClipOptions, setShowClipOptions] = useState(false);

  const containerRef = useRef(null);

  // Detectar capacidade HDR do dispositivo
  useEffect(() => {
    console.log('ColorStudio: useEffect para detecção de HDR acionado.');
    const checkHDRSupport = () => {
      const supportsP3 = window.matchMedia('(color-gamut: p3)').matches;
      const supportsHDR = window.matchMedia('(dynamic-range: high)').matches;
      setIsHDRCapable(supportsP3 || supportsHDR);
      console.log('ColorStudio: Capacidade HDR detectada:', supportsP3 || supportsHDR);
    };
    
    checkHDRSupport();
  }, []);



  // Manipular upload completo para Cloudflare Stream
  const handleUploadComplete = (result) => {
    console.log('ColorStudio: handleUploadComplete acionado com resultado:', result);
    setStreamVideo({
      ...result,
      clips: [{ 
        id: result.videoId, 
        name: "Clip Principal", 
        url: `https://customer-code.cloudflarestream.com/${result.videoId}/manifest/video.m3u8`, // URL do Cloudflare Stream
        raw_url: `https://customer-code.cloudflarestream.com/${result.videoId}/manifest/video.m3u8`, // Exemplo, ajustar conforme a necessidade
        client_lut_url: `https://customer-code.cloudflarestream.com/${result.videoId}/manifest/video.m3u8`, // Exemplo, ajustar conforme a necessidade
        graded_url: `https://customer-code.cloudflarestream.com/${result.videoId}/manifest/video.m3u8`, // Exemplo, ajustar conforme a necessidade
        duration: result.metadata.duration,
        resolution: `${result.metadata.width}x${result.metadata.height}`,
        codec: result.metadata.format,
        fps: 24 // Assumindo 24 FPS, ajustar se metadata tiver
      }]
    });
    
    // Detectar aspect ratio baseado nos metadados
    if (result.metadata) {
      const { width, height } = result.metadata;
      if (width && height) {
        const aspectRatio = width / height;
        if (aspectRatio > 2.3) setVideoAspectRatio('21:9');
        else if (aspectRatio > 1.7) setVideoAspectRatio('16:9');
        else if (aspectRatio > 1.2) setVideoAspectRatio('4:3');
        else if (aspectRatio < 0.8) setVideoAspectRatio('9:16');
        else setVideoAspectRatio('1:1');
        console.log('ColorStudio: Aspect ratio do vídeo detectado:', videoAspectRatio);
      }
      
      // Calcular preço baseado no formato
      const price = calculatePrice(result.metadata.format, result.metadata.duration);
      setEstimatedPrice(price);
      console.log('ColorStudio: Preço estimado calculado:', price);
    }
  };

  // Manipular progresso do upload
  const handleUploadProgress = (progress, uploadedBytes, totalBytes) => {
    // console.log('ColorStudio: Progresso de upload:', progress);
    setUploadProgress(progress);
  };

  // Manipular erro no upload
  const handleUploadError = (error) => {
    console.error('ColorStudio: Erro no upload:', error);
  };

  // Calcular preço baseado na complexidade
  const calculatePrice = (format, duration = 60, resolution = '4K') => {
    let basePrice = 150;
    
    const formatMultipliers = {
      'BRAW': 1.3,
      'RED R3D': 1.4,
      'ALEXA': 1.2,
      'Sony MXF': 1.2,
      'Cinema DNG': 1.5,
      'QuickTime': 1.0,
      'MP4': 1.0
    };
    
    const resolutionMultipliers = {
      '1080p': 0.7,
      '4K': 1.0,
      '6K': 1.3,
      '8K': 1.6
    };
    
    const formatMultiplier = formatMultipliers[format] || 1.0;
    const resMultiplier = resolutionMultipliers[resolution] || 1.0;
    const durationMultiplier = Math.max(duration / 60, 0.5);
    
    return Math.round(basePrice * formatMultiplier * resMultiplier * durationMultiplier);
  };



  // Manipular seleção de clip
  const handleClipSelect = (clip) => {
    console.log('ColorStudio: Clip selecionado:', clip);
    setSelectedClip(clip);
    setShowClipOptions(true);
  };

  // Manipular atualização de clip
  const handleClipUpdate = (updatedClip) => {
    console.log('ColorStudio: Clip atualizado:', updatedClip);
    if (streamVideo && streamVideo.clips) {
      const updatedClips = streamVideo.clips.map(clip => 
        clip.id === updatedClip.id ? updatedClip : clip
      );
      setStreamVideo({
        ...streamVideo,
        clips: updatedClips
      });
    }
    setSelectedClip(updatedClip);
  };

  // Fechar painel de opções do clip
  const handleCloseClipOptions = () => {
    setShowClipOptions(false);
    setSelectedClip(null);
  };

  const applyLUT = (lut) => {
    console.log('ColorStudio: Aplicando LUT:', lut.name);
    setSelectedLUT(lut);
    console.log(`Aplicando LUT: ${lut.name} em ${streamVideo?.metadata?.colorSpace || 'Unknown'} -> Rec.709`);
    
    // Em uma implementação real, isso enviaria uma requisição para aplicar o LUT
    // ao vídeo no Cloudflare Stream ou processaria localmente
  };



  const getVideoPlayerStyle = () => {
    const baseClasses = 'w-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 cinema-frame';
    
    if (isFullscreen) {
      return `${baseClasses} h-screen max-w-none`;
    }

    switch (videoAspectRatio) {
      case '21:9':
        return `${baseClasses} aspect-[21/9] max-w-6xl`;
      case '16:9':
        return `${baseClasses} aspect-video max-w-4xl`;
      case '4:3':
        return `${baseClasses} aspect-[4/3] max-w-3xl`;
      case '9:16':
        return `${baseClasses} aspect-[9/16] max-w-md`;
      case '1:1':
        return `${baseClasses} aspect-square max-w-2xl`;
      default:
        return `${baseClasses} aspect-video max-w-4xl`;
    }
  };

  const getComplexityColor = (format) => {
    switch (format.toLowerCase()) {
      case "braw":
      case "red r3d":
      case "cinema dng":
        return "text-red-400";
      case "alexa":
      case "sony mxf":
        return "text-yellow-400";
      case "quicktime":
      case "mp4":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  console.log('ColorStudio: Renderizando. streamVideo:', streamVideo ? 'presente' : 'ausente', 'isHDRCapable:', isHDRCapable);
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Color Studio Pro
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Sistema profissional de color grading com detecção automática de formatos
          </p>
          
          {/* Status Badges */}
          <div className="flex justify-center items-center space-x-4 mb-8 flex-wrap gap-2">
            <div className={`flex items-center px-3 py-1 rounded-full border ${
              isHDRCapable 
                ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
            }`}>
              <Monitor size={16} className="mr-2" />
              <span className="text-sm font-medium">
                {isHDRCapable ? 'HDR Disponível' : 'SDR Display'}
              </span>
            </div>
            <div className="flex items-center px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
              <Award size={16} className="text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-yellow-400">Dolby Vision Certified</span>
            </div>
            {streamVideo && (
              <div className="flex items-center px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                <Film size={16} className="text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-400">
                  {videoAspectRatio} • {streamVideo.metadata?.format}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center space-y-8">
          {/* Video Player Central */}
          <div className="w-full flex justify-center mb-8" ref={containerRef}>
            <div className={getVideoPlayerStyle()}>
              {streamVideo ? (
                <div className="relative w-full h-full">
                  <InteractiveTimeline
                    clips={streamVideo.clips || []}
                    onClipSelect={handleClipSelect}
                    selectedClipId={selectedClip?.id || null}
                    audioUrl={null} // Adicionar lógica para áudio se necessário
                    onAudioChange={(url) => console.log("Áudio alterado para:", url)}
                  />

                  {/* LUT Preview Overlay */}
                  {selectedLUT && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 z-10">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: selectedLUT.color }}
                        ></div>
                        <span className="text-sm font-medium">{selectedLUT.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-12">
                  <div className="bg-gray-800/50 rounded-full p-8 mb-6">
                    <Play size={64} className="text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Preview do Vídeo</h3>
                  <p className="text-lg mb-1">Faça upload de um arquivo para começar</p>
                  <p className="text-sm text-gray-500">Suporta: MP4, MOV, BRAW, R3D, ARI, MXF, DNG</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          {!streamVideo && (
            <div className="w-full max-w-4xl">
              <StreamUploader
                onUploadComplete={handleUploadComplete}
                onUploadProgress={handleUploadProgress}
                onUploadError={handleUploadError}
                maxDurationSeconds={3600}
                acceptedFormats={["video/*", ".braw", ".r3d", ".ari", ".mxf", ".dng"]}
                className="w-full"
              />
            </div>
          )}

          {/* File Info Cards */}
          {streamVideo && streamVideo.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{streamVideo.metadata.format}</div>
                <div className="text-sm text-gray-400">Formato</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">{streamVideo.metadata.colorSpace}</div>
                <div className="text-sm text-gray-400">Color Space</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {isHDRCapable ? 'HDR10' : 'Rec.709'}
                </div>
                <div className="text-sm text-gray-400">Saída</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">R$ {estimatedPrice}</div>
                <div className="text-sm text-gray-400">Preço Est.</div>
              </div>
            </div>
          )}

          {/* Processing Controls */}
          {streamVideo && (
            <ProcessingControls
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              fileFormat={streamVideo.metadata.format}
              colorSpace={streamVideo.metadata.colorSpace}
              isHDRCapable={isHDRCapable}
              onSettingsChange={(settings) => setProcessingSettings(settings)}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Button
              onClick={() => setShowLibrary(!showLibrary)}
              variant="outline"
              className="border-gray-600 hover:bg-gray-800/50 backdrop-blur-sm"
            >
              <Palette className="mr-2" size={18} />
              Biblioteca LUTs
              {showLibrary ? <ChevronUp className="ml-2" size={16} /> : <ChevronDown className="ml-2" size={16} />}
            </Button>

            {streamVideo && (
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                <Download className="mr-2" size={16} />
                Solicitar Orçamento
              </Button>
            )}
          </div>

          {/* LUT Library */}
          <LUTLibrary
            selectedLUT={selectedLUT}
            onLUTSelect={applyLUT}
            isVisible={showLibrary}
            onClose={() => setShowLibrary(false)}
          />

          {/* Clip Options Panel */}
          {showClipOptions && (
            <div className="w-full max-w-4xl">
              <ClipOptionsPanel
                clip={selectedClip}
                onUpdate={handleClipUpdate}
                onClose={handleCloseClipOptions}
                availableLuts={[
                  { id: 'cinematic', name: 'Cinematic Look' },
                  { id: 'vintage', name: 'Vintage Film' },
                  { id: 'modern', name: 'Modern Clean' },
                  { id: 'warm', name: 'Warm Tones' },
                  { id: 'cool', name: 'Cool Tones' }
                ]}
                projectType={isHDRCapable ? 'HDR' : 'SDR'}
              />
            </div>
          )}

          {/* Selected LUT Info */}
          {selectedLUT && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6 max-w-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: selectedLUT.color }}
                ></div>
                <p className="text-lg font-semibold text-blue-300">
                  {selectedLUT.name} Aplicado
                </p>
              </div>
              <p className="text-sm text-blue-400 text-center">
                Pipeline: ${streamVideo?.metadata?.colorSpace || 'Unknown'} → ${isHDRCapable ? 'HDR10/P3' : 'Rec.709'} → ${selectedLUT.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorStudio;

