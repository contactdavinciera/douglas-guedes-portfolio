/**
 * MAESTRO THUMBNAIL SCRUBBER
 * Shows thumbnail preview when hovering over timeline ruler
 */

import React, { useState, useEffect, useRef } from 'react';

const MaestroScrubber = ({ 
  visible, 
  x, 
  y, 
  time, 
  thumbnailURL, 
  formatTimecode 
}) => {
  const scrubberRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && scrubberRef.current) {
      // Position above cursor
      const scrubberWidth = 160;
      const scrubberHeight = 130;
      
      let posX = x - scrubberWidth / 2;
      let posY = y - scrubberHeight - 20;

      // Keep within viewport
      if (posX < 10) posX = 10;
      if (posX + scrubberWidth > window.innerWidth - 10) {
        posX = window.innerWidth - scrubberWidth - 10;
      }
      if (posY < 10) posY = y + 20; // Show below if no space above

      setPosition({ x: posX, y: posY });
    }
  }, [visible, x, y]);

  if (!visible) return null;

  return (
    <div 
      ref={scrubberRef}
      className={`maestro-scrubber ${visible ? 'visible' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="maestro-scrubber-thumbnail">
        {thumbnailURL ? (
          <img src={thumbnailURL} alt="Preview" />
        ) : (
          <span>No Preview</span>
        )}
      </div>
      <div className="maestro-scrubber-timecode">
        {formatTimecode(time)}
      </div>
    </div>
  );
};

export default MaestroScrubber;
