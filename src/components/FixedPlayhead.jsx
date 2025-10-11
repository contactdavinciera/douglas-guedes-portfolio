import React from 'react';

/**
 * FIXED PLAYHEAD - Always centered in viewport
 * Does NOT move with scroll or zoom
 * Acts as the "sun" - everything moves around it
 */
const FixedPlayhead = ({ currentTime, formatTimecode }) => {
  return (
    <>
      {/* Playhead Line - Fixed at 50% of viewport */}
      <div 
        className="fixed-playhead pointer-events-none z-50"
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          transform: 'translateX(-50%)',
          width: '2px',
          background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
        }}
      >
        {/* Playhead Handle (top) */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #FFD700'
          }}
        />
        
        {/* Timecode Display */}
        <div
          className="playhead-timecode"
          style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#FFD700',
            color: '#000',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {formatTimecode(currentTime)}
        </div>
      </div>
    </>
  );
};

export default FixedPlayhead;
