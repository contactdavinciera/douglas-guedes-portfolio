import React, { useState, useRef } from 'react';

const RawUploader = ({ projectId = 1, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Detectar tipo de arquivo
  const analyzeFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    
    const formats = {
      // RAW Formats
      'braw': { name: 'Blackmagic RAW', icon: '🎬', color: '#ff6b35', isRaw: true },
      'r3d': { name: 'RED RAW', icon: '🎬', color: '#dc143c', isRaw: true },
      'ari': { name: 'ARRI RAW', icon: '🎬', color: '#0066cc', isRaw: true },
      'arri': { name: 'ARRI RAW', icon: '🎬', color: '#0066cc', isRaw: true },
      'dng': { name: 'DNG Sequence', icon: '🎬', color: '#ff8c00', isRaw: true },
      // Video Formats
      'mp4': { name: 'MP4', icon: '🎥', color: '#4ecdc4', isRaw: false },
      'mov': { name: 'QuickTime', icon: '🎥', color: '#5856d6', isRaw: false },
      'avi': { name: 'AVI', icon: '🎥', color: '#34c759', isRaw: false },
      'mxf': { name: 'MXF', icon: '🎥', color: '#ff9500', isRaw: false },
      'prores': { name: 'ProRes', icon: '🎥', color: '#af52de', isRaw: false }
    };

    const formatInfo = formats[ext] || { 
      name: 'Unknown', 
      icon: '❓', 
      color: '#95a5a6', 
      isRaw: false 
    };

    return {
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      extension: ext.toUpperCase(),
      formatInfo,
      isRaw: formatInfo.isRaw,
      status: 'pending',
      progress: 0,
      message: ''
    };
  };

  // Formatar tamanho
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Selecionar arquivos
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const analyzed = files.map(analyzeFile);
    setSelectedFiles(prev => [...prev, ...analyzed]);
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const analyzed = files.map(analyzeFile);
    setSelectedFiles(prev => [...prev, ...analyzed]);
  };

  // Remover arquivo
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Limpar tudo
  const clearAll = () => {
    setSelectedFiles([]);
    setUploadingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update helpers
  const updateFileProgress = (fileId, progress, message) => {
    setUploadingFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, progress, message } : f
    ));
  };

  const updateFileStatus = (fileId, status, message) => {
    setUploadingFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status, message, progress: status === 'complete' ? 100 : f.progress } : f
    ));
  };

  // Upload RAW (R2 + Conversão + Stream)
  const uploadRawFile = async (fileData) => {
    try {
      updateFileProgress(fileData.id, 5, 'Preparando upload...');

      // 1. Criar media file
      const createResponse = await fetch('/api/upload/create-media-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          filename: fileData.name,
          file_size: fileData.size,
          mime_type: fileData.file.type || 'application/octet-stream'
        })
      });

      const createData = await createResponse.json();
      if (!createData.success) throw new Error(createData.error);

      const mediaId = createData.media_file_id;

      // 2. Iniciar multipart upload
      updateFileProgress(fileData.id, 10, 'Iniciando upload...');

      const initResponse = await fetch('/api/upload/initiate-multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_file_id: mediaId,
          filename: fileData.name,
          file_size: fileData.size
        })
      });

      const initData = await initResponse.json();
      if (!initData.success) throw new Error(initData.error);

      const { upload_id, key } = initData;

      // 3. Upload em chunks
      const chunkSize = 5 * 1024 * 1024; // 5MB
      const totalChunks = Math.ceil(fileData.size / chunkSize);
      const uploadedParts = [];

      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, fileData.size);
        const chunk = fileData.file.slice(start, end);

        const uploadPercent = Math.round((partNumber / totalChunks) * 60);
        updateFileProgress(fileData.id, 10 + uploadPercent, `Enviando... ${uploadPercent}%`);

        // Obter URL
        const urlResponse = await fetch('/api/upload/get-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media_file_id: mediaId, upload_id, key, part_number: partNumber })
        });

        const urlData = await urlResponse.json();
        if (!urlData.success) throw new Error('Erro ao obter URL');

        // Upload chunk
        const uploadResponse = await fetch(urlData.upload_url, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': 'application/octet-stream' }
        });

        if (!uploadResponse.ok) throw new Error(`Erro no upload parte ${partNumber}`);

        const etag = uploadResponse.headers.get('ETag').replace(/"/g, '');
        uploadedParts.push({ PartNumber: partNumber, ETag: etag });
      }

      // 4. Completar upload
      updateFileProgress(fileData.id, 75, 'Finalizando upload...');

      const completeResponse = await fetch('/api/upload/complete-multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_file_id: mediaId, upload_id, key, parts: uploadedParts })
      });

      const completeData = await completeResponse.json();
      if (!completeData.success) throw new Error('Erro ao completar upload');

      // 5. Iniciar conversão AUTOMÁTICA
      updateFileProgress(fileData.id, 80, 'Processando vídeo...');

      const conversionResponse = await fetch('/api/conversion/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_file_id: mediaId })
      });

      const conversionData = await conversionResponse.json();
      if (!conversionData.success) throw new Error('Erro ao processar');

      // 6. Aguardar conversão + upload para Stream
      await pollConversionStatus(fileData.id, mediaId);

    } catch (error) {
      console.error('Erro:', error);
      updateFileStatus(fileData.id, 'error', error.message);
    }
  };

  // Upload Video (Stream direto)
  const uploadVideoFile = async (fileData) => {
    try {
      updateFileProgress(fileData.id, 10, 'Preparando upload...');

      // Get upload URL
      const response = await fetch('/api/stream/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileData.name,
          file_size: fileData.size
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Upload via TUS
      updateFileProgress(fileData.id, 30, 'Enviando...');

      const tusUpload = await fetch(data.upload_url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'Tus-Resumable': '1.0.0'
        },
        body: fileData.file
      });

      if (!tusUpload.ok) throw new Error('Erro no upload');

      updateFileProgress(fileData.id, 80, 'Processando...');

      // Poll status
      await pollStreamStatus(fileData.id, data.video_id);

    } catch (error) {
      console.error('Erro:', error);
      updateFileStatus(fileData.id, 'error', error.message);
    }
  };

  // Poll conversão (RAW)
  const pollConversionStatus = async (fileId, mediaId) => {
    const maxAttempts = 120;
    let attempts = 0;

    const check = async () => {
      try {
        const response = await fetch(`/api/conversion/conversion-status/${mediaId}`);
        const data = await response.json();

        if (!data.success) throw new Error('Erro ao verificar status');

        const status = data.media_file.conversion.status;
        const progress = data.media_file.conversion.progress || 0;

        updateFileProgress(fileId, 80 + Math.round(progress / 5), `Processando... ${progress}%`);

        if (status === 'completed') {
          updateFileStatus(fileId, 'complete', '✅ Pronto para visualizar!');
          if (onUploadComplete) onUploadComplete(data.media_file);
          return;
        }

        if (status === 'failed') throw new Error('Erro no processamento');

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 5000);
        } else {
          throw new Error('Timeout no processamento');
        }
      } catch (error) {
        updateFileStatus(fileId, 'error', error.message);
      }
    };

    check();
  };

  // Poll stream (Video)
  const pollStreamStatus = async (fileId, videoId) => {
    const maxAttempts = 60;
    let attempts = 0;

    const check = async () => {
      try {
        const response = await fetch(`/api/stream/video-status?videoId=${videoId}`);
        const data = await response.json();

        if (!data.success) throw new Error('Erro ao verificar status');

        if (data.status === 'ready') {
          updateFileStatus(fileId, 'complete', '✅ Pronto para visualizar!');
          return;
        }

        if (data.status === 'error') throw new Error('Erro no processamento');

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 3000);
        } else {
          throw new Error('Timeout no processamento');
        }
      } catch (error) {
        updateFileStatus(fileId, 'error', error.message);
      }
    };

    check();
  };

  // Iniciar upload
  const startUpload = () => {
    const filesToUpload = selectedFiles.map(f => ({
      ...f,
      status: 'uploading',
      progress: 0,
      message: 'Iniciando...'
    }));

    setUploadingFiles(filesToUpload);
    setSelectedFiles([]);

    // Upload cada arquivo
    filesToUpload.forEach(fileData => {
      if (fileData.isRaw) {
        uploadRawFile(fileData);
      } else {
        uploadVideoFile(fileData);
      }
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Drop Zone */}
      {selectedFiles.length === 0 && uploadingFiles.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '3px dashed #0070f3' : '2px dashed #ccc',
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? '#f0f8ff' : '#fafafa',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>
            {isDragging ? '📥' : '📤'}
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Suporta: .braw, .r3d, .ari, .mp4, .mov, .mxf e mais
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".braw,.r3d,.ari,.arri,.dng,.mp4,.mov,.avi,.mxf,.prores"
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Preview dos Arquivos Selecionados */}
      {selectedFiles.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>
              📋 {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#0070f3',
                border: '2px solid #0070f3',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ➕ Adicionar Mais
            </button>
          </div>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            {selectedFiles.map(fileData => (
              <div
                key={fileData.id}
                style={{
                  border: `2px solid ${fileData.formatInfo.color}`,
                  borderRadius: '8px',
                  padding: '16px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Icon */}
                <div style={{
                  fontSize: '32px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${fileData.formatInfo.color}15`,
                  borderRadius: '8px',
                  flexShrink: 0
                }}>
                  {fileData.formatInfo.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileData.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                    <span><strong>Formato:</strong> {fileData.extension}</span>
                    <span><strong>Tamanho:</strong> {formatFileSize(fileData.size)}</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileData.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    color: '#dc3545',
                    border: '1px solid #dc3545',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={startUpload}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              🚀 Iniciar Upload
            </button>
            <button
              onClick={clearAll}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>
      )}

      {/* Arquivos em Upload */}
      {uploadingFiles.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            ⚡ Uploads em Andamento
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {uploadingFiles.map(fileData => (
              <div
                key={fileData.id}
                style={{
                  border: `2px solid ${fileData.formatInfo.color}`,
                  borderRadius: '8px',
                  padding: '16px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Icon */}
                <div style={{
                  fontSize: '32px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${fileData.formatInfo.color}15`,
                  borderRadius: '8px',
                  flexShrink: 0
                }}>
                  {fileData.formatInfo.icon}
                </div>

                {/* Info & Progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileData.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    <span><strong>Formato:</strong> {fileData.extension}</span>
                    <span><strong>Tamanho:</strong> {formatFileSize(fileData.size)}</span>
                  </div>
                  
                  <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '4px', height: '8px' }}>
                    <div 
                      style={{
                        width: `${fileData.progress}%`,
                        height: '100%',
                        background: fileData.status === 'error' ? '#dc3545' : '#28a745',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease-in-out'
                      }}
                    ></div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {fileData.message} ({fileData.progress}%)
                  </p>
                </div>

                {/* Status Icon */}
                <div style={{ fontSize: '24px', flexShrink: 0 }}>
                  {fileData.status === 'uploading' && '⏳'}
                  {fileData.status === 'complete' && '✅'}
                  {fileData.status === 'error' && '❌'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão para novo upload se houver uploads concluídos */}
      {uploadingFiles.length > 0 && selectedFiles.length === 0 && uploadingFiles.every(f => f.status !== 'uploading') && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={clearAll}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            ➕ Fazer Novo Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default RawUploader;

