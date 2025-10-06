import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, ArrowRight, Award, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Home = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const stats = [
    { icon: Award, label: 'Projetos Concluídos', value: '200+' },
    { icon: Users, label: 'Clientes Satisfeitos', value: '50+' },
    { icon: Clock, label: 'Anos de Experiência', value: '8+' }
  ]

  const categories = [
    'Cinema',
    'Commercial',
    'Music Videos',
    'Shows',
    'Corporate'
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-black/50"></div>
          {/* Placeholder para o reel - será substituído por vídeo real */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Play size={32} className="text-white ml-1" />
                </div>
                <p className="text-gray-400 text-sm">Demo Reel Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="block">COLOR GRADING</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              FOR PREMIUM CONTENT
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light">
            Cinema | Commercial | Music | Shows | Corporate
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
              asChild
            >
              <Link to="/portfolio">
                Ver Portfólio
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
              onClick={() => setIsVideoPlaying(true)}
            >
              <Play className="mr-2" size={20} />
              Assistir Reel
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <stat.icon size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-12">Especialidades</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors duration-200 cursor-pointer"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para elevar seu projeto?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Transforme suas imagens em experiências cinematográficas inesquecíveis
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
            asChild
          >
            <Link to="/contact">
              Iniciar Projeto
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Home
