import React, { useState, useRef } from 'react';

export default function ColorStudioPro() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [videoId, setVideoId] = useState(null);
  const [conversionStatus, setConversionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const API_BASE = 'https://douglas-guedes-portfolio.onrender.com';

  // Formatos RAW suportados
  const RAW_FORMATS = ['.braw', '.r3d', '.ari', '.mxf', '.dpx', '.exr'];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setUploadStatus('analyzing');

    // Análise básica do arquivo
    const info = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type || 'application/octet-stream',
      extension: '.' + selectedFile.name.split('.').pop().toLowerCase(),
      isRaw: RAW_FORMATS.some(format => 
        selectedFile.name.toLowerCase().endsWith(format)
      )
    };

    // Tentar obter duração do vídeo (se possível)
    if (selectedFile.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(selectedFile);
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            info.duration = video.duration;
            info.width = video.videoWidth;
            info.height = video.videoHeight;
            URL.revokeObjectURL(video.src);
            resolve();
          };
        });
      } catch (err) {
        console.log('Não foi possível extrair metadados:', err);
      }
    }

    setFileInfo(info);
    setUploadStatus('ready');
  };

  const startUpload = async () => {
    if (!file || !fileInfo) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      // 1. Iniciar upload multipart
      const initResponse = await fetch(`${API_BASE}/api/color-studio/upload/raw/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          filesize: file.size,
          content_type: file.type || 'application/octet-stream'
        })
      });

      if (!initResponse.ok) throw new Error('Falha ao iniciar upload');

      const { upload_id, key } = await initResponse.json();

      // 2. Upload em chunks
      const chunkSize = 10 * 1024 * 1024; // 10MB por chunk
      const chunks = Math.ceil(file.size / chunkSize);
      const uploadedParts = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // Obter URL assinada para este chunk
        const urlResponse = await fetch(`${API_BASE}/api/color-studio/upload/raw/part-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            upload_id,
            part_number: i + 1
          })
        });

        const { upload_url } = await urlResponse.json();

        // Upload do chunk
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        });

        const etag = uploadResponse.headers.get('ETag');
        uploadedParts.push({
          PartNumber: i + 1,
          ETag: etag
        });

        // Atualizar progresso
        setUploadProgress(Math.round(((i + 1) / chunks) * 100));
      }

      // 3. Completar upload multipart
      const completeResponse = await fetch(`${API_BASE}/api/color-studio/upload/raw/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          upload_id,
          parts: uploadedParts
        })
      });

      if (!completeResponse.ok) throw new Error('Falha ao completar upload');

      const { r2_url } = await completeResponse.json();

      setUploadStatus('converting');

      // 4. Iniciar conversão para H.265
      const convertResponse = await fetch(`${API_BASE}/api/color-studio/convert/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          r2_key: key,
          filename: file.name
        })
      });

      if (!convertResponse.ok) throw new Error('Falha ao iniciar conversão');

      const { job_id, video_id } = await convertResponse.json();
      setVideoId(video_id);

      // 5. Monitorar status da conversão
      monitorConversion(job_id);

    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err.message);
      setUploadStatus('error');
    }
  };

  const monitorConversion = async (jobId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/color-studio/convert/status/${jobId}`);
        const status = await response.json();

        setConversionStatus(status);

        if (status.status === 'completed') {
          setUploadStatus('completed');
          setShowTimeline(true);
        } else if (status.status === 'failed') {
          setUploadStatus('error');
          setError('Conversão falhou');
        } else {
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    };

    checkStatus();
  };

  const resetUpload = () => {
    setFile(null);
    setFileInfo(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setVideoId(null);
    setConversionStatus(null);
    setError(null);
    setShowTimeline(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
              Color Studio Pro
            </span>
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            Sistema profissional de color grading com detecção automática de formatos
          </p>
          <div className="flex justify-center gap-3">
            <span className="px-3 py-1 bg-gray-900 rounded-md text-xs border border-gray-800">
              SDR Display
            </span>
            <span className="px-3 py-1 bg-yellow-900/20 rounded-md text-xs border border-yellow-700/30 text-yellow-500">
              Dolby Vision Certified
            </span>
          </div>
        </div>

        {/* Main Upload Area */}
        <div className="max-w-5xl mx-auto">
          {!showTimeline ? (
            <div className="bg-gray-900/30 backdrop-blur rounded-lg border border-gray-800 p-6">
              
              {uploadStatus === 'idle' && (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h2 className="text-2xl font-semibold mb-2">Preview do Vídeo</h2>
                    <p className="text-gray-500 text-sm mb-6">
                      Faça upload de um arquivo para começar
                    </p>
                    <p className="text-xs text-gray-600 mb-8">
                      Suporta: MP4, MOV, BRAW, R3D, ARI, MXF, DPX, EXR
                    </p>
                  </div>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="video/*,.braw,.r3d,.ari,.mxf,.dpx,.exr"
                      className="hidden"
                    />
                    <div className="px-6 py-3 bg-blue-600 rounded-lg font-medium text-sm hover:bg-blue-700 transition-all inline-block">
                      Selecionar Arquivo
                    </div>
                  </label>
                </div>
              )}

              {(uploadStatus === 'analyzing' || uploadStatus === 'ready') && fileInfo && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-sm">
                      📄
                    </span>
                    Informações do Arquivo
                  </h3>

                  <div className="bg-black/40 rounded-lg p-5 mb-5 border border-gray-800">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Nome</p>
                        <p className="font-medium truncate">{fileInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Tamanho</p>
                        <p className="font-medium">{formatFileSize(fileInfo.size)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Formato</p>
                        <p className="font-medium uppercase">{fileInfo.extension}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Tipo</p>
                        <p className="font-medium">
                          {fileInfo.isRaw ? (
                            <span className="text-yellow-500">RAW Format</span>
                          ) : (
                            <span className="text-green-500">Standard Video</span>
                          )}
                        </p>
                      </div>
                      {fileInfo.duration && (
                        <>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Duração</p>
                            <p className="font-medium">{formatDuration(fileInfo.duration)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Resolução</p>
                            <p className="font-medium">{fileInfo.width} × {fileInfo.height}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={startUpload}
                      disabled={uploadStatus === 'analyzing'}
                      className="flex-1 px-5 py-3 bg-blue-600 rounded-lg font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadStatus === 'analyzing' ? 'Analisando...' : 'Iniciar Upload'}
                    </button>
                    <button
                      onClick={resetUpload}
                      className="px-5 py-3 bg-gray-800 rounded-lg font-medium text-sm hover:bg-gray-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {uploadStatus === 'uploading' && (
                <div className="py-8">
                  <h3 className="text-xl font-semibold mb-6 text-center">Enviando Arquivo...</h3>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-400">Progresso</span>
                      <span className="font-semibold text-blue-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-gray-500 text-center text-sm mt-4">
                    Processando arquivo...
                  </p>
                </div>
              )}

              {uploadStatus === 'converting' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Convertendo para H.265...</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Seu arquivo RAW está sendo processado
                  </p>
                  {conversionStatus && (
                    <div className="bg-black/40 rounded-lg p-3 border border-gray-800 inline-block">
                      <p className="text-xs text-gray-400">Status: {conversionStatus.status}</p>
                      {conversionStatus.progress && (
                        <p className="text-xs text-blue-400 mt-1">
                          Progresso: {conversionStatus.progress}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === 'error' && error && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center border border-red-800">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-red-400">Erro no Upload</h3>
                  <p className="text-gray-400 text-sm mb-6">{error}</p>
                  <button
                    onClick={resetUpload}
                    className="px-6 py-3 bg-gray-800 rounded-lg font-medium text-sm hover:bg-gray-700 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

            </div>
          ) : (
            <TimelineView videoId={videoId} onBack={resetUpload} />
          )}
        </div>

        {/* Features */}
        {!showTimeline && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-5xl mx-auto">
            <div className="bg-gray-900/20 backdrop-blur rounded-lg p-4 border border-gray-800">
              <div className="text-2xl mb-2">🎬</div>
              <h4 className="font-semibold text-sm mb-1">RAW Support</h4>
              <p className="text-xs text-gray-500">BRAW, R3D, ARRI, MXF e mais</p>
            </div>
            <div className="bg-gray-900/20 backdrop-blur rounded-lg p-4 border border-gray-800">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-sm mb-1">Conversão Rápida</h4>
              <p className="text-xs text-gray-500">Otimizado para H.265/HEVC</p>
            </div>
            <div className="bg-gray-900/20 backdrop-blur rounded-lg p-4 border border-gray-800">
              <div className="text-2xl mb-2">☁️</div>
              <h4 className="font-semibold text-sm mb-1">Cloud Streaming</h4>
              <p className="text-xs text-gray-500">Cloudflare Stream integrado</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-600 text-xs mt-12">
          <p>&copy; 2023 Color Studio Pro. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

// Componente TimelineView (placeholder por enquanto)
const TimelineView = ({ videoId, onBack }) => {
  return (
    <div className="bg-gray-900/30 backdrop-blur rounded-lg border border-gray-800 p-6 text-center">
      <h2 className="text-2xl font-semibold mb-4">Timeline View para {videoId}</h2>
      <p className="text-gray-400 mb-6">Aqui você poderá editar e visualizar seu vídeo.</p>
      <button
        onClick={onBack}
        className="px-6 py-3 bg-blue-600 rounded-lg font-medium text-sm hover:bg-blue-700 transition-all"
      >
        Voltar
      </button>
    </div>
  );
};
