import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Download, Settings, Monitor, Palette, Zap, Award, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
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
  const fileInputRef = useRef(null);

  // Detectar capacidade HDR do dispositivo
  useEffect(() => {
    const checkHDRSupport = () => {
      // Verifica suporte a P3 color gamut (indicativo de HDR)
      const supportsP3 = window.matchMedia('(color-gamut: p3)').matches;
      const supportsHDR = window.matchMedia('(dynamic-range: high)').matches;
      setIsHDRCapable(supportsP3 || supportsHDR);
    };
    
    checkHDRSupport();
  }, []);

  // Biblioteca de LUTs categorizados
  const lutLibrary = {
    cinema: [
      { id: 'blockbuster', name: 'Blockbuster', description: 'Estilo Hollywood épico' },
      { id: 'indie', name: 'Indie Film', description: 'Look cinematográfico independente' },
      { id: 'noir', name: 'Film Noir', description: 'Alto contraste, sombras dramáticas' },
      { id: 'thriller', name: 'Thriller', description: 'Tons frios, atmosfera tensa' }
    ],
    commercial: [
      { id: 'clean', name: 'Clean & Bright', description: 'Limpo e vibrante para comerciais' },
      { id: 'corporate', name: 'Corporate', description: 'Profissional e confiável' },
      { id: 'fashion', name: 'Fashion', description: 'Cores saturadas, pele perfeita' },
      { id: 'food', name: 'Food & Beverage', description: 'Cores apetitosas e quentes' }
    ],
    social: [
      { id: 'instagram-warm', name: 'Instagram Warm', description: 'Tons quentes para redes sociais' },
      { id: 'instagram-cool', name: 'Instagram Cool', description: 'Tons frios modernos' },
      { id: 'vintage', name: 'Vintage', description: 'Look retrô nostálgico' },
      { id: 'moody', name: 'Moody', description: 'Atmosfera dramática e escura' }
    ],
    special: [
      { id: 'teal-orange', name: 'Teal & Orange', description: 'Clássico contraste complementar' },
      { id: 'bleach-bypass', name: 'Bleach Bypass', description: 'Alto contraste, cores dessaturadas' },
      { id: 'desaturated', name: 'Desaturated', description: 'Cores suaves e naturais' },
      { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neons vibrantes, futuro distópico' }
    ]
  };

  // Detectar formato do arquivo
  const detectFileFormat = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const formats = {
      'braw': { format: 'BRAW', colorSpace: 'Blackmagic Wide Gamut', needsTransform: true },
      'r3d': { format: 'RED R3D', colorSpace: 'REDWideGamutRGB', needsTransform: true },
      'ari': { format: 'ALEXA', colorSpace: 'LogC', needsTransform: true },
      'mov': { format: 'QuickTime', colorSpace: 'Rec.709', needsTransform: false },
      'mp4': { format: 'MP4', colorSpace: 'Rec.709', needsTransform: false },
      'mxf': { format: 'Sony MXF', colorSpace: 'S-Gamut3', needsTransform: true },
      'dng': { format: 'Cinema DNG', colorSpace: 'Linear', needsTransform: true }
    };
    
    return formats[extension] || { format: 'Unknown', colorSpace: 'Unknown', needsTransform: false };
  };

  // Calcular preço baseado na complexidade
  const calculatePrice = (format, duration = 60, resolution = '4K') => {
    let basePrice = 150; // Preço base para 1 minuto em 4K
    
    // Multiplicadores por formato
    const formatMultipliers = {
      'BRAW': 1.3,
      'RED R3D': 1.4,
      'ALEXA': 1.2,
      'Sony MXF': 1.2,
      'Cinema DNG': 1.5,
      'QuickTime': 1.0,
      'MP4': 1.0
    };
    
    // Multiplicadores por resolução
    const resolutionMultipliers = {
      '1080p': 0.7,
      '4K': 1.0,
      '6K': 1.3,
      '8K': 1.6
    };
    
    const formatMultiplier = formatMultipliers[format] || 1.0;
    const resMultiplier = resolutionMultipliers[resolution] || 1.0;
    const durationMultiplier = Math.max(duration / 60, 0.5); // Mínimo 30 segundos
    
    return Math.round(basePrice * formatMultiplier * resMultiplier * durationMultiplier);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const detectedFormat = detectFileFormat(file);
      setFileFormat(detectedFormat.format);
      setColorSpace(detectedFormat.colorSpace);
      
      // Simular análise de duração (em produção seria extraído dos metadados)
      const estimatedDuration = 60; // segundos
      const price = calculatePrice(detectedFormat.format, estimatedDuration);
      setEstimatedPrice(price);
      
      setIsProcessing(true);
      // Simular processamento
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const applyLUT = (lut) => {
    setSelectedLUT(lut);
    // Aqui seria aplicado o LUT via WebGL shaders
    console.log(`Aplicando LUT: ${lut.name} em ${colorSpace} -> Rec.709`);
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
          
          {/* HDR Badge */}
          <div className="flex justify-center items-center space-x-4 mb-8">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Upload className="mr-3" size={24} />
                Upload & Análise
              </h2>
              
              {!uploadedFile ? (
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Clique para fazer upload do seu vídeo</p>
                  <p className="text-sm text-gray-400">
                    Suporta: BRAW, R3D, ALEXA, Sony MXF, Cinema DNG, MOV, MP4
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Arquivo Detectado:</h3>
                    <p className="text-sm text-gray-300">{uploadedFile.name}</p>
                  </div>
                  
                  {isProcessing ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3">Analisando formato e metadados...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-1">Formato</h4>
                        <p className="text-blue-400">{fileFormat}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-1">Color Space</h4>
                        <p className="text-purple-400">{colorSpace}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-1">Saída</h4>
                        <p className="text-green-400">{isHDRCapable ? 'HDR10/P3' : 'Rec.709'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-1">Preço Estimado</h4>
                        <p className="text-yellow-400 font-bold">R$ {estimatedPrice}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Settings className="mr-3" size={24} />
                Modo de Processamento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPreviewMode('auto')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    previewMode === 'auto'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Zap className="mb-2" size={24} />
                  <h3 className="font-semibold mb-1">Automático</h3>
                  <p className="text-sm text-gray-400">
                    Detecção e conversão automática de color space
                  </p>
                </button>
                
                <button
                  onClick={() => setPreviewMode('advanced')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    previewMode === 'advanced'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Settings className="mb-2" size={24} />
                  <h3 className="font-semibold mb-1">Avançado</h3>
                  <p className="text-sm text-gray-400">
                    Controle manual de transformações
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* LUT Library */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Palette className="mr-3" size={24} />
                Biblioteca de LUTs
              </h2>
              
              <div className="space-y-6">
                {Object.entries(lutLibrary).map(([category, luts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">
                      {category === 'social' ? 'Redes Sociais' : 
                       category === 'special' ? 'Especiais' : 
                       category === 'commercial' ? 'Comercial' : 'Cinema'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {luts.map((lut) => (
                        <button
                          key={lut.id}
                          onClick={() => applyLUT(lut)}
                          className={`p-3 rounded-lg border text-left transition-all hover:scale-105 ${
                            selectedLUT?.id === lut.id
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <h4 className="font-semibold text-sm mb-1">{lut.name}</h4>
                          <p className="text-xs text-gray-400">{lut.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview & Actions */}
            {uploadedFile && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Play className="mr-3" size={24} />
                  Preview & Ações
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400 mb-2">Preview do vídeo aparecerá aqui</p>
                    <div className="w-full h-48 bg-gray-700 rounded flex items-center justify-center">
                      <Play size={48} className="text-gray-500" />
                    </div>
                  </div>
                  
                  {selectedLUT && (
                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-blue-300">
                        <strong>LUT Aplicado:</strong> {selectedLUT.name}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        {colorSpace} → {isHDRCapable ? 'HDR10/P3' : 'Rec.709'} → {selectedLUT.name}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <Download className="mr-2" size={16} />
                      Solicitar Orçamento
                    </Button>
                    <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                      <Settings className="mr-2" size={16} />
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorStudio;
