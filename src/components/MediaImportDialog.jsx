import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileVideo, Info } from 'lucide-react';

const MediaImportDialog = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeFile = async (file) => {
    setAnalyzing(true);
    
    // Simulated codec detection (in real app would use ffprobe or mediainfo)
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    const info = {
      filename: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      format: fileExt.toUpperCase(),
      codec: detectCodec(fileExt),
      colorSpace: detectColorSpace(fileExt),
      gamma: 'Rec. 709'
    };
    
    setMediaInfo(info);
    setAnalyzing(false);
  };

  const detectCodec = (ext) => {
    const codecs = {
      'mov': 'H.264 / ProRes',
      'mp4': 'H.264',
      'avi': 'H.264 / DivX',
      'braw': 'Blackmagic RAW',
      'r3d': 'RED RAW',
      'mxf': 'DNxHD / XAVC',
      'wav': 'PCM Audio',
      'mp3': 'MP3 Audio'
    };
    return codecs[ext] || 'Unknown';
  };

  const detectColorSpace = (ext) => {
    const rawFormats = ['braw', 'r3d', 'ari'];
    return rawFormats.includes(ext) ? 'BMD Film / LogC' : 'Rec. 709';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      analyzeFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile && mediaInfo) {
      onImport(selectedFile, mediaInfo);
      onClose();
      setSelectedFile(null);
      setMediaInfo(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="maestro-panel bg-[#2a2a2a] border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Media to Maestro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">Click to select media file</p>
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-file-input"
              />
              <label htmlFor="media-file-input">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-[#1e1e1e] rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Media Information
                </h3>
                
                {analyzing ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Analyzing media...</p>
                  </div>
                ) : mediaInfo ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Filename:</span>
                      <p className="text-white font-medium truncate">{mediaInfo.filename}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <p className="text-white font-medium">{mediaInfo.size}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Format:</span>
                      <p className="text-blue-400 font-medium">{mediaInfo.format}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Codec:</span>
                      <p className="text-green-400 font-medium">{mediaInfo.codec}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Color Space:</span>
                      <p className="text-purple-400 font-medium">{mediaInfo.colorSpace}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Gamma:</span>
                      <p className="text-yellow-400 font-medium">{mediaInfo.gamma}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    setMediaInfo(null);
                  }}
                >
                  Change File
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!mediaInfo}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Import to Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaImportDialog;
