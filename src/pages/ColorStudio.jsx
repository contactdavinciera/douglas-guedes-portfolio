import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Download, Eye, Calculator, Clock, Zap } from 'lucide-react';

const ColorStudio = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedLUT, setSelectedLUT] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [budget, setBudget] = useState(null);
  const [projectSpecs, setProjectSpecs] = useState({
    duration: '',
    resolution: '1080p',
    delivery: '48h',
    complexity: 'standard'
  });
  const videoRef = useRef(null);

  const lutStyles = [
    {
      id: 'cinematic',
      name: 'Cinematográfico',
      description: 'Look profissional para cinema e documentários',
      preview: '/api/placeholder/300/200',
      basePrice: 150
    },
    {
      id: 'commercial',
      name: 'Comercial',
      description: 'Vibrante e impactante para publicidade',
      preview: '/api/placeholder/300/200',
      basePrice: 120
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Otimizado para redes sociais',
      preview: '/api/placeholder/300/200',
      basePrice: 80
    },
    {
      id: 'vintage',
      name: 'Vintage',
      description: 'Estética retrô e nostálgica',
      preview: '/api/placeholder/300/200',
      basePrice: 100
    },
    {
      id: 'dramatic',
      name: 'Dramático',
      description: 'Alto contraste para impacto emocional',
      preview: '/api/placeholder/300/200',
      basePrice: 140
    },
    {
      id: 'natural',
      name: 'Natural',
      description: 'Correção sutil e realista',
      preview: '/api/placeholder/300/200',
      basePrice: 90
    }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
      }
    }
  };

  const calculateBudget = () => {
    if (!selectedLUT || !projectSpecs.duration) return;

    const baseLUT = lutStyles.find(lut => lut.id === selectedLUT);
    let price = baseLUT.basePrice;

    // Multiplicadores baseados nas especificações
    const durationMinutes = parseFloat(projectSpecs.duration);
    if (durationMinutes > 5) price *= 1.5;
    if (durationMinutes > 15) price *= 2;

    if (projectSpecs.resolution === '4K') price *= 1.8;
    if (projectSpecs.resolution === '8K') price *= 2.5;

    if (projectSpecs.delivery === '24h') price *= 1.5;
    if (projectSpecs.delivery === '12h') price *= 2;

    if (projectSpecs.complexity === 'complex') price *= 1.4;
    if (projectSpecs.complexity === 'premium') price *= 2;

    setBudget(Math.round(price));
  };

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

  const selectLUT = (lutId) => {
    setSelectedLUT(lutId);
    // Aqui seria aplicado o filtro CSS ou WebGL para simular o LUT
    if (videoRef.current) {
      const lutClass = `lut-${lutId}`;
      videoRef.current.className = lutClass;
    }
  };

  React.useEffect(() => {
    calculateBudget();
  }, [selectedLUT, projectSpecs]);

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Color Studio Online</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experimente diferentes looks de color grading no seu vídeo, 
            receba orçamento instantâneo e contrate o serviço em poucos cliques.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Upload className="text-blue-400" size={24} />
              <span>Upload Instantâneo</span>
            </div>
            <div className="flex items-center space-x-3">
              <Eye className="text-green-400" size={24} />
              <span>Preview em Tempo Real</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calculator className="text-yellow-400" size={24} />
              <span>Orçamento Automático</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">1. Faça Upload do Seu Vídeo</h2>
          
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Arraste seu vídeo aqui</h3>
              <p className="text-gray-400 mb-6">Ou clique para selecionar (MP4, MOV, AVI - máx. 500MB)</p>
              <label className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg cursor-pointer inline-block transition-colors">
                Selecionar Arquivo
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="bg-black rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Seu Vídeo</h3>
                <button
                  onClick={togglePlay}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls
                />
                {selectedLUT && (
                  <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-lg text-sm">
                    {lutStyles.find(lut => lut.id === selectedLUT)?.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LUT Selection */}
      {uploadedFile && (
        <section className="py-16 bg-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">2. Escolha o Estilo de Color Grading</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lutStyles.map((lut) => (
                <div
                  key={lut.id}
                  onClick={() => selectLUT(lut.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
                    selectedLUT === lut.id
                      ? 'ring-2 ring-blue-500 transform scale-105'
                      : 'hover:transform hover:scale-102'
                  }`}
                >
                  <div className="aspect-video bg-gray-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      Preview {lut.name}
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4">
                    <h3 className="font-semibold mb-2">{lut.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{lut.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-semibold">A partir de R$ {lut.basePrice}</span>
                      {selectedLUT === lut.id && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          Selecionado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Project Specifications */}
      {selectedLUT && (
        <section className="py-16 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">3. Especificações do Projeto</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Duração do Vídeo (minutos)</label>
                  <input
                    type="number"
                    value={projectSpecs.duration}
                    onChange={(e) => setProjectSpecs({...projectSpecs, duration: e.target.value})}
                    className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex: 2.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Resolução</label>
                  <select
                    value={projectSpecs.resolution}
                    onChange={(e) => setProjectSpecs({...projectSpecs, resolution: e.target.value})}
                    className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1080p">Full HD (1080p)</option>
                    <option value="4K">4K Ultra HD</option>
                    <option value="8K">8K</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Prazo de Entrega</label>
                  <select
                    value={projectSpecs.delivery}
                    onChange={(e) => setProjectSpecs({...projectSpecs, delivery: e.target.value})}
                    className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="7d">7 dias</option>
                    <option value="48h">48 horas (+50%)</option>
                    <option value="24h">24 horas (+100%)</option>
                    <option value="12h">12 horas (+150%)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Complexidade</label>
                  <select
                    value={projectSpecs.complexity}
                    onChange={(e) => setProjectSpecs({...projectSpecs, complexity: e.target.value})}
                    className="w-full bg-black border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="standard">Padrão</option>
                    <option value="complex">Complexo (+40%)</option>
                    <option value="premium">Premium (+100%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Budget & Checkout */}
      {budget && (
        <section className="py-16 bg-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-8">4. Orçamento e Contratação</h2>
            
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
              <div className="text-4xl font-bold mb-4">R$ {budget}</div>
              <p className="text-xl text-gray-300 mb-6">
                Color grading profissional com o look "{lutStyles.find(lut => lut.id === selectedLUT)?.name}"
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <Clock size={16} />
                  <span>Entrega: {projectSpecs.delivery === '7d' ? '7 dias' : projectSpecs.delivery}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Zap size={16} />
                  <span>Resolução: {projectSpecs.resolution}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Eye size={16} />
                  <span>Duração: {projectSpecs.duration} min</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Contratar Agora
                </button>
                <div className="text-sm text-gray-400">
                  Pagamento seguro • Revisões incluídas • Garantia de qualidade
                </div>
              </div>
            </div>
            
            <div className="text-left bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold mb-4">O que está incluído:</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Color grading profissional com o look selecionado</li>
                <li>✓ Até 2 rodadas de revisão</li>
                <li>✓ Entrega em alta qualidade</li>
                <li>✓ Suporte técnico durante o projeto</li>
                <li>✓ Arquivos de projeto (DaVinci Resolve)</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Revolucione Seus Vídeos com Color Grading Profissional
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Experimente agora e veja a diferença que um color grading de qualidade pode fazer
          </p>
          {!uploadedFile && (
            <label className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-semibold rounded-lg cursor-pointer inline-block transition-colors">
              Começar Agora
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </section>
    </div>
  );
};

export default ColorStudio;
