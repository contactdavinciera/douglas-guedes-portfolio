import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Download, Eye, Palette, Tag, Grid, List } from 'lucide-react';
import { Button } from './ui/button';

const LUTLibrary = ({ selectedLUT, onLUTSelect, isVisible, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'popularity', 'category'

  const lutLibrary = {
    cinema: [
      { 
        id: 'blockbuster', 
        name: 'Blockbuster', 
        description: 'Estilo Hollywood épico com cores vibrantes e contraste dramático', 
        color: '#ff6b35',
        popularity: 95,
        tags: ['épico', 'hollywood', 'ação'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'indie', 
        name: 'Indie Film', 
        description: 'Look cinematográfico independente com tons naturais', 
        color: '#4ecdc4',
        popularity: 78,
        tags: ['natural', 'indie', 'suave'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'noir', 
        name: 'Film Noir', 
        description: 'Alto contraste, sombras dramáticas e atmosfera misteriosa', 
        color: '#2c3e50',
        popularity: 65,
        tags: ['contraste', 'sombras', 'mistério'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'thriller', 
        name: 'Thriller', 
        description: 'Tons frios e atmosfera tensa para suspense', 
        color: '#3498db',
        popularity: 72,
        tags: ['frio', 'suspense', 'tensão'],
        preview: '/api/placeholder/120/80'
      }
    ],
    commercial: [
      { 
        id: 'clean', 
        name: 'Clean & Bright', 
        description: 'Limpo e vibrante, perfeito para comerciais e produtos', 
        color: '#f39c12',
        popularity: 88,
        tags: ['limpo', 'vibrante', 'comercial'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'corporate', 
        name: 'Corporate', 
        description: 'Profissional e confiável para vídeos corporativos', 
        color: '#34495e',
        popularity: 82,
        tags: ['profissional', 'corporativo', 'confiável'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'fashion', 
        name: 'Fashion', 
        description: 'Cores saturadas e pele perfeita para moda', 
        color: '#e74c3c',
        popularity: 91,
        tags: ['moda', 'saturado', 'pele'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'food', 
        name: 'Food & Beverage', 
        description: 'Cores apetitosas e quentes para alimentos', 
        color: '#e67e22',
        popularity: 85,
        tags: ['comida', 'quente', 'apetitoso'],
        preview: '/api/placeholder/120/80'
      }
    ],
    social: [
      { 
        id: 'instagram-warm', 
        name: 'Instagram Warm', 
        description: 'Tons quentes populares nas redes sociais', 
        color: '#f39c12',
        popularity: 96,
        tags: ['instagram', 'quente', 'popular'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'instagram-cool', 
        name: 'Instagram Cool', 
        description: 'Tons frios modernos para feed estético', 
        color: '#3498db',
        popularity: 89,
        tags: ['instagram', 'frio', 'moderno'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'vintage', 
        name: 'Vintage', 
        description: 'Look retrô nostálgico com tons desbotados', 
        color: '#d35400',
        popularity: 76,
        tags: ['vintage', 'retrô', 'nostálgico'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'moody', 
        name: 'Moody', 
        description: 'Atmosfera dramática e escura para posts artísticos', 
        color: '#8e44ad',
        popularity: 83,
        tags: ['dramático', 'escuro', 'artístico'],
        preview: '/api/placeholder/120/80'
      }
    ],
    special: [
      { 
        id: 'teal-orange', 
        name: 'Teal & Orange', 
        description: 'Clássico contraste complementar azul-laranja', 
        color: '#16a085',
        popularity: 94,
        tags: ['contraste', 'complementar', 'clássico'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'bleach-bypass', 
        name: 'Bleach Bypass', 
        description: 'Alto contraste com cores dessaturadas', 
        color: '#95a5a6',
        popularity: 67,
        tags: ['contraste', 'dessaturado', 'único'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'desaturated', 
        name: 'Desaturated', 
        description: 'Cores suaves e naturais para look minimalista', 
        color: '#7f8c8d',
        popularity: 71,
        tags: ['suave', 'natural', 'minimalista'],
        preview: '/api/placeholder/120/80'
      },
      { 
        id: 'cyberpunk', 
        name: 'Cyberpunk', 
        description: 'Neons vibrantes para estética futurista', 
        color: '#9b59b6',
        popularity: 79,
        tags: ['neon', 'futurista', 'vibrante'],
        preview: '/api/placeholder/120/80'
      }
    ]
  };

  const categories = {
    all: 'Todos',
    cinema: 'Cinema',
    commercial: 'Comercial',
    social: 'Redes Sociais',
    special: 'Especiais'
  };

  const allLUTs = useMemo(() => {
    const luts = Object.entries(lutLibrary).flatMap(([category, luts]) => 
      luts.map(lut => ({ ...lut, category }))
    );

    // Filter by category
    const filtered = selectedCategory === 'all' 
      ? luts 
      : luts.filter(lut => lut.category === selectedCategory);

    // Filter by search term
    const searched = searchTerm 
      ? filtered.filter(lut => 
          lut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lut.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : filtered;

    // Sort
    return searched.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [selectedCategory, searchTerm, sortBy]);

  const handleLUTSelect = (lut) => {
    onLUTSelect(lut);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-7xl bg-gray-900/90 backdrop-blur-lg rounded-xl border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Biblioteca de LUTs
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="border-gray-600"
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-gray-600"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar LUTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="name">Nome</option>
            <option value="popularity">Popularidade</option>
            <option value="category">Categoria</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>{allLUTs.length} LUTs encontrados</span>
          {selectedLUT && (
            <span className="text-blue-400">
              Selecionado: {selectedLUT.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allLUTs.map((lut) => (
              <div
                key={lut.id}
                onClick={() => handleLUTSelect(lut)}
                className={`group cursor-pointer rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                  selectedLUT?.id === lut.id
                    ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                }`}
              >
                {/* Preview Image */}
                <div className="relative aspect-video rounded-t-lg overflow-hidden bg-gray-700">
                  <img
                    src={lut.preview}
                    alt={lut.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Color indicator */}
                  <div 
                    className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white/50" 
                    style={{ backgroundColor: lut.color }}
                  />
                  
                  {/* Popularity badge */}
                  <div className="absolute top-2 left-2 flex items-center bg-black/70 rounded-full px-2 py-1">
                    <Star size={12} className="text-yellow-400 mr-1" />
                    <span className="text-xs text-white">{lut.popularity}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate">{lut.name}</h3>
                    <span className="text-xs text-gray-400 capitalize">{lut.category}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{lut.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {lut.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {lut.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{lut.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {allLUTs.map((lut) => (
              <div
                key={lut.id}
                onClick={() => handleLUTSelect(lut)}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  selectedLUT?.id === lut.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                }`}
              >
                {/* Preview */}
                <div className="relative w-20 h-12 rounded overflow-hidden bg-gray-700 mr-4">
                  <img
                    src={lut.preview}
                    alt={lut.name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white/50" 
                    style={{ backgroundColor: lut.color }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{lut.name}</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400 capitalize">{lut.category}</span>
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-300">{lut.popularity}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{lut.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {lut.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {allLUTs.length === 0 && (
          <div className="text-center py-12">
            <Palette className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Nenhum LUT encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou termo de busca</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LUTLibrary;
