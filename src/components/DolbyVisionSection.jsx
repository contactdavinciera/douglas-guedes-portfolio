import React from 'react';

const DolbyVisionSection = () => {
  return (
    <>
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
                  <li>Calibração de fábrica</li>
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
    </>
  );
};

export default DolbyVisionSection;

