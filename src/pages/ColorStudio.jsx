import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Download, Settings, Monitor, Palette, Zap, Award, AlertCircle, ChevronDown, ChevronUp, Film, Maximize, Minimize } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProcessingControls from '../components/ProcessingControls';
import LUTLibrary from '../components/LUTLibrary';
import colorStudioApi from '../services/colorStudioApi';

const ColorStudio = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileFormat, setFileFormat] = useState(null);
  const [colorSpace, setColorSpace] = useState(null);
  const [selectedLUT, setSelectedLUT] = useState(null);
  const [isHDRCapable, setIsHDRCapable] = useState(false);
  const [previewMode, setPreviewMode] = useState('auto'); // 'auto', 'advanced'
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Detectar capacidade HDR do dispositivo
  useEffect(() => {
    const checkHDRSupport = () => {
      const supportsP3 = window.matchMedia('(color-gamut: p3)').matches;
      const supportsHDR = window.matchMedia('(dynamic-range: high)').matches;
      setIsHDRCapable(supportsP3 || supportsHDR);
    };
    
    checkHDRSupport();
  }, []);



  // Detectar formato do arquivo
  const detectFileFormat = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const formats = {
      'braw': { format: 'BRAW', colorSpace: 'Blackmagic Wide Gamut', needsTransform: true, complexity: 'high' },
      'r3d': { format: 'RED R3D', colorSpace: 'REDWideGamutRGB', needsTransform: true, complexity: 'high' },
      'ari': { format: 'ALEXA', colorSpace: 'LogC', needsTransform: true, complexity: 'high' },
      'mov': { format: 'QuickTime', colorSpace: 'Rec.709', needsTransform: false, complexity: 'medium' },
      'mp4': { format: 'MP4', colorSpace: 'Rec.709', needsTransform: false, complexity: 'low' },
      'mxf': { format: 'Sony MXF', colorSpace: 'S-Gamut3', needsTransform: true, complexity: 'high' },
      'dng': { format: 'Cinema DNG', colorSpace: 'Linear', needsTransform: true, complexity: 'high' }
    };
    
    return formats[extension] || { format: 'Unknown', colorSpace: 'Unknown', needsTransform: false, complexity: 'medium' };
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const detectedFormat = detectFileFormat(file);
      setFileFormat(detectedFormat.format);
      setColorSpace(detectedFormat.colorSpace);
      
      // Criar URL do vídeo para preview
      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current;
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          // Definir aspect ratio com mais precisão
          if (aspectRatio > 1.7) {
            setVideoAspectRatio('21:9');
          } else if (aspectRatio > 1.5) {
            setVideoAspectRatio('16:9');
          } else if (aspectRatio > 1.2) {
            setVideoAspectRatio('4:3');
          } else if (aspectRatio < 0.7) {
            setVideoAspectRatio('9:16');
          } else {
            setVideoAspectRatio('1:1');
          }

          // Salvar metadados do vídeo
          setVideoMetadata({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            aspectRatio: aspectRatio.toFixed(2)
          });
        };
      }
      
      const estimatedDuration = 60;
      const price = calculatePrice(detectedFormat.format, estimatedDuration);
      setEstimatedPrice(price);
      
      setIsProcessing(true);
      
      // Simular análise de arquivo
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        setIsProcessing(false);
      }
    }
  };

  const applyLUT = (lut) => {
    setSelectedLUT(lut);
    console.log(`Aplicando LUT: ${lut.name} em ${colorSpace} -> Rec.709`);
    
    // Simular aplicação de LUT com feedback visual
    if (videoRef.current) {
      videoRef.current.style.filter = `hue-rotate(${Math.random() * 30 - 15}deg) saturate(${0.8 + Math.random() * 0.4}) contrast(${0.9 + Math.random() * 0.2})`;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getVideoPlayerStyle = () => {
    const baseClasses = 'w-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300';
    
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
    const detectedFormat = detectFileFormat({ name: `test.${format.toLowerCase()}` });
    switch (detectedFormat.complexity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

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
            {uploadedFile && (
              <div className="flex items-center px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                <Film size={16} className="text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-400">
                  {videoAspectRatio} • {videoMetadata?.width}x{videoMetadata?.height}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center space-y-8">
          {/* Video Player Central */}
          <div className="w-full flex justify-center" ref={containerRef}>
            <div className={getVideoPlayerStyle()}>
              {uploadedFile ? (
                <div className="relative group">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full object-cover"
                    poster="/api/placeholder/800/450"
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                  
                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>

                  {/* LUT Preview Overlay */}
                  {selectedLUT && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
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
          <div className="flex flex-col items-center space-y-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-4 text-lg"
              disabled={isProcessing}
            >
              <Upload className="mr-3" size={20} />
              {isProcessing ? 'Analisando...' : uploadedFile ? 'Trocar Arquivo' : 'Upload Vídeo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.braw,.r3d,.ari,.mxf,.dng"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-300">Analisando formato e metadados...</span>
              </div>
            )}
          </div>

          {/* File Info Cards */}
          {uploadedFile && !isProcessing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{fileFormat}</div>
                <div className="text-sm text-gray-400">Formato</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">{colorSpace}</div>
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
          <ProcessingControls
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            fileFormat={fileFormat}
            colorSpace={colorSpace}
            isHDRCapable={isHDRCapable}
            onSettingsChange={(settings) => console.log('Processing settings:', settings)}
          />

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

            {uploadedFile && (
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

          {/* Selected LUT Info */}
          {selectedLUT && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6 max-w-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <div 
                  className="w-4 h-4 rounded-full mr-3" 
                  style={{ backgroundColor: selectedLUT.color }}
                ></div>
                <p className="text-lg font-semibold text-blue-300">
                  {selectedLUT.name} Aplicado
                </p>
              </div>
              <p className="text-sm text-blue-400 text-center">
                Pipeline: {colorSpace} → {isHDRCapable ? 'HDR10/P3' : 'Rec.709'} → {selectedLUT.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorStudio;
