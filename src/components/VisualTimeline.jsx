import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2 } from 'lucide-react';

/**
 * Timeline Visual tipo DaVinci Resolve
 * - Takes como retângulos arrastáveis
 * - Markers como bolinhas coloridas
 * - V1 (Video) + A1 (Audio) tracks separados
 * - Drag & drop para reordenar
 */
const VisualTimeline = ({
  takes = [],
  markers = [],
  selectedTakeId,
  currentTime = 0,
  onTakeSelect,
  onTakeReorder,
  onMarkerClick,
  onTimelineClick,
  onSeek, // NEW: Callback para scrubbing
  className = ''
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTake, setDraggedTake] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false); // NEW: Track scrubbing state

  // Calcular duração total
  const totalDuration = takes.reduce((sum, take) => sum + (take.duration || 120), 0);
  const pixelsPerSecond = (timelineWidth / totalDuration) * zoom;

  useEffect(() => {
    if (timelineRef.current) {
      setTimelineWidth(timelineRef.current.offsetWidth);
    }
  }, []);

  // Drag & drop handlers
  const handleDragStart = (e, take, index) => {
    setIsDragging(true);
    setDraggedTake({ take, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (draggedTake && draggedTake.index !== dropIndex) {
      // Reordenar takes
      const newTakes = [...takes];
      const [removed] = newTakes.splice(draggedTake.index, 1);
      newTakes.splice(dropIndex, 0, removed);
      
      if (onTakeReorder) {
        onTakeReorder(newTakes);
      }
    }
    
    setDraggedTake(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTake(null);
    setDragOverIndex(null);
  };

  // Converter timecode para posição X
  const getPositionX = (timecode) => {
    return (timecode * pixelsPerSecond) || 0;
  };

  // Converter posição X para timecode
  const getTimecodeFromX = (x) => {
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return 0;
    
    const relativeX = x - timelineRect.left - 12; // Offset do padding
    const timecode = relativeX / pixelsPerSecond;
    
    return Math.max(0, Math.min(timecode, totalDuration));
  };

  // Scrubbing handlers
  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
  };

  const handleTimelineMouseMove = (e) => {
    if (!isScrubbing) return;
    
    const newTime = getTimecodeFromX(e.clientX);
    if (onSeek) {
      onSeek(newTime);
    }
  };

  const handleTimelineMouseUp = () => {
    setIsScrubbing(false);
  };

  const handleTimelineClick = (e) => {
    if (isDragging || isScrubbing) return;
    
    const newTime = getTimecodeFromX(e.clientX);
    if (onSeek) {
      onSeek(newTime);
    }
  };

  // Global mouse up listener
  useEffect(() => {
    if (isScrubbing) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineMouseMove);
        document.removeEventListener('mouseup', handleTimelineMouseUp);
      };
    }
  }, [isScrubbing, pixelsPerSecond, totalDuration]);

  // Calcular posição acumulada dos takes
  let accumulatedTime = 0;
  const takesWithPositions = takes.map((take) => {
    const startTime = accumulatedTime;
    const duration = take.duration || 120;
    const width = duration * pixelsPerSecond;
    accumulatedTime += duration;
    
    return {
      ...take,
      startTime,
      duration,
      width: Math.max(width, 50) // Mínimo 50px
    };
  });

  return (
    <div className={`flex flex-col h-full bg-gray-950 ${className}`}>
      {/* Toolbar da Timeline */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">
            {String(Math.floor(currentTime / 60)).padStart(2, '0')}:
            {String(Math.floor(currentTime % 60)).padStart(2, '0')}:
            {String(Math.floor((currentTime % 1) * 24)).padStart(2, '0')}
          </span>
          <div className="h-3 w-px bg-gray-700" />
          <span className="text-xs text-gray-500">
            {takes.length} takes · {totalDuration}s
          </span>
        </div>
        
        <div className="flex items-center gap-2 opacity-70">
          <span className="text-xs text-gray-400">Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">{(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden bg-black"
        onClick={handleTimelineClick}
      >
        <div className="min-w-full p-3 space-y-2">
          {/* Timeline ruler (acima dos takes) */}
          <div className="h-6 flex items-center px-3 mb-1">
            <div className="flex gap-8 text-[10px] text-white font-mono">
              {[...Array(Math.ceil(totalDuration / 10))].map((_, i) => (
                <span key={i}>
                  {String(Math.floor((i * 10) / 60)).padStart(2, '0')}:
                  {String((i * 10) % 60).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>

          {/* Track V2 - Video */}
          <div className="relative h-16 bg-gray-900/50 rounded border border-gray-800/50">
            <div className="absolute left-2 top-2 text-[11px] font-mono text-gray-500 bg-gray-950 px-1 rounded">
              V2
            </div>
          </div>

          {/* Track V1 - Video */}
          <div className="relative h-18 bg-gray-900 rounded border border-gray-800">
            <div className="absolute left-2 top-2 text-xs font-mono text-gray-500 bg-gray-950 px-1 rounded">
              V1
            </div>
            
            <div className="absolute inset-0 flex items-center px-2">
              <div className="relative flex gap-1 items-center h-12">
                {takesWithPositions.map((take, index) => (
                  <div
                    key={take.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, take, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation(); // Não interfere no scrubbing
                      // Single click = não faz nada (evita mudar layout)
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      // Duplo clique = carrega no SOURCE monitor
                      if (onTakeSelect) {
                        onTakeSelect(take);
                      }
                    }}
                    className={`
                      relative h-12 rounded cursor-pointer transition-all
                      ${selectedTakeId === take.id 
                        ? 'bg-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-500/50' 
                        : 'bg-blue-700 hover:bg-blue-600 border border-blue-800'
                      }
                      ${isDragging && draggedTake?.take.id === take.id ? 'opacity-50' : ''}
                      ${dragOverIndex === index ? 'ring-2 ring-yellow-500' : ''}
                    `}
                    style={{ 
                      width: `${take.width}px`,
                      minWidth: '50px'
                    }}
                  >
                    {/* Take name */}
                    <div className="absolute inset-0 flex items-center px-2 truncate">
                      <span className="text-xs font-medium text-white truncate">
                        {take.name}
                      </span>
                    </div>
                    
                    {/* Duration */}
                    <div className="absolute bottom-0 right-1 text-[9px] text-blue-200">
                      {take.duration}s
                    </div>
                    
                    {/* Markers no take */}
                    {markers
                      .filter(m => m.take_id === take.id)
                      .map((marker) => {
                        const markerX = (marker.timecode / take.duration) * take.width;
                        return (
                          <div
                            key={marker.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkerClick && onMarkerClick(marker);
                            }}
                            className="absolute top-0 w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform"
                            style={{ 
                              left: `${markerX}px`,
                              backgroundColor: marker.color || '#ef4444'
                            }}
                            title={marker.text}
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Track A2 - Audio */}
          <div className="relative h-14 bg-gray-900/50 rounded border border-gray-800/50">
            <div className="absolute left-2 top-2 text-[11px] font-mono text-gray-500 bg-gray-950 px-1 rounded flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              A2
            </div>
          </div>

          {/* Track A1 - Audio */}
          <div className="relative h-14 bg-gray-900 rounded border border-gray-800">
            <div className="absolute left-2 top-2 text-xs font-mono text-gray-500 bg-gray-950 px-1 rounded flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              A1
            </div>
            
            <div className="absolute inset-0 flex items-center px-2">
              <div className="relative flex gap-1 items-center h-8">
                {takesWithPositions.map((take) => (
                  <div
                    key={`audio-${take.id}`}
                    className="relative h-8 bg-green-900/30 border border-green-700 rounded"
                    style={{ 
                      width: `${take.width}px`,
                      minWidth: '50px'
                    }}
                  >
                    {/* Waveform placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-4 bg-green-600/20 rounded-sm flex items-center justify-around px-1">
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i}
                            className="w-px bg-green-500/50"
                            style={{ height: `${Math.random() * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Playhead - Batuta de Maestro 🎭 */}
          <div
            className="absolute z-10 cursor-ew-resize pointer-events-none"
            style={{ 
              left: `${getPositionX(currentTime) + 12}px`,
              top: '24px', // Logo após o timecode
              bottom: '24px' // Para antes do zoom
            }}
          >
            {/* Esfera branca (ponta da batuta) */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md z-20 pointer-events-auto"
                 onMouseDown={handlePlayheadMouseDown}>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-full" />
              {/* Brilho */}
              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/90 rounded-full" />
            </div>
            
            {/* Cabo da batuta (madeira) */}
            <div 
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '6px',
                width: '2px',
                height: '12px',
                background: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
                borderRadius: '1px'
              }}
            />
            
            {/* Linha dourada (corpo principal - só na altura dos takes) */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '18px',
                bottom: '0',
                width: '1.5px',
                background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 70%, #FF8C00 100%)',
                boxShadow: '0 0 4px rgba(255, 215, 0, 0.5)'
              }}
            />
            
            {/* Área de arrasto (só no topo) */}
            <div className="absolute -top-4 -left-3 -right-3 h-8 cursor-ew-resize pointer-events-auto"
                 onMouseDown={handlePlayheadMouseDown} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualTimeline;
