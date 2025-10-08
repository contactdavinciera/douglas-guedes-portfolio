import { Palette, Eye, Settings, Headphones, Clock, Shield, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Services = () => {
  const services = [
    {
      icon: Palette,
      title: 'Color Grading',
      description: 'Correção e estilização de cor para todos os tipos de projeto audiovisual',
      features: [
        'Correção primária e secundária',
        'Criação de looks personalizados',
        'Matching entre câmeras',
        'Finalização em diferentes formatos'
      ],
      price: 'A partir de R$ 500/dia'
    },
    {
      icon: Award,
      title: 'Dolby Vision HDR',
      description: 'Workflow completo em Dolby Vision para conteúdo premium HDR',
      features: [
        'Certificação Dolby Vision',
        'Processamento 10-bit em tempo real',
        'Monitores de referência HDR',
        'Sessões remotas via DaVinci Resolve'
      ],
      price: 'A partir de R$ 800/dia',
      premium: true
    },
    {
      icon: Eye,
      title: 'Consultoria de Look',
      description: 'Desenvolvimento de identidade visual e direção de cor para projetos',
      features: [
        'Análise de roteiro e referências',
        'Criação de paleta de cores',
        'LUTs de set para monitoramento',
        'Acompanhamento de filmagem'
      ],
      price: 'A partir de R$ 800/dia'
    },
    {
      icon: Settings,
      title: 'LUTs Personalizados',
      description: 'Criação de Look-Up Tables exclusivos para seu projeto ou marca',
      features: [
        'LUTs para diferentes câmeras',
        'Versões para Rec.709 e P3',
        'Documentação técnica',
        'Suporte pós-entrega'
      ],
      price: 'A partir de R$ 1.200/pacote'
    },
    {
      icon: Headphones,
      title: 'Atendimento Remoto',
      description: 'Sessões de color grading online com direção em tempo real',
      features: [
        'Sessão via streaming de alta qualidade',
        'Comunicação em tempo real',
        'Gravação da sessão',
        'Entrega em até 24h'
      ],
      price: 'A partir de R$ 400/hora'
    }
  ]

  const advantages = [
    {
      icon: Clock,
      title: 'Agilidade',
      description: 'Prazos respeitados e entregas pontuais'
    },
    {
      icon: Shield,
      title: 'Qualidade',
      description: 'Padrão profissional em todos os projetos'
    },
    {
      icon: Headphones,
      title: 'Suporte',
      description: 'Acompanhamento completo do início ao fim'
    }
  ]

  const workflow = [
    {
      step: '01',
      title: 'Briefing',
      description: 'Conversa inicial para entender objetivos e referências do projeto'
    },
    {
      step: '02',
      title: 'Análise Técnica',
      description: 'Avaliação do material e definição do workflow mais adequado'
    },
    {
      step: '03',
      title: 'Desenvolvimento',
      description: 'Criação do look e aplicação do color grading'
    },
    {
      step: '04',
      title: 'Revisão',
      description: 'Ajustes baseados no feedback e aprovação final'
    },
    {
      step: '05',
      title: 'Entrega',
      description: 'Finalização e entrega nos formatos solicitados'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Serviços</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Soluções completas em color grading para elevar a qualidade visual 
            dos seus projetos audiovisuais
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className={`rounded-lg p-8 space-y-6 ${
                service.premium 
                  ? 'bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30' 
                  : 'bg-gray-900'
              }`}>
                {service.premium && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">★</span>
                    </div>
                    <span className="text-yellow-500 font-semibold text-sm">PREMIUM</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    service.premium 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                      : 'bg-white/10'
                  }`}>
                    <service.icon size={24} className={service.premium ? "text-black" : "text-white"} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{service.title}</h3>
                    <p className="text-gray-400">{service.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                  <span className="text-lg font-semibold text-white">{service.price}</span>
                  <Button 
                    variant="outline" 
                    className={service.premium 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-none hover:opacity-90"
                      : "border-white text-white hover:bg-white hover:text-black"
                    }
                  >
                    Solicitar Orçamento
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {workflow.map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Por que Escolher?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <advantage.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold">{advantage.title}</h3>
                <p className="text-gray-400">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Especificações Técnicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Software</h3>
              <ul className="space-y-2 text-gray-300">
                <li>DaVinci Resolve Studio</li>
                <li>Baselight (acesso via facility)</li>
                <li>Adobe Premiere Pro</li>
                <li>Final Cut Pro</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Formatos Suportados</h3>
              <ul className="space-y-2 text-gray-300">
                <li>ProRes (todos os codecs)</li>
                <li>DNxHD/DNxHR</li>
                <li>RED R3D</li>
                <li>ARRI RAW</li>
                <li>Sony RAW</li>
                <li>Canon RAW</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Espaços de Cor</h3>
              <ul className="space-y-2 text-gray-300">
                <li>Rec.709 (HD/UHD)</li>
                <li>DCI-P3 (Cinema)</li>
                <li>Rec.2020 (HDR)</li>
                <li>ACES Workflow</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Entrega</h3>
              <ul className="space-y-2 text-gray-300">
                <li>ProRes 422 HQ/4444</li>
                <li>H.264/H.265</li>
                <li>DCP (Cinema)</li>
                <li>Broadcast specs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar seu projeto?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Transforme suas imagens em experiências cinematográficas inesquecíveis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
            >
              Solicitar Orçamento
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
            >
              Ver Portfólio
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services

