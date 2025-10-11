/**
 * MAESTRO WAVEFORM COMPONENT
 * Generates audio waveforms for timeline clips
 */

import React, { useEffect, useRef } from 'react';

const MaestroWaveform = ({ audioURL, width, height, color = '#22c55e' }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audioURL || !canvasRef.current) return;

    generateWaveform();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioURL, width, height]);

  const generateWaveform = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Fetch audio file
      const response = await fetch(audioURL);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get audio data
      const rawData = audioBuffer.getChannelData(0); // Mono or left channel
      const samples = Math.floor(rawData.length / width); // Samples per pixel
      const amp = height / 2;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;

        // Find min and max in this sample range
        for (let j = 0; j < samples; j++) {
          const datum = rawData[Math.floor(i * samples + j)];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        // Draw line for this pixel
        const yMin = (1 + min) * amp;
        const yMax = (1 + max) * amp;

        if (i === 0) {
          ctx.moveTo(i, yMin);
        }

        ctx.lineTo(i, yMin);
        ctx.lineTo(i, yMax);
      }

      ctx.stroke();

      // Add glow effect
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
      ctx.stroke();

    } catch (error) {
      console.error('Waveform generation error:', error);
      // Draw placeholder
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.fillRect(0, height / 2 - 2, width, 4);
    }
  };

  return (
    <div className="maestro-waveform">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default MaestroWaveform;
