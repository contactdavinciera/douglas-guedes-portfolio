import React, { useState } from 'react';
import { Settings, Sliders, Eye, Zap, Cpu, HardDrive, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

const ProcessingControls = ({ 
  previewMode, 
  setPreviewMode, 
  fileFormat, 
  colorSpace, 
  isHDRCapable,
  onSettingsChange 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processingSettings, setProcessingSettings] = useState({
    quality: 'high',
    colorDepth: '10bit',
    outputFormat: 'prores',
    denoising: false,
    sharpening: 'medium',
    colorCorrection: 'auto',
    hdrToneMapping: 'auto',
    renderPriority: 'quality'
  });

  const handleSettingChange = (setting, value) => {
    const newSettings = { ...processingSettings, [setting]: value };
    setProcessingSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getQualityPresets = () => {
    return [
      { id: 'draft', name: 'Draft', description: 'Rápido para preview', time: '2-5 min' },
      { id: 'standard', name: 'Standard', description: 'Qualidade balanceada', time: '5-15 min' },
      { id: 'high', name: 'High', description: 'Alta qualidade', time: '15-30 min' },
      { id: 'master', name: 'Master', description: 'Qualidade máxima', time: '30-60 min' }
    ];
  };

  const getOutputFormats = () => {
    const formats = [
      { id: 'prores', name: 'ProRes 422 HQ', description: 'Padrão profissional', size: 'Grande' },
      { id: 'prores_4444', name: 'ProRes 4444', description: 'Máxima qualidade', size: 'Muito Grande' },
      { id: 'h264', name: 'H.264', description: 'Compatibilidade universal', size: 'Pequeno' },
      { id: 'h265', name: 'H.265/HEVC', description: 'Eficiência moderna', size: 'Médio' }
    ];

    if (isHDRCapable) {
      formats.push(
        { id: 'prores_hdr', name: 'ProRes HDR', description: 'HDR10 compatível', size: 'Grande' },
        { id: 'h265_hdr', name: 'H.265 HDR', description: 'HDR eficiente', size: 'Médio' }
      );
    }

    return formats;
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setPreviewMode('auto')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              previewMode === 'auto'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Zap className="inline mr-2" size={16} />
            Modo Automático
          </button>
          <button
            onClick={() => setPreviewMode('advanced')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              previewMode === 'advanced'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings className="inline mr-2" size={16} />
            Modo Avançado
          </button>
        </div>
      </div>

      {/* Auto Mode */}
      {previewMode === 'auto' && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Processamento Automático</h3>
            <p className="text-gray-400">Configurações otimizadas automaticamente baseadas no seu arquivo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getQualityPresets().map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSettingChange('quality', preset.id)}
                className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                  processingSettings.quality === preset.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{preset.name}</h4>
                  <Clock size={16} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-400 mb-1">{preset.description}</p>
                <p className="text-xs text-blue-400">{preset.time}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {previewMode === 'advanced' && (
        <div className="space-y-6">
          {/* Output Format Selection */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <HardDrive className="mr-2" size={20} />
              Formato de Saída
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getOutputFormats().map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleSettingChange('outputFormat', format.id)}
                  className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                    processingSettings.outputFormat === format.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{format.name}</h4>
                    <span className="text-xs text-gray-400">{format.size}</span>
                  </div>
                  <p className="text-xs text-gray-400">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Processing Options */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Sliders className="mr-2" size={20} />
                Opções de Processamento
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Depth */}
              <div>
                <label className="block text-sm font-medium mb-2">Profundidade de Cor</label>
                <select
                  value={processingSettings.colorDepth}
                  onChange={(e) => handleSettingChange('colorDepth', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="8bit">8-bit</option>
                  <option value="10bit">10-bit</option>
                  <option value="12bit">12-bit</option>
                </select>
              </div>

              {/* Sharpening */}
              <div>
                <label className="block text-sm font-medium mb-2">Nitidez</label>
                <select
                  value={processingSettings.sharpening}
                  onChange={(e) => handleSettingChange('sharpening', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="none">Nenhuma</option>
                  <option value="light">Leve</option>
                  <option value="medium">Média</option>
                  <option value="strong">Forte</option>
                </select>
              </div>

              {/* Color Correction */}
              <div>
                <label className="block text-sm font-medium mb-2">Correção de Cor</label>
                <select
                  value={processingSettings.colorCorrection}
                  onChange={(e) => handleSettingChange('colorCorrection', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="auto">Automática</option>
                  <option value="manual">Manual</option>
                  <option value="none">Nenhuma</option>
                </select>
              </div>

              {/* HDR Tone Mapping */}
              {isHDRCapable && (
                <div>
                  <label className="block text-sm font-medium mb-2">HDR Tone Mapping</label>
                  <select
                    value={processingSettings.hdrToneMapping}
                    onChange={(e) => handleSettingChange('hdrToneMapping', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="auto">Automático</option>
                    <option value="hable">Hable</option>
                    <option value="reinhard">Reinhard</option>
                    <option value="aces">ACES</option>
                  </select>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Denoising */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium">Redução de Ruído</label>
                      <p className="text-xs text-gray-400">Remove ruído digital</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('denoising', !processingSettings.denoising)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        processingSettings.denoising ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          processingSettings.denoising ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Render Priority */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Prioridade</label>
                    <select
                      value={processingSettings.renderPriority}
                      onChange={(e) => handleSettingChange('renderPriority', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="speed">Velocidade</option>
                      <option value="balanced">Balanceado</option>
                      <option value="quality">Qualidade</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Processing Summary */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <Cpu className="mr-2 text-blue-400" size={20} />
              <h4 className="font-semibold text-blue-300">Resumo do Processamento</h4>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Entrada: {fileFormat} ({colorSpace})</p>
              <p>Saída: {getOutputFormats().find(f => f.id === processingSettings.outputFormat)?.name}</p>
              <p>Qualidade: {processingSettings.colorDepth} • {processingSettings.sharpening} nitidez</p>
              {processingSettings.denoising && <p>Redução de ruído ativada</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingControls;
