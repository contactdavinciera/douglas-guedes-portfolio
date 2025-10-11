import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  Search,
  Upload,
  Save,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const IntelligentLUTSelector = ({
  takeId,
  takeName,
  takeColorSpace,
  takeGamma,
  projectFormat = 'SDR',
  version = 'client',
  currentLUTs = {},
  lutLibrary = [],
  onSave,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversionLUT, setSelectedConversionLUT] = useState(currentLUTs.conversion_lut || null);
  const [selectedCreativeLUT, setSelectedCreativeLUT] = useState(currentLUTs.creative_lut || null);
  const [lutIntensity, setLutIntensity] = useState(currentLUTs.lut_intensity || 1.0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatMapping = {
    'SDR': 'REC709',
    'HDR_REC2020': 'REC2020',
    'DOLBY_VISION_P3': 'P3_D65'
  };

  const targetColorSpace = formatMapping[projectFormat];

  const getRecommendedConversionLUTs = () => {
    if (!takeColorSpace || takeColorSpace === targetColorSpace) {
      return [];
    }

    return lutLibrary.filter(lut =>
      lut.category === 'conversion' &&
      lut.source_color_space === takeColorSpace &&
      lut.target_color_space === targetColorSpace
    );
  };

  const getCreativeLUTs = () => {
    return lutLibrary.filter(lut =>
      lut.category === 'creative' &&
      (searchTerm === '' || lut.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const recommendedConversionLUTs = getRecommendedConversionLUTs();
  const creativeLUTs = getCreativeLUTs();

  const needsConversion = takeColorSpace && takeColorSpace !== targetColorSpace;

  useEffect(() => {
    if (needsConversion && recommendedConversionLUTs.length > 0 && !selectedConversionLUT) {
      setSelectedConversionLUT(recommendedConversionLUTs[0].filename);
    }
  }, [takeColorSpace, projectFormat]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        conversion_lut: selectedConversionLUT,
        creative_lut: selectedCreativeLUT,
        lut_intensity: lutIntensity
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving LUT assignment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConversionLUTSelect = (filename) => {
    setSelectedConversionLUT(filename);
    setHasChanges(true);
  };

  const handleCreativeLUTSelect = (filename) => {
    setSelectedCreativeLUT(selectedCreativeLUT === filename ? null : filename);
    setHasChanges(true);
  };

  const handleIntensityChange = (value) => {
    setLutIntensity(value[0]);
    setHasChanges(true);
  };

  const getColorSpaceColor = (colorSpace) => {
    const colors = {
      'BRAW_FILM_GEN5': 'text-orange-400 bg-orange-900/30 border-orange-700',
      'ARRI_LOG_C3': 'text-green-400 bg-green-900/30 border-green-700',
      'RED_IPP2': 'text-red-400 bg-red-900/30 border-red-700',
      'SONY_SLOG3': 'text-blue-400 bg-blue-900/30 border-blue-700',
      'REC709': 'text-gray-400 bg-gray-900/30 border-gray-700',
      'REC2020': 'text-purple-400 bg-purple-900/30 border-purple-700',
      'P3_D65': 'text-pink-400 bg-pink-900/30 border-pink-700'
    };
    return colors[colorSpace] || 'text-gray-400 bg-gray-900/30 border-gray-700';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-white">Seleção de LUTs</div>
              <div className="text-xs font-normal text-gray-400 mt-1">
                {takeName}
              </div>
            </div>
          </div>
          <Badge
            variant={version === 'client' ? 'default' : 'secondary'}
            className={version === 'client' ? 'bg-blue-600' : 'bg-purple-600'}
          >
            {version === 'client' ? 'Cliente' : 'Colorista'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-black/40 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Pipeline de Conversão</div>
            <Info className="h-4 w-4 text-gray-500" />
          </div>

          <div className="flex items-center gap-3">
            <Badge className={`${getColorSpaceColor(takeColorSpace)} border text-xs`}>
              {takeColorSpace || 'Unknown'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-gray-500" />
            <Badge className={`${getColorSpaceColor(targetColorSpace)} border text-xs`}>
              {targetColorSpace}
            </Badge>
            <ArrowRight className="h-4 w-4 text-gray-500" />
            <Badge variant="outline" className="bg-gray-900 text-gray-300 border-gray-700 text-xs">
              {projectFormat}
            </Badge>
          </div>
        </div>

        {needsConversion && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-white">
                LUT de Conversão (Obrigatório)
              </Label>
              {selectedConversionLUT && (
                <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-700 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Selecionado
                </Badge>
              )}
            </div>

            {recommendedConversionLUTs.length > 0 ? (
              <div className="space-y-2">
                {recommendedConversionLUTs.map((lut) => (
                  <div
                    key={lut.id}
                    onClick={() => !disabled && handleConversionLUTSelect(lut.filename)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedConversionLUT === lut.filename
                        ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500'
                        : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{lut.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{lut.description}</div>
                      </div>
                      {selectedConversionLUT === lut.filename && (
                        <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-sm text-yellow-400">
                <p className="font-medium">Nenhum LUT de conversão disponível</p>
                <p className="text-xs mt-1 text-yellow-300">
                  É necessário adicionar LUTs que convertem de {takeColorSpace} para {targetColorSpace}
                </p>
              </div>
            )}
          </div>
        )}

        {!needsConversion && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm text-green-400">
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Color space do take já está no formato do projeto. Conversão não necessária.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-white">
              LUT Criativo (Opcional)
            </Label>
            {selectedCreativeLUT && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedCreativeLUT(null);
                  setHasChanges(true);
                }}
                className="h-6 text-xs text-gray-400 hover:text-white"
              >
                Limpar
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar LUTs criativos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-950 border-gray-800 text-white"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {creativeLUTs.map((lut) => (
              <div
                key={lut.id}
                onClick={() => !disabled && handleCreativeLUTSelect(lut.filename)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedCreativeLUT === lut.filename
                    ? 'bg-purple-900/30 border-purple-500 ring-2 ring-purple-500'
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {lut.preview_url && (
                  <div className="w-full h-16 bg-gray-800 rounded mb-2 overflow-hidden">
                    <img
                      src={lut.preview_url}
                      alt={lut.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-xs font-medium text-white truncate">{lut.name}</div>
                {selectedCreativeLUT === lut.filename && (
                  <Check className="h-4 w-4 text-purple-400 mt-1" />
                )}
              </div>
            ))}
          </div>

          {creativeLUTs.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum LUT encontrado
            </div>
          )}
        </div>

        {selectedCreativeLUT && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">
                Intensidade do LUT Criativo
              </Label>
              <span className="text-sm font-mono text-white bg-gray-900 px-2 py-0.5 rounded">
                {(lutIntensity * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[lutIntensity]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleIntensityChange}
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0% (Desligado)</span>
              <span>100% (Total)</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-800">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || disabled || isSaving || (needsConversion && !selectedConversionLUT)}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar LUTs'}
          </Button>

          <Button
            variant="outline"
            disabled={disabled}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload LUT
          </Button>
        </div>

        {hasChanges && (
          <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded px-3 py-2">
            Você tem alterações não salvas
          </div>
        )}

        {needsConversion && !selectedConversionLUT && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
            Selecione um LUT de conversão antes de salvar
          </div>
        )}

        <div className="bg-gray-950 rounded-lg p-3 text-xs text-gray-400">
          <p className="font-semibold text-white mb-2">Ordem de Aplicação:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Correção de Cor Primária</li>
            <li>LUT de Conversão de Color Space (se necessário)</li>
            <li>LUT Criativo/Visual (se selecionado)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentLUTSelector;
