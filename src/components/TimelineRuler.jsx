import React, { useRef, useState, useEffect } from 'react';

const TimelineRuler = ({ 
  duration, 
  currentTime, 
  onSeek, 
  zoomLevel = 1, 
  projectSettings 
}) => {
  const rulerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);

  const fps = projectSettings?.framerate || 24;

  // Format timecode HH:MM:SS:FF
  const formatTimecode = (seconds) => {
    const totalFrames = Math.floor(seconds * fps);
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const secs = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Calculate time from mouse position
  const getTimeFromPosition = (clientX) => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const scale = zoomLevel * 10; // pixels per second
    const time = x / scale;
    return Math.max(0, Math.min(duration, time));
  };

  // Handle mouse down on ruler
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const newTime = getTimeFromPosition(e.clientX);
    onSeek(newTime);
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newTime = getTimeFromPosition(e.clientX);
        onSeek(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, zoomLevel]);

  // Generate tick marks - INFINITE RULER
  const generateTicks = () => {
    const ticks = [];
    
    // Dynamic tick interval based on zoom
    // At zoom 1x: tick every 10s, major every 60s (1 minute)
    // At zoom 5x: tick every 2s, major every 10s
    let tickInterval;
    let majorTickInterval;
    
    if (zoomLevel >= 5) {
      tickInterval = 1; // Every second
      majorTickInterval = 10; // Every 10 seconds
    } else if (zoomLevel >= 2) {
      tickInterval = 5; // Every 5 seconds
      majorTickInterval = 30; // Every 30 seconds
    } else {
      tickInterval = 10; // Every 10 seconds
      majorTickInterval = 60; // Every minute
    }
    
    // Generate ticks for the ENTIRE timeline duration
    const maxTime = duration;
    const scale = zoomLevel * 10; // pixels per second
    
    for (let i = 0; i <= maxTime; i += tickInterval) {
      const isMajor = i % majorTickInterval === 0;
      const positionPx = i * scale; // Position in pixels
      
      ticks.push({
        time: i,
        positionPx,
        isMajor
      });
    }
    
    return ticks;
  };

  const ticks = generateTicks();

  return (
    <div className="timeline-ruler-container">
      {/* Timecode Display */}
      <div className="timeline-ruler-header bg-[#1a1a1a] border-b border-gray-700 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 font-mono">TIMECODE</span>
          <span className="text-sm text-blue-400 font-mono font-bold">
            {formatTimecode(currentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{fps} fps</span>
          <span>•</span>
          <span>{projectSettings?.colorSpace || 'SDR'}</span>
        </div>
      </div>

      {/* Ruler */}
      <div
        ref={rulerRef}
        className="timeline-ruler relative h-8 bg-[#252525] border-b border-gray-700 cursor-crosshair select-none overflow-hidden"
        style={{ width: `${duration * zoomLevel * 10}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          if (!isDragging) {
            setHoverTime(getTimeFromPosition(e.clientX));
          }
        }}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Ticks */}
        <div className="absolute inset-0" style={{ width: '100%' }}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="absolute top-0"
              style={{ left: `${tick.positionPx}px` }}
            >
              {/* Tick line */}
              <div
                className={`w-px ${tick.isMajor ? 'h-4 bg-gray-400' : 'h-2 bg-gray-600'}`}
              />
              
              {/* Time label (only for major ticks) */}
              {tick.isMajor && (
                <div className="absolute top-5 left-0 transform -translate-x-1/2 text-[10px] text-gray-400 font-mono whitespace-nowrap">
                  {formatTimecode(tick.time)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hover indicator */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-400 pointer-events-none"
            style={{ left: `${hoverTime * zoomLevel * 10}px` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-mono whitespace-nowrap">
              {formatTimecode(hoverTime)}
            </div>
          </div>
        )}

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#FFD700] pointer-events-none z-10"
          style={{ left: `${currentTime * zoomLevel * 10}px` }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-[#FFD700] rotate-45 border border-yellow-600" />
        </div>
      </div>
    </div>
  );
};

export default TimelineRuler;
