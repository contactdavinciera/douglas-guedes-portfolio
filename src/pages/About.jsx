import { Award, Eye, Palette, Zap } from 'lucide-react'

const About = () => {
  const skills = [
    {
      icon: Eye,
      title: 'Visão Artística',
      description: 'Sensibilidade estética refinada para criar looks únicos e impactantes'
    },
    {
      icon: Palette,
      title: 'Domínio Técnico',
      description: 'Expertise em DaVinci Resolve, Baselight e workflows profissionais'
    },
    {
      icon: Zap,
      title: 'Versatilidade',
      description: 'Adaptação a diferentes gêneros e estilos visuais'
    },
    {
      icon: Award,
      title: 'Excelência',
      description: 'Compromisso com a qualidade e atenção aos detalhes'
    }
  ]

  const process = [
    {
      step: '01',
      title: 'Análise do Material',
      description: 'Estudo detalhado do footage, narrativa e intenção criativa do projeto'
    },
    {
      step: '02',
      title: 'Desenvolvimento do Look',
      description: 'Criação de referências visuais e testes de cor alinhados com a direção'
    },
    {
      step: '03',
      title: 'Color Grading',
      description: 'Aplicação técnica precisa do color grading em todo o material'
    },
    {
      step: '04',
      title: 'Refinamento',
      description: 'Ajustes finais e aprovação com feedback do cliente'
    }
  ]

  const experience = [
    {
      year: '2016',
      title: 'Início da Carreira',
      description: 'Primeiros trabalhos em produtoras locais, desenvolvendo base técnica'
    },
    {
      year: '2018',
      title: 'Especialização',
      description: 'Foco em color grading para cinema e publicidade premium'
    },
    {
      year: '2020',
      title: 'Reconhecimento',
      description: 'Trabalhos em festivais de cinema e campanhas nacionais'
    },
    {
      year: '2024',
      title: 'Presente',
      description: 'Colorista estabelecido com portfólio diversificado e clientes de alto nível'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">Sobre Douglas Guedes</h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Colorista especializado em projetos premium com mais de 8 anos de experiência 
                transformando imagens em experiências visuais inesquecíveis.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Minha paixão pela cor e narrativa visual me levou a trabalhar com alguns dos 
                mais talentosos diretores, produtores e marcas do mercado audiovisual brasileiro. 
                Cada projeto é uma oportunidade de contar uma história através da cor, 
                criando atmosferas que conectam emocionalmente com o público.
              </p>
            </div>
            <div className="relative">
              {/* Placeholder para foto do Douglas */}
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-white/10 rounded-full mx-auto"></div>
                  <p className="text-gray-400">Foto Profissional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificação Dolby Vision */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-black/50 rounded-lg p-8 border border-white/10">
            <h2 className="text-3xl font-bold mb-6">Certificado Dolby Vision</h2>
            <p className="text-xl text-gray-300 mb-8">
              Profissional certificado pela Dolby para workflows HDR de alta qualidade
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">HDR Workflow</h3>
                <p className="text-gray-400 text-sm">
                  Fluxo de trabalho completo em Dolby Vision para conteúdo premium
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Qualidade 10-bit</h3>
                <p className="text-gray-400 text-sm">
                  Processamento em tempo real com profundidade de cor de 10 bits
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Trabalho Remoto</h3>
                <p className="text-gray-400 text-sm">
                  Sessões remotas via DaVinci Resolve com qualidade profissional
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipamentos */}
      <section className="py-16 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Equipamentos de Referência</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Sony BVM-X300</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">Sony BVM-X300</h3>
                <p className="text-gray-400">
                  Monitor OLED 4K de referência profissional com suporte completo a HDR, 
                  incluindo Dolby Vision, HLG e HDR10. Luminância de pico de 1000 nits 
                  para grading HDR preciso.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>Resolução 4K (4096 x 2160)</li>
                  <li>Painel OLED TRIMASTER EL</li>
                  <li>Suporte Dolby Vision, HLG, HDR10</li>
                  <li>Luminância de pico: 1000 nits</li>
                  <li>Cobertura de cor: DCI-P3, Rec.2020</li>
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">ASUS ProArt HDR</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">ASUS ProArt HDR</h3>
                <p className="text-gray-400">
                  Monitor profissional com certificação de fábrica para precisão de cores, 
                  suporte a múltiplos espaços de cor e tecnologia HDR para workflows 
                  de color grading exigentes.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>Item de Calibração</li>
                  <li>Suporte Rec.709, DCI-P3, Adobe RGB</li>
                  <li>Profundidade de cor 10-bit</li>
                  <li>Tecnologia HDR</li>
                  <li>Uniformidade de cor superior</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skills.map((skill, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <skill.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold">{skill.title}</h3>
                <p className="text-gray-400 text-sm">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Meu Processo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-gray-600">{item.step}</div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-800 transform translate-x-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Trajetória</h2>
          <div className="space-y-8">
            {experience.map((item, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{item.year}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">Filosofia de Trabalho</h2>
          <blockquote className="text-2xl text-gray-300 italic leading-relaxed mb-8">
            "A cor não é apenas uma ferramenta técnica, é a linguagem emocional que conecta 
            a história ao coração do espectador. Cada tom, cada matiz, cada contraste tem o 
            poder de transformar uma simples imagem em uma experiência inesquecível."
          </blockquote>
          <p className="text-gray-400">
            Acredito que o color grading vai muito além da correção técnica. É sobre criar 
            mundos visuais que servem à narrativa e amplificam as emoções que o diretor 
            deseja transmitir.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">O que dizem os clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black rounded-lg p-8 space-y-4">
              <p className="text-lg italic text-gray-300">
                "O Douglas transformou completamente a estética do nosso filme. A sensibilidade 
                dele para a cor é algo que raramente se vê. O resultado final superou todas as expectativas."
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div>
                  <p className="font-semibold">Diretor de Cinema</p>
                  <p className="text-sm text-gray-400">Produtora XYZ</p>
                </div>
              </div>
            </div>
            <div className="bg-black rounded-lg p-8 space-y-4">
              <p className="text-lg italic text-gray-300">
                "Trabalhar com o Douglas é garantia de qualidade e profissionalismo. Ele captou 
                exatamente a visão que tínhamos para a campanha e entregou um trabalho impecável."
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div>
                  <p className="font-semibold">Gerente de Marketing</p>
                  <p className="text-sm text-gray-400">Agência ABC</p>
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
            Vamos criar algo extraordinário juntos?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Estou sempre em busca de novos desafios criativos e projetos inspiradores
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold rounded-md transition-colors duration-200">
              Ver Portfólio
            </button>
            <button className="border border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg rounded-md transition-colors duration-200">
              Entrar em Contato
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
