import { useState, useEffect } from 'react'
import { Menu, X, Award } from 'lucide-react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('/')

  // Detectar scroll para efeito de blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Portfólio', href: '/portfolio' },
    { name: 'Sobre', href: '/about' },
    { name: 'Serviços', href: '/services' },
    { name: 'Color Studio', href: '/color-studio' },
    { name: 'Pro Studio', href: '/pro-studio' },
    { name: 'Contato', href: '/contact' }
  ]

  const isActive = (href) => activeSection === href

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        scrolled 
          ? 'bg-black/95 backdrop-blur-xl border-b border-white/20 shadow-2xl' 
          : 'bg-black/80 backdrop-blur-md border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Premium */}
          <a 
            href="/" 
            className="group flex items-center space-x-4 text-white font-bold tracking-wider hover:opacity-90 transition-all duration-300"
          >
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-500">
                DOUGLAS GUEDES
              </span>
              <span className="text-xs text-gray-400 font-light tracking-[0.3em] mt-0.5 group-hover:text-gray-300 transition-colors">
                COLOR ARTIST
              </span>
            </div>
            
            {/* Badge Dolby Vision */}
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-500/40 group-hover:border-yellow-400/60 transition-all duration-300 hover:scale-105">
              <Award className="w-3.5 h-3.5 text-yellow-400 mr-1.5" />
              <span className="text-xs font-semibold text-yellow-400 tracking-wide">
                Dolby Vision
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveSection(item.href)
                }}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg group z-10 ${
                  isActive(item.href)
                    ? 'text-white bg-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="relative z-20">{item.name}</span>
                
                {/* Active indicator */}
                <span 
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 z-10 ${
                    isActive(item.href) ? 'w-8' : 'w-0 group-hover:w-6'
                  }`}
                />
              </a>
            ))}
          </nav>

          {/* CTA Button Desktop */}
          <div className="hidden md:block">
            <a
              href="/contact"
              className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg overflow-hidden group hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Iniciar Projeto</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 bg-black/60 backdrop-blur-lg rounded-xl mt-2 border border-white/10">
            {navigation.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveSection(item.href)
                  setIsMenuOpen(false)
                }}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`block px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                  isActive(item.href)
                    ? 'text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                } ${isMenuOpen ? 'animate-fade-in-up' : ''}`}
              >
                {item.name}
              </a>
            ))}
            
            {/* Mobile CTA */}
            <a
              href="/contact"
              className="block mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg text-center hover:shadow-lg transition-all duration-300"
            >
              Iniciar Projeto
            </a>

            {/* Mobile Badge */}
            <div className="flex sm:hidden items-center justify-center px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-500/40 mt-3">
              <Award className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-xs font-semibold text-yellow-400 tracking-wide">
                Dolby Vision Certified
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

