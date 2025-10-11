/**
 * MAESTRO TIMELINE ARCHITECTURE
 * Fixed viewport, scrollable content, centered playhead
 * Like DaVinci Resolve / Premiere Pro
 */

/**
 * TIMELINE STRUCTURE:
 * 
 * ┌─────────────────────────────────────┐
 * │   FIXED VIEWPORT (Timeline Box)    │
 * │                                     │
 * │   ┌───────────────────────────┐    │
 * │   │  SCROLLABLE CONTENT       │    │
 * │   │  (clips, tracks, ruler)   │    │
 * │   │         ▼ PLAYHEAD (fixed)│    │
 * │   │                           │    │
 * │   └───────────────────────────┘    │
 * └─────────────────────────────────────┘
 */

export const TIMELINE_CONFIG = {
  // Fixed viewport dimensions
  VIEWPORT_WIDTH: '100%',
  VIEWPORT_HEIGHT: 'calc(100vh - 200px)',
  
  // Playhead position (fixed in viewport)
  PLAYHEAD_POSITION: '50%', // Center of viewport
  
  // Scale system (pixels per second)
  BASE_SCALE: 10, // 10px = 1 second at zoom 1.0
  MIN_ZOOM: 0.1,  // 1px = 1 second
  MAX_ZOOM: 20,   // 200px = 1 second
  
  // Timecode
  DEFAULT_START_TC: '00:00:00:00',
  FPS: 24
};

/**
 * Calculate pixel position from timecode
 * @param {number} time - Time in seconds
 * @param {number} zoom - Zoom level (0.1 to 20)
 * @param {number} startTime - Timeline start offset
 * @returns {number} Position in pixels
 */
export const timeToPixels = (time, zoom, startTime = 0) => {
  const relativeTime = time - startTime;
  return relativeTime * TIMELINE_CONFIG.BASE_SCALE * zoom;
};

/**
 * Calculate timecode from pixel position
 * @param {number} pixels - Pixel position
 * @param {number} zoom - Zoom level
 * @param {number} startTime - Timeline start offset
 * @returns {number} Time in seconds
 */
export const pixelsToTime = (pixels, zoom, startTime = 0) => {
  const relativeTime = pixels / (TIMELINE_CONFIG.BASE_SCALE * zoom);
  return relativeTime + startTime;
};

/**
 * Calculate scroll offset to center playhead
 * @param {number} currentTime - Current playhead time
 * @param {number} zoom - Zoom level
 * @param {number} viewportWidth - Width of visible area
 * @param {number} startTime - Timeline start offset
 * @returns {number} Scroll left position
 */
export const calculateScrollOffset = (currentTime, zoom, viewportWidth, startTime = 0) => {
  const playheadPixelPos = timeToPixels(currentTime, zoom, startTime);
  const viewportCenter = viewportWidth / 2;
  return playheadPixelPos - viewportCenter;
};

/**
 * Get visible time range in viewport
 * @param {number} scrollLeft - Current scroll position
 * @param {number} viewportWidth - Width of visible area
 * @param {number} zoom - Zoom level
 * @param {number} startTime - Timeline start offset
 * @returns {object} {startTime, endTime}
 */
export const getVisibleTimeRange = (scrollLeft, viewportWidth, zoom, startTime = 0) => {
  const startPixel = scrollLeft;
  const endPixel = scrollLeft + viewportWidth;
  
  return {
    startTime: pixelsToTime(startPixel, zoom, startTime),
    endTime: pixelsToTime(endPixel, zoom, startTime)
  };
};

/**
 * Format timecode with custom start offset
 * @param {number} seconds - Time in seconds
 * @param {number} fps - Frames per second
 * @param {string} startTC - Start timecode (HH:MM:SS:FF)
 * @returns {string} Formatted timecode
 */
export const formatTimecode = (seconds, fps = 24, startTC = '00:00:00:00') => {
  // Parse start timecode
  const [startH, startM, startS, startF] = startTC.split(':').map(Number);
  const startTotalFrames = (startH * 3600 + startM * 60 + startS) * fps + startF;
  
  // Add to current time
  const currentFrames = Math.floor(seconds * fps);
  const totalFrames = startTotalFrames + currentFrames;
  
  // Convert back to timecode
  const hours = Math.floor(totalFrames / (fps * 3600));
  const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const secs = Math.floor((totalFrames % (fps * 60)) / fps);
  const frames = totalFrames % fps;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
};

export default {
  TIMELINE_CONFIG,
  timeToPixels,
  pixelsToTime,
  calculateScrollOffset,
  getVisibleTimeRange,
  formatTimecode
};
