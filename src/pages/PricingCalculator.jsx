import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Film, Palette, Users, Download, Info } from 'lucide-react';

const PricingCalculator = () => {
  // Project Settings
  const [timelineDuration, setTimelineDuration] = useState(5); // minutes
  const [projectType, setProjectType] = useState('sdr'); // sdr, hdr2020, dolby
  const [sourceFormat, setSourceFormat] = useState('h264'); // h264, prores, raw
  
  // Services
  const [useColorGrading, setUseColorGrading] = useState(false);
  const [useProfessionalHelp, setUseProfessionalHelp] = useState(false);
  
  // Delivery
  const [deliveryFormat, setDeliveryFormat] = useState('proxy'); // proxy, high, hdr, dolby

  // Base Price (per minute)
  const BASE_PRICE = 10; // $10/min base

  // Multipliers
  const projectMultipliers = {
    sdr: 1.0,
    hdr2020: 1.5,
    dolby: 2.5
  };

  const formatMultipliers = {
    h264: 1.0,
    prores: 1.3,
    raw: 2.0
  };

  const deliveryMultipliers = {
    proxy: 1.0,
    high: 1.3,
    hdr: 1.6,
    dolby: 2.0
  };

  // Calculate total price
  const calculatePrice = () => {
    let price = BASE_PRICE * timelineDuration;
    
    // Apply project type multiplier
    price *= projectMultipliers[projectType];
    
    // Apply source format multiplier
    price *= formatMultipliers[sourceFormat];
    
    // Add color grading (50% extra)
    if (useColorGrading) {
      price *= 1.5;
    }
    
    // Add professional help (100% extra)
    if (useProfessionalHelp) {
      price *= 2.0;
    }
    
    // Apply delivery format multiplier
    price *= deliveryMultipliers[deliveryFormat];
    
    return price.toFixed(2);
  };

  const breakdown = () => {
    const items = [];
    let runningTotal = BASE_PRICE * timelineDuration;
    
    items.push({
      label: `Base editing (${timelineDuration} min)`,
      value: `$${runningTotal.toFixed(2)}`
    });
    
    // Project type
    const projectMult = projectMultipliers[projectType];
    if (projectMult > 1) {
      const before = runningTotal;
      runningTotal *= projectMult;
      items.push({
        label: `${projectType.toUpperCase()} project (${projectMult}x)`,
        value: `+$${(runningTotal - before).toFixed(2)}`
      });
    }
    
    // Source format
    const formatMult = formatMultipliers[sourceFormat];
    if (formatMult > 1) {
      const before = runningTotal;
      runningTotal *= formatMult;
      items.push({
        label: `${sourceFormat.toUpperCase()} source (${formatMult}x)`,
        value: `+$${(runningTotal - before).toFixed(2)}`
      });
    }
    
    // Color grading
    if (useColorGrading) {
      const before = runningTotal;
      runningTotal *= 1.5;
      items.push({
        label: 'Color Grading (+50%)',
        value: `+$${(runningTotal - before).toFixed(2)}`
      });
    }
    
    // Professional help
    if (useProfessionalHelp) {
      const before = runningTotal;
      runningTotal *= 2.0;
      items.push({
        label: 'Professional Help via Maestro (+100%)',
        value: `+$${(runningTotal - before).toFixed(2)}`
      });
    }
    
    // Delivery
    const deliveryMult = deliveryMultipliers[deliveryFormat];
    if (deliveryMult > 1) {
      const before = runningTotal;
      runningTotal *= deliveryMult;
      items.push({
        label: `${deliveryFormat.toUpperCase()} delivery (${deliveryMult}x)`,
        value: `+$${(runningTotal - before).toFixed(2)}`
      });
    }
    
    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Dynamic Pricing Calculator
          </h1>
          <p className="text-xl text-gray-400">
            Pay only for what you use. Professional-grade editing and color grading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Panel - Settings */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Timeline Duration */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Film className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Timeline Duration</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-2xl font-bold text-white">{timelineDuration} minutes</span>
                </div>
                <Slider
                  value={[timelineDuration]}
                  onValueChange={(v) => setTimelineDuration(v[0])}
                  min={1}
                  max={120}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 min</span>
                  <span>120 min (2h)</span>
                </div>
              </div>
            </Card>

            {/* Project Type */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Project Configuration</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Color Space</label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sdr">SDR (Rec.709) - Base Price</SelectItem>
                      <SelectItem value="hdr2020">HDR (Rec.2020) - 1.5x</SelectItem>
                      <SelectItem value="dolby">Dolby Vision - 2.5x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Source Format</label>
                  <Select value={sourceFormat} onValueChange={setSourceFormat}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h264">H.264/H.265 (Proxy) - Base</SelectItem>
                      <SelectItem value="prores">ProRes/DNxHD - 1.3x</SelectItem>
                      <SelectItem value="raw">RAW (BRAW/R3D/ARRI) - 2.0x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Additional Services</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-white">Color Grading</div>
                    <div className="text-sm text-gray-400">Professional color correction</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-semibold">+50%</span>
                    <input
                      type="checkbox"
                      checked={useColorGrading}
                      onChange={(e) => setUseColorGrading(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-white">Maestro (Professional Help)</div>
                    <div className="text-sm text-gray-400">Expert editor + colorist assistance</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-semibold">+100%</span>
                    <input
                      type="checkbox"
                      checked={useProfessionalHelp}
                      onChange={(e) => setUseProfessionalHelp(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Format */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Delivery Format</h3>
              </div>
              <Select value={deliveryFormat} onValueChange={setDeliveryFormat}>
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proxy">H.265 Proxy - Base</SelectItem>
                  <SelectItem value="high">High Quality (ProRes) - 1.3x</SelectItem>
                  <SelectItem value="hdr">HDR Master - 1.6x</SelectItem>
                  <SelectItem value="dolby">Dolby Vision - 2.0x</SelectItem>
                </SelectContent>
              </Select>
            </Card>

          </div>

          {/* Right Panel - Price Summary */}
          <div className="space-y-6">
            
            {/* Total Price */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 border-0">
              <div className="text-center">
                <div className="text-sm text-blue-100 mb-2">TOTAL PRICE</div>
                <div className="text-5xl font-bold text-white mb-2">
                  ${calculatePrice()}
                </div>
                <div className="text-sm text-blue-100">
                  ${(parseFloat(calculatePrice()) / timelineDuration).toFixed(2)}/minute
                </div>
              </div>
            </Card>

            {/* Price Breakdown */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Price Breakdown</h3>
              <div className="space-y-3">
                {breakdown().map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white font-semibold">{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-white font-bold text-xl">${calculatePrice()}</span>
                </div>
              </div>
            </Card>

            {/* Info */}
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p className="mb-2">
                    <strong className="text-white">How it works:</strong>
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Upload your footage</li>
                    <li>Edit in our browser-based editor</li>
                    <li>Pay only for timeline duration</li>
                    <li>Optional professional help via Maestro</li>
                    <li>Download in your preferred format</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6">
              <DollarSign className="w-5 h-5 mr-2" />
              Start Your Project
            </Button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PricingCalculator;
