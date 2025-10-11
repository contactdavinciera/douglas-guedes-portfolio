import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sun,
  Contrast,
  Droplet,
  Palette,
  RotateCcw,
  Save,
  Copy,
  Eye,
  CloudSun
} from 'lucide-react';

const PrimaryColorCorrection = ({
  takeId,
  takeName,
  version = 'client',
  initialValues = {},
  onSave,
  onReset,
  disabled = false
}) => {
  const defaultValues = {
    exposure: 0,
    contrast: 1.0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    saturation: 1.0,
    vibrance: 0
  };

  const [values, setValues] = useState({ ...defaultValues, ...initialValues });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues({ ...defaultValues, ...initialValues });
    setHasChanges(false);
  }, [takeId, initialValues]);

  const handleValueChange = (key, newValue) => {
    setValues(prev => ({ ...prev, [key]: newValue[0] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(values);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving color correction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setValues(defaultValues);
    setHasChanges(true);
  };

  const handleCopyToColorist = () => {
    console.log('Copying client values to colorist version');
  };

  const getTemperatureColor = (temp) => {
    if (temp < -20) return 'from-blue-600 to-blue-400';
    if (temp > 20) return 'from-orange-500 to-yellow-400';
    return 'from-gray-600 to-gray-400';
  };

  const getTintColor = (tint) => {
    if (tint < -20) return 'from-green-600 to-green-400';
    if (tint > 20) return 'from-pink-600 to-pink-400';
    return 'from-gray-600 to-gray-400';
  };

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    icon: Icon,
    unit = '',
    gradient = null
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm text-gray-300">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </Label>
        <span className="text-sm font-mono text-white bg-gray-900 px-2 py-0.5 rounded">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
        disabled={disabled}
        className={gradient ? `slider-gradient-${gradient}` : ''}
      />
    </div>
  );

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-white">Correção de Cor Primária</div>
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
        <div className="space-y-4">
          <div className="text-sm font-semibold text-white border-b border-gray-800 pb-2">
            Exposição e Contraste
          </div>

          <SliderControl
            label="Exposição"
            value={values.exposure}
            min={-3}
            max={3}
            step={0.01}
            onChange={(v) => handleValueChange('exposure', v)}
            icon={Sun}
            unit=" EV"
          />

          <SliderControl
            label="Contraste"
            value={values.contrast}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => handleValueChange('contrast', v)}
            icon={Contrast}
          />

          <SliderControl
            label="Altas Luzes"
            value={values.highlights}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => handleValueChange('highlights', v)}
          />

          <SliderControl
            label="Sombras"
            value={values.shadows}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => handleValueChange('shadows', v)}
          />

          <SliderControl
            label="Brancos"
            value={values.whites}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => handleValueChange('whites', v)}
          />

          <SliderControl
            label="Pretos"
            value={values.blacks}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => handleValueChange('blacks', v)}
          />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-white border-b border-gray-800 pb-2">
            Balanço de Branco
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm text-gray-300">
                <CloudSun className="h-4 w-4" />
                Temperatura
              </Label>
              <span className="text-sm font-mono text-white bg-gray-900 px-2 py-0.5 rounded">
                {values.temperature > 0 ? '+' : ''}{values.temperature.toFixed(0)}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[values.temperature]}
                min={-100}
                max={100}
                step={1}
                onValueChange={(v) => handleValueChange('temperature', v)}
                disabled={disabled}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${getTemperatureColor(values.temperature)} opacity-20 rounded pointer-events-none`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm text-gray-300">
                <Droplet className="h-4 w-4" />
                Tint (Magenta/Verde)
              </Label>
              <span className="text-sm font-mono text-white bg-gray-900 px-2 py-0.5 rounded">
                {values.tint > 0 ? '+' : ''}{values.tint.toFixed(0)}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[values.tint]}
                min={-100}
                max={100}
                step={1}
                onValueChange={(v) => handleValueChange('tint', v)}
                disabled={disabled}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${getTintColor(values.tint)} opacity-20 rounded pointer-events-none`} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-white border-b border-gray-800 pb-2">
            Saturação
          </div>

          <SliderControl
            label="Saturação"
            value={values.saturation}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => handleValueChange('saturation', v)}
            icon={Palette}
          />

          <SliderControl
            label="Vibrance"
            value={values.vibrance}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => handleValueChange('vibrance', v)}
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-800">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || disabled || isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Correções'}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            disabled={disabled}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>

          {version === 'client' && (
            <Button
              onClick={handleCopyToColorist}
              variant="outline"
              disabled={disabled}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              title="Copiar valores para versão do colorista"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasChanges && (
          <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded px-3 py-2">
            Você tem alterações não salvas
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrimaryColorCorrection;
