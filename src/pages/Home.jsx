import React, { useState } from 'react'
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
        {/* Background Video/Images Slideshow */}
        <div className="absolute inset-0">
          {/* Video Background Placeholder - será substituído por vídeo real */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
            {/* Slideshow de imagens de trabalhos */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-red-900/50 animate-color-shift"></div>
            </div>
            
            {/* Overlay escuro para legibilidade */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          
          {/* Color Grading Bars Animation */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 to-purple-500 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-red-500 animate-pulse"></div>
          </div>
          
          {/* Floating Color Orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-40 h-40 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">

          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight animate-fade-in-up">
            <span className="block text-white">
              COLOR GRADING
            </span>
            <span className="block text-gray-300 mt-2">
              FOR PREMIUM CONTENT
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up delay-300">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 px-10 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
              className="border-2 border-white/50 text-white hover:bg-white hover:text-black px-10 py-4 text-lg rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              onClick={() => setIsVideoPlaying(true)}
            >
              <Play className="mr-2" size={20} />
              Assistir Reel
            </Button>
          </div>
        </div>

        {/* Categories near scroll indicator */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center animate-fade-in delay-500">
          <p className="text-lg text-gray-300 font-light mb-4">
            Cinema • Commercial • Music • Shows • Corporate
          </p>
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

      {/* Color Studio Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Experimente Nosso Color Studio Online
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Faça upload do seu vídeo, escolha diferentes looks de color grading, 
                veja o resultado em tempo real e receba orçamento instantâneo.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Preview em tempo real com diferentes LUTs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Orçamento automático baseado nas especificações</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Sistema de comentários e revisões integrado</span>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
                asChild
              >
                <Link to="/color-studio">
                  Experimentar Agora
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Play size={48} className="text-white mx-auto" />
                    <p className="text-gray-400">Color Studio Demo</p>
                  </div>
                </div>
              </div>
            </div>
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
