import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  DollarSign,
  TrendingDown,
  Clock,
  Film,
  Info,
  Download
} from 'lucide-react';

const BatchPricingCalculator = ({ onPricingComplete }) => {
  const [clips, setClips] = useState([
    {
      id: 1,
      name: 'Clip 1',
      duration: 60,
      codec: 'PRORES',
      resolution: '1920x1080',
      project_type: 'SDR'
    }
  ]);
  const [isRush, setIsRush] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricingTable, setPricingTable] = useState(null);

  useEffect(() => {
    fetchPricingTable();
  }, []);

  const fetchPricingTable = async () => {
    try {
      const response = await fetch('/api/pricing/table');
      const data = await response.json();
      setPricingTable(data);
    } catch (error) {
      console.error('Error fetching pricing table:', error);
    }
  };

  const addClip = () => {
    const newClip = {
      id: Date.now(),
      name: `Clip ${clips.length + 1}`,
      duration: 60,
      codec: 'PRORES',
      resolution: '1920x1080',
      project_type: 'SDR'
    };
    setClips([...clips, newClip]);
  };

  const removeClip = (clipId) => {
    if (clips.length > 1) {
      setClips(clips.filter(c => c.id !== clipId));
    }
  };

  const updateClip = (clipId, field, value) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, [field]: value } : c
    ));
  };

  const calculatePricing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing/batch-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: clips.map(c => ({
            ...c,
            is_rush: isRush
          }))
        })
      });
      
      const data = await response.json();
      setPricing(data);
      
      if (onPricingComplete) {
        onPricingComplete(data);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      alert('Erro ao calcular preço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalDuration = () => {
    return clips.reduce((acc, clip) => acc + clip.duration, 0);
  };

  const exportQuote = () => {
    if (!pricing) return;

    const quoteData = {
      date: new Date().toISOString(),
      clips: clips,
      pricing: pricing,
      is_rush: isRush
    };

    const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Batch Pricing Calculator
          </CardTitle>
          <CardDescription>
            Calcule o preço para múltiplos clips com desconto por volume
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Clips List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clips ({clips.length})</CardTitle>
            <Button onClick={addClip} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Clip
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {clips.map((clip, index) => (
            <Card key={clip.id} className="p-4">
              <div className="space-y-4">
                {/* Clip Header */}
                <div className="flex items-center justify-between">
                  <Input
                    value={clip.name}
                    onChange={(e) => updateClip(clip.id, 'name', e.target.value)}
                    className="font-medium max-w-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeClip(clip.id)}
                    disabled={clips.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Clip Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={clip.duration}
                      onChange={(e) => updateClip(clip.id, 'duration', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>

                  {/* Codec */}
                  <div className="space-y-2">
                    <Label>Codec</Label>
                    <Select
                      value={clip.codec}
                      onValueChange={(val) => updateClip(clip.id, 'codec', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRAW">BRAW (1.3x)</SelectItem>
                        <SelectItem value="PRORES">ProRes (1.0x)</SelectItem>
                        <SelectItem value="DNX">DNxHD (1.1x)</SelectItem>
                        <SelectItem value="CINEFORM">CineForm (1.2x)</SelectItem>
                        <SelectItem value="H264">H.264 (0.8x)</SelectItem>
                        <SelectItem value="H265">H.265 (0.9x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resolution */}
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                      value={clip.resolution}
                      onValueChange={(val) => updateClip(clip.id, 'resolution', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7680x4320">8K (2.0x)</SelectItem>
                        <SelectItem value="6144x3160">6K (1.6x)</SelectItem>
                        <SelectItem value="3840x2160">4K (1.3x)</SelectItem>
                        <SelectItem value="1920x1080">2K/FHD (1.0x)</SelectItem>
                        <SelectItem value="1280x720">HD (0.8x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Type */}
                  <div className="space-y-2">
                    <Label>Project Type</Label>
                    <Select
                      value={clip.project_type}
                      onValueChange={(val) => updateClip(clip.id, 'project_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SDR">SDR ($15/min)</SelectItem>
                        <SelectItem value="HDR">HDR ($22.5/min)</SelectItem>
                        <SelectItem value="DolbyVision">Dolby Vision ($24/min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-gray-600" />
                <span className="font-medium">{clips.length} clips</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="font-medium">{formatTime(getTotalDuration())}</span>
              </div>
            </div>

            {/* Rush Option */}
            <div className="flex items-center gap-2">
              <Switch
                checked={isRush}
                onCheckedChange={setIsRush}
                id="rush-mode"
              />
              <Label htmlFor="rush-mode" className="cursor-pointer">
                Rush (+50%)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Button 
        className="w-full" 
        size="lg"
        onClick={calculatePricing}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="h-5 w-5 mr-2" />
            Calculate Pricing
          </>
        )}
      </Button>

      {/* Pricing Result */}
      {pricing && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Pricing Breakdown
              </span>
              <Button variant="outline" size="sm" onClick={exportQuote}>
                <Download className="h-4 w-4 mr-2" />
                Export Quote
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Final Price */}
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Price</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(pricing.final_price)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {formatCurrency(pricing.final_price / (getTotalDuration() / 60))} per minute
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Price</span>
                <span className="font-medium">{formatCurrency(pricing.base_price)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Codec Multiplier ({pricing.codec_multiplier}x)
                </span>
                <span className="font-medium">
                  {formatCurrency(pricing.base_price * pricing.codec_multiplier)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Resolution Multiplier ({pricing.resolution_multiplier}x)
                </span>
                <span className="font-medium">
                  {formatCurrency(pricing.price_before_discount)}
                </span>
              </div>

              {pricing.volume_discount_rate > 0 && (
                <>
                  <div className="border-t pt-3"></div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Volume Discount ({Math.round(pricing.volume_discount_rate * 100)}%)
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(pricing.volume_discount_amount)}
                    </span>
                  </div>
                </>
              )}

              {pricing.rush_fee > 0 && (
                <>
                  <div className="border-t pt-3"></div>
                  <div className="flex justify-between items-center text-orange-600">
                    <span>Rush Fee (+50%)</span>
                    <span className="font-medium">
                      +{formatCurrency(pricing.rush_fee)}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t pt-3"></div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Final Price</span>
                <span className="text-blue-600">
                  {formatCurrency(pricing.final_price)}
                </span>
              </div>
            </div>

            {/* Project Details */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <p><strong>Duration:</strong> {formatTime(getTotalDuration())} ({pricing.breakdown.duration_minutes.toFixed(2)} minutes)</p>
                  <p><strong>Clips:</strong> {pricing.breakdown.num_clips}</p>
                  <p><strong>Project Type:</strong> {pricing.breakdown.project_type}</p>
                  <p><strong>Base Rate:</strong> {formatCurrency(pricing.breakdown.base_rate_per_minute)}/min</p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Pricing Table Reference */}
      {pricingTable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Rates */}
            <div>
              <h4 className="font-medium mb-2">Base Rates (per minute)</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(pricingTable.base_rates).map(([type, rate]) => (
                  <Badge key={type} variant="secondary" className="justify-between">
                    <span>{type}</span>
                    <span>{formatCurrency(rate)}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Volume Discounts */}
            <div>
              <h4 className="font-medium mb-2">Volume Discounts</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {pricingTable.volume_discounts.map((discount, idx) => (
                  <Badge key={idx} variant="outline" className="justify-between">
                    <span>{discount.clips}+ clips</span>
                    <span className="text-green-600">{discount.discount}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Rush Fee */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Rush Fee:</strong> {pricingTable.rush_fee} adicional para entrega urgente
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchPricingCalculator;
