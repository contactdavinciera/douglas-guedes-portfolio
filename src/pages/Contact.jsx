import { useState } from 'react'
import { Mail, MessageCircle, Instagram, MapPin, Clock, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    project: '',
    budget: '',
    timeline: '',
    message: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aqui seria implementada a lógica de envio do formulário
    console.log('Form submitted:', formData)
    alert('Mensagem enviada com sucesso! Retornarei em breve.')
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contato@douglasguedes.com',
      link: 'mailto:contato@douglasguedes.com'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+55 11 99999-9999',
      link: 'https://wa.me/5511999999999'
    },
    {
      icon: Instagram,
      title: 'Instagram',
      value: '@douglasguedes',
      link: 'https://instagram.com/douglasguedes'
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: 'São Paulo, SP',
      link: null
    }
  ]

  const projectTypes = [
    'Cinema/Curta-metragem',
    'Comercial/Publicidade',
    'Videoclipe',
    'Show/Evento',
    'Corporativo',
    'Documentário',
    'Série/Web série',
    'Outro'
  ]

  const budgetRanges = [
    'Até R$ 2.000',
    'R$ 2.000 - R$ 5.000',
    'R$ 5.000 - R$ 10.000',
    'R$ 10.000 - R$ 20.000',
    'Acima de R$ 20.000',
    'A definir'
  ]

  const timelineOptions = [
    'Urgente (até 1 semana)',
    '2-3 semanas',
    '1 mês',
    '2-3 meses',
    'Flexível'
  ]

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Contato</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Vamos conversar sobre seu projeto e como posso ajudar a criar 
            uma experiência visual excepcional
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Solicitar Orçamento</h2>
                <p className="text-gray-400">
                  Preencha o formulário abaixo com detalhes do seu projeto
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Empresa/Produtora</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                    placeholder="Nome da empresa (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Projeto *</label>
                  <select
                    name="project"
                    value={formData.project}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                  >
                    <option value="">Selecione o tipo de projeto</option>
                    {projectTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Orçamento</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                    >
                      <option value="">Selecione a faixa de orçamento</option>
                      {budgetRanges.map((range, index) => (
                        <option key={index} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prazo</label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white"
                    >
                      <option value="">Selecione o prazo</option>
                      {timelineOptions.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Detalhes do Projeto *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white resize-none"
                    placeholder="Descreva seu projeto, objetivos, referências visuais, duração do material, formato de entrega, etc."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-black hover:bg-gray-200 py-3 text-lg font-semibold"
                >
                  Enviar Solicitação
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Informações de Contato</h2>
                <p className="text-gray-400">
                  Prefere falar diretamente? Entre em contato pelos canais abaixo
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <info.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{info.title}</div>
                      {info.link ? (
                        <a
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-gray-300 transition-colors duration-200"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <div className="text-white">{info.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Contact Buttons */}
              <div className="space-y-4 pt-8">
                <h3 className="text-xl font-semibold">Contato Rápido</h3>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-200"
                  >
                    <MessageCircle size={20} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="mailto:contato@douglasguedes.com"
                    className="flex items-center justify-center space-x-2 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors duration-200"
                  >
                    <Mail size={20} />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock size={20} className="text-white" />
                  <h3 className="text-lg font-semibold">Disponibilidade</h3>
                </div>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Segunda - Sexta:</span>
                    <span>9h - 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábado:</span>
                    <span>9h - 14h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingo:</span>
                    <span>Sob consulta</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 pt-2">
                  Respondo todas as mensagens em até 24 horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Perguntas Frequentes</h2>
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Qual o prazo médio para entrega?</h3>
              <p className="text-gray-400">
                O prazo varia conforme a complexidade e duração do material. Projetos simples 
                podem ser entregues em 2-3 dias, enquanto longas-metragens podem levar algumas semanas. 
                Sempre discuto prazos realistas durante o briefing.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Trabalha com material de qualquer câmera?</h3>
              <p className="text-gray-400">
                Sim, trabalho com material de todas as principais marcas: RED, ARRI, Sony, Canon, 
                Blackmagic, Panasonic, entre outras. Também aceito formatos de câmeras DSLR e mirrorless.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Oferece sessões presenciais?</h3>
              <p className="text-gray-400">
                Sim, para projetos em São Paulo posso realizar sessões presenciais. Para outras 
                localidades, ofereço sessões remotas com streaming de alta qualidade e comunicação 
                em tempo real.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Como funciona o processo de aprovação?</h3>
              <p className="text-gray-400">
                Envio previews em baixa resolução para aprovação antes da renderização final. 
                Incluo até 2 rodadas de ajustes no orçamento inicial. Revisões adicionais são 
                cobradas separadamente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact

