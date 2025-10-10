import React, { useState, useRef } from 'react';
import { uploadFile, isRawFormat } from '../services/uploadService';

function ColorStudio() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFileInfo(null);
    setError(null);
    setUploadStatus('analyzing');

    const info = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type || 'application/octet-stream',
      extension: '.' + selectedFile.name.split('.').pop().toLowerCase(),
      isRaw: isRawFormat(selectedFile.name)
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

  const handleUpload = async () => {
    if (!fileInfo) return;

    setUploading(true);
    setError(null);
    setProgress(0);
    setUploadStatus('uploading');

    try {
      const result = await uploadFile(fileInfo, (progressData) => {
        setProgress(progressData.percentage);
      });

      console.log('✅ Upload successful:', result);
      alert('Upload concluído com sucesso!');
      setUploadStatus('completed');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Erro no upload');
      setUploadStatus('error');
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFileInfo(null);
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadStatus('idle');
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
          {
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
                      onClick={handleUpload}
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
                      <span className="font-semibold text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
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
                  {/* {conversionStatus && (
                    <div className="bg-black/40 rounded-lg p-3 border border-gray-800 inline-block">
                      <p className="text-xs text-gray-400">Status: {conversionStatus.status}</p>
                      {conversionStatus.progress && (
                        <p className="text-xs text-blue-400 mt-1">
                          Progresso: {conversionStatus.progress}%
                        </p>
                      )}
                    </div>
                  )} */}
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

              {uploadStatus === 'completed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-900/20 rounded-full flex items-center justify-center border border-green-800">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-green-400">Upload Concluído!</h3>
                  <p className="text-gray-400 text-sm mb-6">Seu arquivo foi enviado e está pronto para processamento.</p>
                  <button
                    onClick={resetUpload}
                    className="px-6 py-3 bg-blue-600 rounded-lg font-medium text-sm hover:bg-blue-700 transition-all"
                  >
                    Fazer Novo Upload
                  </button>
                </div>
              )}

            </div>
          }
        </div>

        {/* Features */}
        {
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
              <p className="text-xs text-gray-500">Acesso instantâneo e seguro</p>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default ColorStudio;

