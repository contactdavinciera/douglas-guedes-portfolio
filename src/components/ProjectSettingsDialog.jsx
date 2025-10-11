import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Film, Palette } from 'lucide-react';

const ProjectSettingsDialog = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState(currentSettings || {
    framerate: 24,
    colorSpace: 'SDR',
    resolution: '1920x1080',
    timecodeStart: '00:00:00:00'
  });

  const framerates = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
  const colorSpaces = [
    { value: 'SDR', label: 'SDR (Rec. 709)', description: 'Standard Dynamic Range' },
    { value: 'HDR10', label: 'HDR10', description: 'High Dynamic Range (PQ)' },
    { value: 'HLG', label: 'HLG', description: 'Hybrid Log-Gamma' },
    { value: 'DOLBY_VISION', label: 'Dolby Vision', description: 'Dolby Vision HDR' }
  ];
  const resolutions = [
    '1920x1080',
    '2560x1440',
    '3840x2160',
    '4096x2160',
    '7680x4320'
  ];

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="maestro-panel bg-[#2a2a2a] border border-gray-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Project Settings - Maestro NLE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Frame Rate */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Frame Rate (fps)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {framerates.map(fps => (
                <button
                  key={fps}
                  onClick={() => setSettings(prev => ({ ...prev, framerate: fps }))}
                  className={`px-4 py-3 rounded text-sm font-medium transition-all ${
                    settings.framerate === fps
                      ? 'bg-blue-600 text-white border-2 border-blue-400'
                      : 'bg-[#1e1e1e] text-gray-400 border border-gray-600 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {fps === 23.976 ? '23.976' : fps}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All clips will play at project framerate regardless of source framerate
            </p>
          </div>

          {/* Color Space / HDR Format */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color Space / HDR Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {colorSpaces.map(cs => (
                <button
                  key={cs.value}
                  onClick={() => setSettings(prev => ({ ...prev, colorSpace: cs.value }))}
                  className={`p-4 rounded text-left transition-all ${
                    settings.colorSpace === cs.value
                      ? 'bg-purple-600 border-2 border-purple-400'
                      : 'bg-[#1e1e1e] border border-gray-600 hover:bg-[#2a2a2a]'
                  }`}
                >
                  <div className="font-semibold text-sm">{cs.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{cs.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Timeline Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {resolutions.map(res => (
                <button
                  key={res}
                  onClick={() => setSettings(prev => ({ ...prev, resolution: res }))}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    settings.resolution === res
                      ? 'bg-green-600 text-white border-2 border-green-400'
                      : 'bg-[#1e1e1e] text-gray-400 border border-gray-600 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {res === '1920x1080' && 'HD '}
                  {res === '3840x2160' && '4K '}
                  {res === '7680x4320' && '8K '}
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#1e1e1e] rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Configuration:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Frame Rate:</span>
                <span className="text-blue-400 ml-2 font-semibold">{settings.framerate} fps</span>
              </div>
              <div>
                <span className="text-gray-500">Color Space:</span>
                <span className="text-purple-400 ml-2 font-semibold">
                  {colorSpaces.find(c => c.value === settings.colorSpace)?.label}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Resolution:</span>
                <span className="text-green-400 ml-2 font-semibold">{settings.resolution}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettingsDialog;
