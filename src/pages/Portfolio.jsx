import { useState } from 'react'
import { Play, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'cinema', name: 'Cinema' },
    { id: 'commercial', name: 'Comercial' },
    { id: 'music', name: 'Videoclipes' },
    { id: 'shows', name: 'Shows' },
    { id: 'corporate', name: 'Corporativo' }
  ]

  // Projetos de exemplo - em produção, estes viriam de uma API ou CMS
  const projects = [
    {
      id: 1,
      title: 'Campanha Luxury Brand',
      category: 'commercial',
      type: 'Comercial',
      description: 'Color grading para campanha de marca de luxo, focando em tons quentes e elegantes.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    },
    {
      id: 2,
      title: 'Curta-metragem "Noite"',
      category: 'cinema',
      type: 'Cinema',
      description: 'Trabalho de color grading para drama noturno, criando atmosfera intimista.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    },
    {
      id: 3,
      title: 'Videoclipe "Neon Dreams"',
      category: 'music',
      type: 'Videoclipe',
      description: 'Estética futurista com neons vibrantes e contrastes altos.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    },
    {
      id: 4,
      title: 'Show Arena Rock',
      category: 'shows',
      type: 'Show',
      description: 'Color grading para show ao vivo, realçando energia e dinâmica do palco.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    },
    {
      id: 5,
      title: 'Institucional Tech Company',
      category: 'corporate',
      type: 'Corporativo',
      description: 'Vídeo corporativo com look clean e profissional.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    },
    {
      id: 6,
      title: 'Documentário Natureza',
      category: 'cinema',
      type: 'Cinema',
      description: 'Color grading para documentário, preservando naturalidade das cores.',
      beforeImage: '/api/placeholder/600/400',
      afterImage: '/api/placeholder/600/400',
      videoUrl: '#'
    }
  ]

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory)

  const BeforeAfterSlider = ({ beforeImage, afterImage, title }) => {
    const [sliderPosition, setSliderPosition] = useState(50)

    return (
      <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg group">
        {/* Before Image */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400">Antes</span>
          </div>
        </div>
        
        {/* After Image */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="w-full h-full bg-gray-600 flex items-center justify-center">
            <span className="text-gray-300">Depois</span>
          </div>
        </div>

        {/* Slider */}
        <div className="absolute inset-0 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(e.target.value)}
            className="w-full h-full opacity-0 cursor-col-resize"
          />
          <div 
            className="absolute w-1 h-full bg-white shadow-lg pointer-events-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ArrowLeft size={12} className="text-gray-800 -ml-1" />
              <ArrowRight size={12} className="text-gray-800 -mr-1" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Antes
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Depois
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Portfólio</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Uma seleção dos meus trabalhos mais recentes em color grading, 
            demonstrando versatilidade e excelência técnica em diferentes gêneros audiovisuais.
          </p>
        </div>
      </section>

      {/* Demo Reel Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Demo Reel 2024</h2>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-white/30 transition-colors duration-200">
                  <Play size={32} className="text-white ml-1" />
                </div>
                <p className="text-gray-300">Clique para assistir o demo reel completo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`px-6 py-2 ${
                  selectedCategory === category.id
                    ? 'bg-white text-black'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="space-y-4">
                <BeforeAfterSlider 
                  beforeImage={project.beforeImage}
                  afterImage={project.afterImage}
                  title={project.title}
                />
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {project.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Gostou do que viu?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Vamos conversar sobre como posso elevar a qualidade visual do seu próximo projeto
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
          >
            Solicitar Orçamento
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Portfolio
