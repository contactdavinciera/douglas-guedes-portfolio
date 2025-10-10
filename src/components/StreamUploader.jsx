import React, { useState, useRef, useCallback, useEffect } from 'react';
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

  const [uploadState, setUploadState] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [videoIdForPreview, setVideoIdForPreview] = useState(null);
  const fileInputRef = useRef(null);
  const uploadRef = useRef(null);

  // DEBUG: Monitorar mudanças de estado
  useEffect(() => {
    console.log('🔍 StreamUploader STATE CHANGED:', {
      uploadState,
      videoIdForPreview,
      hasMetadata: !!videoMetadata,
      shouldShowPreview: uploadState === 'success' && !!videoIdForPreview
    });
  }, [uploadState, videoIdForPreview, videoMetadata]);

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

  const handleFileUpload = async (file) => {
    console.log('StreamUploader: handleFileUpload acionado para:', file.name);
    try {
      setUploadState('uploading');
      setUploadProgress(0);
      setUploadError(null);
      setUploadedFile(file);
      setVideoIdForPreview(null); // Limpar preview anterior

      const metadata = analyzeFile(file);
      setVideoMetadata(metadata);

      console.log('StreamUploader: Estado de upload definido para "uploading".');
      console.log("StreamUploader: Iniciando upload de arquivo grande via proxy...");

      const uploadResult = await streamApi.uploadLargeFile(file, (progress, uploaded, total) => {
        setUploadProgress(progress);
        onUploadProgress?.(progress, uploaded, total);
      });

      setUploadProgress(100);
      console.log('StreamUploader: Upload concluído, aguardando processamento do vídeo...');

      const videoId = uploadResult.uid || uploadResult.videoId;
      if (!videoId) {
        throw new Error('ID do vídeo não retornado pelo upload');
      }

      console.log('StreamUploader: VideoId obtido:', videoId);
      
      // Definir videoId ANTES de esperar processamento
      setVideoIdForPreview(videoId);

      const processedVideo = await streamApi.waitForProcessing(videoId);
      console.log('StreamUploader: Vídeo processado. Dados:', processedVideo);

      const result = {
        videoId,
        customerCode: "5dr3ublgoe3wg2wj",
        uploadUrl: processedVideo.streamUrl || processedVideo.playback?.hls,
        metadata: {
          ...metadata,
          width: processedVideo.metadata?.width || processedVideo.input?.width,
          height: processedVideo.metadata?.height || processedVideo.input?.height,
          duration: processedVideo.duration
        }
      };

      setVideoMetadata(result.metadata);
      setUploadedFile(result);
      
      // Definir success por último
      console.log('StreamUploader: Definindo uploadState para "success"');
      setUploadState("success");
      
      onUploadComplete?.(result);
      console.log("StreamUploader: Upload bem-sucedido. Resultado:", result);

    } catch (error) {
      console.error('StreamUploader: Erro no upload:', error);
      setUploadError(error.message);
      setUploadState('error');
      setVideoIdForPreview(null);
      onUploadError?.(error);
    }
  };

  const handleFileSelect = (event) => {
    console.log('StreamUploader: handleFileSelect acionado.');
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

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
    setVideoIdForPreview(null);
  };

  const resetUpload = () => {
    console.log('StreamUploader: resetUpload acionado.');
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFile(null);
    setUploadError(null);
    setVideoMetadata(null);
    setVideoIdForPreview(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  console.log('StreamUploader: Renderizando com uploadState:', uploadState, 'videoId:', videoIdForPreview);

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      {uploadState === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Upload de Vídeo</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Arraste e solte seu arquivo aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500">
            Suporta: MP4, MOV, BRAW, R3D, ALEXA, Sony MXF, Cinema DNG
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button className="mt-4">
            Selecionar Arquivo
          </Button>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <FileVideo className="w-12 h-12 text-purple-500" />
            <div className="flex-1">
              <h3 className="font-semibold">{uploadedFile?.name}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(uploadedFile?.size)} • {videoMetadata?.format}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do upload</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Enviando para o Ateliê de Cores...</span>
          </div>
          <Button onClick={cancelUpload} variant="outline" className="w-full">
            Cancelar
          </Button>
        </div>
      )}

      {uploadState === 'success' && videoIdForPreview && (
        <div className="space-y-6">
          {/* DEBUG INFO */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-mono">
              <strong>Debug:</strong> State={uploadState} | VideoID={videoIdForPreview}
            </p>
          </div>

          {/* Video Player */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src={`https://customer-5dr3ublgoe3wg2wj.cloudflarestream.com/${videoIdForPreview}/iframe`}
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%'
              }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
            />
          </div>

          {/* Upload Success Message */}
          <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <CheckCircle className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                Upload Concluído!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-500">
                {videoMetadata?.name || 'Vídeo'} foi enviado com sucesso
              </p>
            </div>
          </div>

          {/* Video Metadata */}
          {videoMetadata && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Informações do Arquivo
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Formato:</span>
                  <span className="ml-2 font-medium">{videoMetadata.format}</span>
                </div>
                <div>
                  <span className="text-gray-500">Color Space:</span>
                  <span className="ml-2 font-medium">{videoMetadata.colorSpace}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tamanho:</span>
                  <span className="ml-2 font-medium">{formatFileSize(videoMetadata.size)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {videoMetadata.isRaw ? 'RAW' : 'Processado'}
                  </span>
                </div>
                {videoMetadata.width && videoMetadata.height && (
                  <div>
                    <span className="text-gray-500">Resolução:</span>
                    <span className="ml-2 font-medium">
                      {videoMetadata.width}x{videoMetadata.height}
                    </span>
                  </div>
                )}
                {videoMetadata.duration && (
                  <div>
                    <span className="text-gray-500">Duração:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(videoMetadata.duration)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <Button onClick={resetUpload} className="w-full" size="lg">
            <Upload className="w-4 h-4 mr-2" />
            Enviar Outro Arquivo
          </Button>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500">
            <AlertCircle className="w-12 h-12 text-red-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Erro no Upload
              </h3>
              <p className="text-sm text-red-600 dark:text-red-500">
                {uploadError}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Button onClick={() => handleFileUpload(uploadedFile)} variant="outline" className="flex-1">
              Tentar Novamente
            </Button>
            <Button onClick={resetUpload} className="flex-1">
              Selecionar Outro Arquivo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamUploader;

