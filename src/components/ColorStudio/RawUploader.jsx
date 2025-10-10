import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const RawUploader = ({ projectId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setProgress(0);
    setMessage(`Iniciando upload de ${file.name}...`);

    try {
      // 1. Iniciar o upload multipart no backend
      const initResponse = await axios.post(`${API_BASE_URL}/api/color-studio/upload-raw-init`, {
        filename: file.name,
        file_size: file.size,
        project_id: projectId,
        content_type: file.type || 'application/octet-stream',
      });

      if (!initResponse.data.success) {
        throw new Error(initResponse.data.error || 'Failed to initiate upload');
      }

      const { upload_id, key, bucket } = initResponse.data;
      const chunkSize = 5 * 1024 * 1024; // 5MB
      const totalParts = Math.ceil(file.size / chunkSize);
      const uploadedParts = [];

      setMessage(`Dividindo ${file.name} em ${totalParts} partes...`);

      for (let i = 0; i < totalParts; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const part = file.slice(start, end);

        setMessage(`Enviando parte ${i + 1}/${totalParts}...`);

        // 2. Obter URL pré-assinada para a parte
        const presignedUrlResponse = await axios.post(`${API_BASE_URL}/api/color-studio/upload-raw-part`, {
          upload_id,
          key,
          part_number: i + 1,
          bucket,
        });

        if (!presignedUrlResponse.data.success) {
          throw new Error(presignedUrlResponse.data.error || `Failed to get presigned URL for part ${i + 1}`);
        }

        const { presigned_url } = presignedUrlResponse.data;

        // 3. Fazer upload da parte diretamente para o R2
        const uploadPartResponse = await axios.put(presigned_url, part, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          onUploadProgress: (progressEvent) => {
            const partProgress = (progressEvent.loaded / progressEvent.total) * (100 / totalParts);
            setProgress(Math.min(99, Math.round((i * (100 / totalParts)) + partProgress)));
          },
        });

        uploadedParts.push({
          PartNumber: i + 1,
          ETag: uploadPartResponse.headers.etag,
        });
      }

      // 4. Completar o upload multipart
      setMessage('Finalizando upload...');
      const completeResponse = await axios.post(`${API_BASE_URL}/api/color-studio/upload-raw-complete`, {
        upload_id,
        key,
        bucket,
        parts: uploadedParts,
      });

      if (!completeResponse.data.success) {
        throw new Error(completeResponse.data.error || 'Failed to complete upload');
      }

      setMessage('Upload RAW concluído com sucesso!');
      setProgress(100);
      onUploadComplete(completeResponse.data.media_file); // Passar o objeto MediaFile completo

    } catch (error) {
      console.error('Erro no upload RAW:', error);
      setMessage(`Erro no upload: ${error.message || 'Verifique o console.'}`);
      setUploading(false);
      setProgress(0);
      // Opcional: abortar o upload multipart no R2 se algo der errado
      // if (upload_id && key && bucket) {
      //   await axios.post(`${API_BASE_URL}/api/color-studio/upload-raw-abort`, { upload_id, key, bucket });
      // }
    }
  }, [projectId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div className="raw-uploader-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="upload-progress">
            <p>{message}</p>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <span>{progress}%</span>
          </div>
        ) : (
          <p>Arraste e solte um arquivo RAW aqui, ou clique para selecionar</p>
        )}
      </div>
      <style jsx>{`
        .raw-uploader-container {
          margin-top: 20px;
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: border .24s ease-in-out;
        }
        .dropzone.active {
          border-color: #007bff;
        }
        .dropzone.uploading {
          cursor: not-allowed;
        }
        .upload-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .progress-bar-container {
          width: 80%;
          background-color: #e0e0e0;
          border-radius: 5px;
          margin-top: 10px;
          height: 20px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background-color: #28a745;
          width: 0%;
          border-radius: 5px;
          text-align: center;
          color: white;
          transition: width 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default RawUploader;

