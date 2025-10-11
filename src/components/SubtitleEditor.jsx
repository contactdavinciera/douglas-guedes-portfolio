import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  Upload,
  Download,
  Play,
  Pause,
  Languages,
  Type,
  Sparkles,
  FileText,
  Settings,
  Check,
  X,
  Loader2
} from 'lucide-react';
import SubtitleService, { subtitlePresets } from '@/services/subtitles';

const SubtitleEditor = ({ videoFile, onSubtitlesGenerated }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [language, setLanguage] = useState('pt-BR');
  const [preset, setPreset] = useState('tiktok');
  const [progress, setProgress] = useState(0);
  
  const subtitleService = useRef(new SubtitleService());

  const handleTranscribe = async () => {
    if (!videoFile) return;

    setIsTranscribing(true);
    setProgress(0);

    try {
      const result = await subtitleService.current.transcribeAudio(videoFile, {
        language,
        onProgress: (p) => setProgress(p * 100),
        onSegment: (seg) => {
          setSegments(prev => [...prev, seg]);
        }
      });

      setSegments(result);
      if (onSubtitlesGenerated) {
        onSubtitlesGenerated(result);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExportSRT = () => {
    const srt = subtitleService.current.exportSRT(segments);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
  };

  const handleExportVTT = () => {
    const vtt = subtitleService.current.exportVTT(segments);
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
  };

  const handleEditSegment = (index, newText) => {
    const updated = [...segments];
    updated[index].text = newText;
    setSegments(updated);
  };

  const handleDeleteSegment = (index) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950 overflow-hidden">
      
      {/* 3D Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-glow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Auto Subtitles</h1>
                <p className="text-sm text-gray-400">AI-powered transcription in 90+ languages</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px] bg-black/30 border-white/10 text-white">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>

              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="w-[150px] bg-black/30 border-white/10 text-white">
                  <Type className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="netflix">Netflix</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleTranscribe}
                disabled={!videoFile || isTranscribing}
                className="btn-3d"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto Transcribe
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Transcribing audio...</span>
                  <span className="text-sm text-white font-semibold">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
          
          {/* Segments List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-2 glass-card overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Subtitle Segments ({segments.length})</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExportSRT}
                    disabled={segments.length === 0}
                    className="text-gray-400 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    SRT
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExportVTT}
                    disabled={segments.length === 0}
                    className="text-gray-400 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    VTT
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <AnimatePresence>
                {segments.map((seg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedSegment === index
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-black/30 border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedSegment(index)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-mono text-gray-400">
                          {formatTime(seg.start)} → {formatTime(seg.end)}
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          {(seg.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(index);
                        }}
                        className="w-6 h-6 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <input
                      type="text"
                      value={seg.text}
                      onChange={(e) => handleEditSegment(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border-none text-white focus:outline-none"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {segments.length === 0 && !isTranscribing && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No subtitles generated yet</p>
                    <p className="text-sm mt-2">Click "Auto Transcribe" to get started</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Style Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Style Preview</h3>
            </div>

            <div className="flex-1 p-4 space-y-4">
              {/* Preview Box */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div 
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-4 py-2"
                  style={{
                    fontFamily: subtitlePresets[preset].fontFamily,
                    fontSize: `${subtitlePresets[preset].fontSize / 3}px`,
                    color: subtitlePresets[preset].color,
                    backgroundColor: subtitlePresets[preset].backgroundColor,
                    textShadow: `${subtitlePresets[preset].outlineWidth}px ${subtitlePresets[preset].outlineWidth}px 0 ${subtitlePresets[preset].outlineColor}`,
                    borderRadius: '8px'
                  }}
                >
                  {selectedSegment !== null && segments[selectedSegment]
                    ? segments[selectedSegment].text
                    : "Sample subtitle text"}
                </div>
              </div>

              {/* Preset Info */}
              <Card className="p-4 bg-black/30 border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">Preset: {preset}</h4>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Font:</span>
                    <span className="text-white">{subtitlePresets[preset].fontFamily}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="text-white">{subtitlePresets[preset].fontSize}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span className="text-white capitalize">{subtitlePresets[preset].position}</span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                  disabled={segments.length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Timeline
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Style
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default SubtitleEditor;
