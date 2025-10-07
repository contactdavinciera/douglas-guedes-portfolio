import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Loader } from 'lucide-react';
import { Button } from './ui/button';
import streamApi from '../services/streamApi';

console.log('StreamUploader: Componente carregado');

const StreamUploader = ({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  maxDurationSeconds = 3600,
  acceptedFormats = ['video/*', '.braw', '.r3d', '.ari', '.mxf', '.dng'],
  className = ""
}) => {
  console.log('StreamUploader: Renderizando com props:', { maxDurationSeconds, acceptedFormats });
  const [uploadState, setUploadState] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const fileInputRef = useRef(null);
  const uploadRef = useRef(null);

  // Detectar formato e metadados do arquivo
  const analyzeFile = useCallback((file) => {
    console.log('StreamUploader: analyzeFile acionado para:', file.name);
    const extension = file.name.split('.').pop().toLowerCase();
    const formats = {
      'braw': { format: 'BRAW', colorSpace: 'Blackmagic Wide Gamut', isRaw: true },
      'r3d': { format: 'RED R3D', colorSpace: 'REDWideGamutRGB', isRaw: true },
      'ari': { format: 'ALEXA', colorSpace: 'LogC', isRaw: true },
      'mov': { format: 'QuickTime', colorSpace: 'Rec.709', isRaw: false },
      'mp4': { format: 'MP4', colorSpace: 'Rec.709', isRaw: false },
      'mxf': { format: 'Sony MXF', colorSpace: 'S-Gamut3', isRaw: true },
      'dng': { format: 'Cinema DNG', colorSpace: 'Linear', isRaw: true }
    };

    const fileInfo = formats[extension] || { format: 'Unknown', colorSpace: 'Unknown', isRaw: false };
    
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      ...fileInfo
    };
    console.log('StreamUploader: Metadados do arquivo analisados:', metadata);
    return metadata;
  }, []);



  // Processar upload de arquivo
  const handleFileUpload = async (file) => {
    console.log('StreamUploader: handleFileUpload acionado para:', file.name);
    try {
      setUploadState('uploading');
      setUploadProgress(0);
      setUploadError(null);
      setUploadedFile(file);
      
      const metadata = analyzeFile(file);
      setVideoMetadata(metadata);
      console.log('StreamUploader: Estado de upload definido para "uploading".');

      // Obter URL de upload do backend
      console.log('StreamUploader: Solicitando URL de upload...');
      const uploadResponse = await streamApi.getUploadUrl(file, maxDurationSeconds);
      const { uploadURL, uid } = uploadResponse;
      const uploadUrl = uploadURL; // Renomear para uploadUrl para consistência
      const videoId = uid; // Renomear uid para videoId para consistência
      const customerCode = null; // Não retornado pelo direct_upload, definir como null ou remover se não for usado
      const uploadType = null; // Não retornado pelo direct_upload, definir como null ou remover se não for usado
      console.log('StreamUploader: URL de upload recebida. videoId:', videoId, 'uploadType:', uploadType);

      // Fazer upload baseado no tipo
      if (uploadType === 'basic') {
        console.log('StreamUploader: Iniciando upload básico...');
        await streamApi.uploadBasic(file, uploadUrl, (progress, uploaded, total) => {
          setUploadProgress(progress);
          onUploadProgress?.(progress, uploaded, total);
          // console.log('StreamUploader: Progresso de upload básico:', progress);
        });
      } else {
        console.log('StreamUploader: Iniciando upload com TUS...');
        console.log("StreamUploader: uploadUrl antes de chamar uploadWithTus:", uploadUrl);
        await streamApi.uploadWithTus(file, uploadUrl, (progress, uploaded, total) => {
          setUploadProgress(progress);
          onUploadProgress?.(progress, uploaded, total);
          // console.log('StreamUploader: Progresso de upload TUS:', progress);
        });
      }

      // Aguardar processamento do vídeo
      setUploadProgress(100);
      console.log('StreamUploader: Upload concluído, aguardando processamento do vídeo...');
      const processedVideo = await streamApi.waitForProcessing(videoId);
      console.log('StreamUploader: Vídeo processado. Dados:', processedVideo);
      
      const result = {
        videoId,
        customerCode,
        uploadUrl: processedVideo.streamUrl,
        metadata: {
          ...metadata,
          width: processedVideo.metadata.width,
          height: processedVideo.metadata.height,
          duration: processedVideo.duration
        }
      };
      
      setUploadState('success');
      onUploadComplete?.(result);
      console.log('StreamUploader: Upload bem-sucedido. Resultado:', result);
      
    } catch (error) {
      console.error('StreamUploader: Erro no upload:', error);
      setUploadError(error.message);
      setUploadState('error');
      onUploadError?.(error);
    }
  };

  // Manipular seleção de arquivo
  const handleFileSelect = (event) => {
    console.log('StreamUploader: handleFileSelect acionado.');
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Manipular drag and drop
  const handleDrop = (event) => {
    console.log('StreamUploader: handleDrop acionado.');
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Cancelar upload
  const cancelUpload = () => {
    console.log('StreamUploader: cancelUpload acionado.');
    if (uploadRef.current) {
      uploadRef.current.abort();
    }
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFile(null);
    setUploadError(null);
    setVideoMetadata(null);
  };

  // Reset para novo upload
  const resetUpload = () => {
    console.log('StreamUploader: resetUpload acionado.');
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFile(null);
    setUploadError(null);
    setVideoMetadata(null);
  };

  // Formatação de tamanho de arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  console.log('StreamUploader: Renderizando com uploadState:', uploadState);
  return (
    <div className={`w-full ${className}`}>
      {uploadState === 'idle' && (
        <div
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold mb-2">Upload de Vídeo</h3>
          <p className="text-gray-400 mb-4">
            Arraste e solte seu arquivo aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500">
            Suporta: MP4, MOV, BRAW, R3D, ALEXA, Sony MXF, Cinema DNG
          </p>
          <Button className="mt-4">
            Selecionar Arquivo
          </Button>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileVideo className="text-blue-400" size={24} />
              <div>
                <h3 className="font-semibold">{uploadedFile?.name}</h3>
                <p className="text-sm text-gray-400">
                  {formatFileSize(uploadedFile?.size)} • {videoMetadata?.format}
                </p>
              </div>
            </div>
            <button
              onClick={cancelUpload}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Cancelar upload"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso do upload</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Loader className="animate-spin" size={16} />
            <span>Enviando para Cloudflare Stream...</span>
          </div>
        </div>
      )}

      {uploadState === 'success' && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="text-green-400" size={24} />
            <div>
              <h3 className="font-semibold text-green-400">Upload Concluído!</h3>
              <p className="text-sm text-gray-400">
                {uploadedFile?.name} foi enviado com sucesso
              </p>
            </div>
          </div>

          {videoMetadata && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Informações do Arquivo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Formato:</span>
                  <span className="ml-2 text-blue-400">{videoMetadata.format}</span>
                </div>
                <div>
                  <span className="text-gray-400">Color Space:</span>
                  <span className="ml-2 text-purple-400">{videoMetadata.colorSpace}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tamanho:</span>
                  <span className="ml-2">{formatFileSize(videoMetadata.size)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tipo:</span>
                  <span className="ml-2">{videoMetadata.isRaw ? 'RAW' : 'Processado'}</span>
                </div>
              </div>
            </div>
          )}

          <Button onClick={resetUpload} variant="outline">
            Enviar Outro Arquivo
          </Button>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="text-red-400" size={24} />
            <div>
              <h3 className="font-semibold text-red-400">Erro no Upload</h3>
              <p className="text-sm text-gray-400">{uploadError}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={() => handleFileUpload(uploadedFile)} variant="outline">
              Tentar Novamente
            </Button>
            <Button onClick={resetUpload} variant="outline">
              Selecionar Outro Arquivo
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default StreamUploader;

