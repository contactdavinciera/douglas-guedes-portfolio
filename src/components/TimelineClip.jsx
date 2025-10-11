import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Lock, Unlock } from 'lucide-react';
import * as ClipInteractions from '@/services/clipInteractions';

const TimelineClip = ({ 
  clip, 
  allClips,
  tracks,
  scale, 
  onMove, 
  onTrim,
  onSelect,
  isSelected,
  duration,
  snapEnabled = true
}) => {
  const clipRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move', 'trim-start', 'trim-end'
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });
  const [hoverEdge, setHoverEdge] = useState(null);
  const [snapIndicator, setSnapIndicator] = useState(null);

  // Calculate position and size
  // Scale is pixels per second
  const clipWidth = Math.max(1, clip.duration * scale); // Minimum 1px
  const clipLeft = clip.startTime * scale;

  // Get track info
  const track = tracks.find(t => t.id === clip.track);
  const isLocked = track?.locked || false;

  // Debug
  console.log(`Clip ${clip.id}: left=${clipLeft}px, width=${clipWidth}px, scale=${scale}`);

  // Handle mouse down - start drag/trim
  const handleMouseDown = (e, type) => {
    if (isLocked) return;
    
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    onSelect(clip.id, e.shiftKey);

    setIsDragging(true);
    setDragType(type);
    setDragStart({
      x: e.clientX,
      time: clip.startTime,
      inPoint: clip.inPoint || 0,
      outPoint: clip.outPoint || clip.duration
    });
    
    console.log(`Start drag ${type}:`, { x: e.clientX, time: clip.startTime });
  };

  // Handle mouse move - drag/trim
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / scale;

      if (dragType === 'move') {
        let newTime = Math.max(0, dragStart.time + deltaTime); // Prevent negative time

        // Snap if enabled
        if (snapEnabled) {
          const snap = ClipInteractions.findSnapPoint(
            clip,
            allClips,
            newTime
          );

          if (snap) {
            newTime = snap.newTime;
            setSnapIndicator(snap);
          } else {
            setSnapIndicator(null);
          }
        }

        // Validate move
        const validation = ClipInteractions.validateClipMove(
          clip,
          newTime,
          clip.track,
          allClips,
          tracks
        );

        if (validation.valid) {
          onMove(clip.id, newTime, clip.track);
        } else {
          console.warn('Invalid move:', validation.reason);
        }

      } else if (dragType === 'trim-start' || dragType === 'trim-end') {
        const trimResult = ClipInteractions.calculateTrim(
          clip,
          dragType === 'trim-start' ? 'start' : 'end',
          deltaTime,
          0.1 // minimum duration
        );

        if (trimResult) {
          onTrim(clip.id, trimResult);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setSnapIndicator(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStart, clip, scale, snapEnabled, allClips, tracks, onMove, onTrim]);

  // Detect edge hover for trim cursor
  const handleMouseMove = (e) => {
    if (isDragging || isLocked) return;

    const rect = clipRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const EDGE_THRESHOLD = 8;

    if (x < EDGE_THRESHOLD) {
      setHoverEdge('start');
    } else if (x > rect.width - EDGE_THRESHOLD) {
      setHoverEdge('end');
    } else {
      setHoverEdge(null);
    }
  };

  // Get cursor style
  const getCursor = () => {
    if (isLocked) return 'not-allowed';
    if (isDragging) return 'grabbing';
    if (hoverEdge === 'start' || hoverEdge === 'end') return 'ew-resize';
    return 'grab';
  };

  // Get media type color
  const getClipColor = () => {
    if (track?.type === 'video') return 'bg-purple-600';
    if (track?.type === 'audio') return 'bg-green-600';
    return 'bg-gray-600';
  };

  return (
    <>
      <div
        ref={clipRef}
        className={`
          absolute top-1 bottom-1 rounded overflow-hidden
          border-2 transition-all
          ${isSelected ? 'border-yellow-400' : 'border-transparent'}
          ${getClipColor()}
          ${isLocked ? 'opacity-50' : 'opacity-100'}
        `}
        style={{
          left: `${clipLeft}px`,
          width: `${clipWidth}px`,
          cursor: getCursor()
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverEdge(null)}
      >
        {/* Clip content */}
        <div className="relative h-full px-2 py-1 text-white text-xs flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-hidden">
            {isLocked && <Lock className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate font-medium">{clip.id}</span>
          </div>
          
          {/* Duration badge */}
          <span className="text-[10px] bg-black/30 px-1 rounded">
            {clip.duration.toFixed(1)}s
          </span>
        </div>

        {/* Trim handles */}
        {!isLocked && (
          <>
            {/* Start trim handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400/50 cursor-ew-resize hover:bg-yellow-400"
              onMouseDown={(e) => handleMouseDown(e, 'trim-start')}
            />

            {/* End trim handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 bg-yellow-400/50 cursor-ew-resize hover:bg-yellow-400"
              onMouseDown={(e) => handleMouseDown(e, 'trim-end')}
            />
          </>
        )}

        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 border border-yellow-400 pointer-events-none" />
        )}
      </div>

      {/* Snap indicator */}
      {snapIndicator && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-50"
          style={{ left: `${snapIndicator.time * scale}px` }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-[10px] px-1 rounded whitespace-nowrap">
            SNAP
          </div>
        </div>
      )}
    </>
  );
};

export default TimelineClip;
