import { useState, useEffect } from 'react'
import { Play, Award, ArrowRight, Sparkles, Film, Palette } from 'lucide-react'

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const stats = [
    { value: '500+', label: 'Projetos Finalizados' },
    { value: '150+', label: 'Clientes Satisfeitos' },
    { value: '10+', label: 'Anos de Experiência' }
  ]

  const specialties = [
    { icon: Film, text: 'Cinema & Séries' },
    { icon: Sparkles, text: 'Comerciais Premium' },
    { icon: Palette, text: 'Music Videos' }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        
        {/* Gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 bg-gradient-to-tr from-blue-600 to-cyan-600 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center space-y-8">
          
          {/* Badge */}
          <div className={`flex justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full border border-yellow-500/40 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <Award className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-semibold text-yellow-400 tracking-wide">
                Dolby Vision Certified Professional
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Color Grading
              </span>
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-color-shift">
                Para Criadores
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-400 max-w-3xl mx-auto font-light">
              Transforme suas imagens em arte cinematográfica com workflows HDR profissionais
            </p>
          </div>

          {/* Specialties */}
          <div className={`flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            {specialties.map((specialty, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <specialty.icon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300 font-medium">{specialty.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <a
              href="/portfolio"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center">
                Ver Portfólio
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            <a
              href="/contact"
              className="group px-8 py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 hover:scale-105 active:scale-95 flex items-center"
            >
              Iniciar Projeto
              <Play className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 hover:from-white/10 hover:to-white/5 transition-all duration-500"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className={`pt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-xs text-gray-500 mb-2 tracking-wider">ROLE PARA DESCOBRIR</span>
              <div className="w-6 h-10 border-2 border-white/20 rounded-full p-1">
                <div className="w-1 h-3 bg-white/40 rounded-full mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  )
}

export default HeroSection

