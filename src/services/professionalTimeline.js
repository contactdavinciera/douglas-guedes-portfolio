/**
 * ═══════════════════════════════════════════════════════════
 * MAESTRO NLE - PROFESSIONAL TIMELINE ARCHITECTURE
 * ═══════════════════════════════════════════════════════════
 * 
 * Based on industry-standard NLE principles:
 * - DaVinci Resolve
 * - Adobe Premiere Pro  
 * - Final Cut Pro
 * - Avid Media Composer
 * 
 * CORE PRINCIPLES:
 * 1. Time-based coordinate system (not pixels)
 * 2. Fixed playhead in viewport center
 * 3. Scrollable content under fixed playhead
 * 4. Zoom affects scale, not structure
 * 5. Frame-accurate positioning
 * ═══════════════════════════════════════════════════════════
 */

/**
 * COORDINATE SYSTEM
 * ═══════════════════
 * 
 * Everything is positioned in TIME, then converted to PIXELS
 * 
 * Time → Pixels: position = (time - viewportStartTime) * scale
 * Pixels → Time: time = (position / scale) + viewportStartTime
 * 
 * Scale = pixels per second
 * - Zoom 0.5x = 5 pixels/second
 * - Zoom 1.0x = 10 pixels/second
 * - Zoom 2.0x = 20 pixels/second
 * - Zoom 10x = 100 pixels/second
 */

export const TIMELINE_CONSTANTS = {
  // Base scale (pixels per second at zoom 1.0)
  BASE_SCALE: 10,
  
  // Zoom limits
  MIN_ZOOM: 0.1,   // 1 pixel = 1 second
  MAX_ZOOM: 50,    // 500 pixels = 1 second
  
  // Playhead position (percentage of viewport width)
  PLAYHEAD_POSITION: 0.5, // 50% = center
  
  // Frame rates
  FRAMERATES: {
    '23.976': 23.976,
    '24': 24,
    '25': 25,
    '29.97': 29.97,
    '30': 30,
    '50': 50,
    '59.94': 59.94,
    '60': 60
  },
  
  // Minimum visible duration (seconds)
  MIN_VISIBLE_DURATION: 60,
  
  // Padding before/after content (seconds)
  TIMELINE_PADDING: 300 // 5 minutes
};

/**
 * Timeline State Manager
 * Manages the viewport and content positioning
 */
export class TimelineState {
  constructor(options = {}) {
    this.currentTime = options.currentTime || 0;
    this.zoom = options.zoom || 1.0;
    this.fps = options.fps || 24;
    this.viewportWidth = options.viewportWidth || 1920;
    this.startTimecode = options.startTimecode || '00:00:00:00';
    
    // Calculate derived values
    this.scale = TIMELINE_CONSTANTS.BASE_SCALE * this.zoom;
    this.playheadPixelOffset = this.viewportWidth * TIMELINE_CONSTANTS.PLAYHEAD_POSITION;
  }
  
  /**
   * Get the time range visible in viewport
   */
  getVisibleTimeRange() {
    const visibleDuration = this.viewportWidth / this.scale;
    const startTime = this.currentTime - (visibleDuration * TIMELINE_CONSTANTS.PLAYHEAD_POSITION);
    const endTime = startTime + visibleDuration;
    
    return { startTime, endTime, duration: visibleDuration };
  }
  
  /**
   * Get scroll position to center playhead
   */
  getScrollPosition() {
    const playheadPosition = this.currentTime * this.scale;
    return playheadPosition - this.playheadPixelOffset;
  }
  
  /**
   * Convert time to pixel position in scrollable content
   */
  timeToPixel(time) {
    return time * this.scale;
  }
  
  /**
   * Convert pixel position to time
   */
  pixelToTime(pixel) {
    return pixel / this.scale;
  }
  
  /**
   * Convert pixel position relative to viewport to time
   */
  viewportPixelToTime(viewportPixel) {
    const { startTime } = this.getVisibleTimeRange();
    return startTime + (viewportPixel / this.scale);
  }
  
  /**
   * Get total content width in pixels
   */
  getContentWidth(maxClipEnd) {
    const totalDuration = Math.max(
      maxClipEnd + TIMELINE_CONSTANTS.TIMELINE_PADDING,
      this.currentTime + TIMELINE_CONSTANTS.TIMELINE_PADDING
    );
    return totalDuration * this.scale;
  }
  
  /**
   * Update zoom and maintain playhead center
   */
  setZoom(newZoom) {
    const clampedZoom = Math.max(
      TIMELINE_CONSTANTS.MIN_ZOOM,
      Math.min(TIMELINE_CONSTANTS.MAX_ZOOM, newZoom)
    );
    
    this.zoom = clampedZoom;
    this.scale = TIMELINE_CONSTANTS.BASE_SCALE * this.zoom;
    
    return this.getScrollPosition();
  }
  
  /**
   * Format timecode from seconds
   */
  formatTimecode(seconds) {
    const totalFrames = Math.floor(seconds * this.fps);
    
    const hours = Math.floor(totalFrames / (this.fps * 3600));
    const minutes = Math.floor((totalFrames % (this.fps * 3600)) / (this.fps * 60));
    const secs = Math.floor((totalFrames % (this.fps * 60)) / this.fps);
    const frames = totalFrames % this.fps;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }
  
  /**
   * Parse timecode string to seconds
   */
  parseTimecode(timecode) {
    const [hours, minutes, seconds, frames] = timecode.split(':').map(Number);
    const totalFrames = (hours * 3600 + minutes * 60 + seconds) * this.fps + frames;
    return totalFrames / this.fps;
  }
}

/**
 * Snap Engine
 * Handles magnetic timeline snapping
 */
export class SnapEngine {
  constructor(threshold = 0.2) {
    this.threshold = threshold; // seconds
    this.snapPoints = [];
  }
  
  /**
   * Register snap points from clips
   */
  registerClips(clips) {
    this.snapPoints = [];
    
    clips.forEach(clip => {
      // Add clip start
      this.snapPoints.push({
        time: clip.startTime,
        type: 'clip-start',
        clipId: clip.id
      });
      
      // Add clip end
      this.snapPoints.push({
        time: clip.startTime + clip.duration,
        type: 'clip-end',
        clipId: clip.id
      });
    });
    
    // Add timeline zero
    this.snapPoints.push({
      time: 0,
      type: 'timeline-start'
    });
    
    // Sort by time
    this.snapPoints.sort((a, b) => a.time - b.time);
  }
  
  /**
   * Find nearest snap point
   */
  findSnap(time, excludeClipId = null) {
    let nearest = null;
    let minDistance = this.threshold;
    
    this.snapPoints.forEach(point => {
      if (point.clipId === excludeClipId) return;
      
      const distance = Math.abs(point.time - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });
    
    return nearest ? { ...nearest, distance: minDistance } : null;
  }
}

/**
 * Ruler Generator
 * Generates tick marks for timeline ruler
 */
export class RulerGenerator {
  constructor(state) {
    this.state = state;
  }
  
  /**
   * Generate tick marks for visible range
   */
  generateTicks() {
    const { startTime, endTime } = this.state.getVisibleTimeRange();
    
    // Determine tick interval based on zoom
    let majorInterval, minorInterval;
    
    if (this.state.zoom >= 10) {
      majorInterval = 1;    // 1 second
      minorInterval = 0.2;  // 5 frames at 24fps
    } else if (this.state.zoom >= 5) {
      majorInterval = 5;    // 5 seconds
      minorInterval = 1;    // 1 second
    } else if (this.state.zoom >= 2) {
      majorInterval = 10;   // 10 seconds
      minorInterval = 2;    // 2 seconds
    } else if (this.state.zoom >= 1) {
      majorInterval = 30;   // 30 seconds
      minorInterval = 5;    // 5 seconds
    } else {
      majorInterval = 60;   // 1 minute
      minorInterval = 10;   // 10 seconds
    }
    
    const ticks = [];
    const startTick = Math.floor(startTime / minorInterval) * minorInterval;
    
    for (let time = startTick; time <= endTime; time += minorInterval) {
      if (time < 0) continue;
      
      const isMajor = Math.abs(time % majorInterval) < 0.001;
      const position = this.state.timeToPixel(time);
      
      ticks.push({
        time,
        position,
        isMajor,
        label: isMajor ? this.state.formatTimecode(time) : null
      });
    }
    
    return ticks;
  }
}

export default {
  TIMELINE_CONSTANTS,
  TimelineState,
  SnapEngine,
  RulerGenerator
};
