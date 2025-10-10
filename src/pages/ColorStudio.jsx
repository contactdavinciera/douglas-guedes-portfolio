import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RawUploader from '../components/ColorStudio/RawUploader';

const ColorStudio = () => {
  const { mediaFileId } = useParams();
  const navigate = useNavigate();
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploader, setShowUploader] = useState(!mediaFileId);

  useEffect(() => {
    if (mediaFileId) {
      loadMediaFile();
    }
  }, [mediaFileId]);

  const loadMediaFile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversion/conversion-status/${mediaFileId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar arquivo');
      }

      setMediaFile(data.media_file);
      setShowUploader(false);
    } catch (err) {
      console.error('Erro ao carregar media file:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (uploadedFile) => {
    console.log('Upload completo:', uploadedFile);
    setMediaFile(uploadedFile);
    setShowUploader(false);
    // Atualizar URL
    navigate(`/color-studio/${uploadedFile.id}`);
  };

  const handleNewUpload = () => {
    setMediaFile(null);
    setShowUploader(true);
    navigate('/color-studio');
  };

  const downloadRawFile = () => {
    if (mediaFile?.raw?.url) {
      window.open(mediaFile.raw.url, '_blank');
    }
  };

  // Modo Upload
  if (showUploader) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
              🎬 Color Studio
            </h1>
            <p style={{ color: '#666' }}>
              Faça upload de arquivos RAW (.braw, .r3d, etc) ou vídeos (.mp4, .mov) para começar
            </p>
          </div>

          <RawUploader 
            projectId={1} 
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #333',
            borderTop: '4px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <p style={{ fontSize: '48px', marginBottom: '20px' }}>❌</p>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>Erro: {error}</p>
          <button 
            onClick={handleNewUpload}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Voltar ao Upload
          </button>
        </div>
      </div>
    );
  }

  // Modo Player
  if (!mediaFile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>Arquivo não encontrado</p>
          <button 
            onClick={handleNewUpload}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Fazer Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      {/* Header */}
      <div style={{
        padding: '20px 40px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '5px' }}>
            {mediaFile.original_filename}
          </h1>
          <p style={{ fontSize: '14px', color: '#999' }}>
            {mediaFile.metadata.width}x{mediaFile.metadata.height} @ {mediaFile.metadata.fps}fps • 
            {mediaFile.metadata.codec} → H.265 • 
            {mediaFile.metadata.color_space} • 
            {mediaFile.metadata.bit_depth} bits
          </p>
        </div>
        
        <button 
          onClick={handleNewUpload}
          style={{
            padding: '8px 16px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          📤 Novo Upload
        </button>
      </div>

      {/* Video Player */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000',
        position: 'relative'
      }}>
        {mediaFile.proxy.stream_url ? (
          <video
            controls
            autoPlay
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
            src={mediaFile.proxy.stream_url}
          >
            Seu navegador não suporta vídeo HTML5.
          </video>
        ) : (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>🎬</p>
            <p>Proxy não disponível</p>
            {mediaFile.conversion.status === 'processing' && (
              <p style={{ marginTop: '10px', color: '#0070f3' }}>
                Processando... {mediaFile.conversion.progress}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div style={{
        padding: '20px 40px',
        background: '#2a2a2a',
        borderTop: '1px solid #3a3a3a',
        color: 'white'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>DURAÇÃO</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {Math.round(mediaFile.metadata.duration)}s
            </p>
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>RESOLUÇÃO</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {mediaFile.metadata.width}x{mediaFile.metadata.height}
            </p>
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>FRAME RATE</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {mediaFile.metadata.fps} fps
            </p>
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>CODEC</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {mediaFile.metadata.codec} → H.265
            </p>
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>COLOR SPACE</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {mediaFile.metadata.color_space}
            </p>
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>BIT DEPTH</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              {mediaFile.metadata.bit_depth} bits
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            🎨 Aplicar LUT
          </button>
          
          <button style={{
            padding: '12px 24px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            ⚙️ Ajustes de Cor
          </button>
          
          <button style={{
            padding: '12px 24px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            🎵 Audio
          </button>
          
          <button 
            onClick={downloadRawFile}
            style={{
              padding: '12px 24px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            💾 Baixar RAW Original
          </button>
          
          <button style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            ✅ Aprovar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ColorStudio;

