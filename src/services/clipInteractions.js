/**
 * MAESTRO CLIP INTERACTIONS SYSTEM
 * Professional drag & drop, snapping, collision detection
 * Like Premiere Pro / DaVinci Resolve
 */

// Snap threshold (in seconds)
const SNAP_THRESHOLD = 0.5; // Snap if within 0.5 seconds

/**
 * Check if two clips collide on the same track
 */
export const checkCollision = (clip1, clip2) => {
  if (clip1.track !== clip2.track) return false;
  if (clip1.id === clip2.id) return false;
  
  const clip1Start = clip1.startTime;
  const clip1End = clip1.startTime + clip1.duration;
  const clip2Start = clip2.startTime;
  const clip2End = clip2.startTime + clip2.duration;
  
  // Check overlap
  return (clip1Start < clip2End && clip1End > clip2Start);
};

/**
 * Find snap points for a clip being dragged
 * Returns the closest snap point if within threshold
 */
export const findSnapPoint = (draggedClip, allClips, currentTime) => {
  const snapPoints = [];
  
  // Add other clips' edges as snap points
  allClips.forEach(clip => {
    if (clip.id === draggedClip.id) return;
    if (clip.track !== draggedClip.track) return;
    
    // Start and end of other clips
    snapPoints.push({
      time: clip.startTime,
      type: 'clip-start',
      clipId: clip.id
    });
    
    snapPoints.push({
      time: clip.startTime + clip.duration,
      type: 'clip-end',
      clipId: clip.id
    });
  });
  
  // Add timeline start
  snapPoints.push({
    time: 0,
    type: 'timeline-start'
  });
  
  // Find closest snap point
  const draggedStart = currentTime;
  const draggedEnd = currentTime + draggedClip.duration;
  
  let closestSnap = null;
  let minDistance = SNAP_THRESHOLD;
  
  snapPoints.forEach(snap => {
    // Check if dragged clip's start snaps
    const distToStart = Math.abs(draggedStart - snap.time);
    if (distToStart < minDistance) {
      minDistance = distToStart;
      closestSnap = {
        ...snap,
        snapTo: 'start',
        newTime: snap.time
      };
    }
    
    // Check if dragged clip's end snaps
    const distToEnd = Math.abs(draggedEnd - snap.time);
    if (distToEnd < minDistance) {
      minDistance = distToEnd;
      closestSnap = {
        ...snap,
        snapTo: 'end',
        newTime: snap.time - draggedClip.duration
      };
    }
  });
  
  return closestSnap;
};

/**
 * Validate if clip can be moved to new position
 * Returns { valid: boolean, reason: string, suggestedTime: number }
 */
export const validateClipMove = (clip, newTime, newTrack, allClips, tracks) => {
  // Check if track exists
  const targetTrack = tracks.find(t => t.id === newTrack);
  if (!targetTrack) {
    return { valid: false, reason: 'Track not found' };
  }
  
  // Check if track is locked
  if (targetTrack.locked) {
    return { valid: false, reason: 'Track is locked' };
  }
  
  // Check track type compatibility
  const sourceTrack = tracks.find(t => t.id === clip.track);
  if (sourceTrack && sourceTrack.type !== targetTrack.type) {
    return { 
      valid: false, 
      reason: `Cannot move ${sourceTrack.type} clip to ${targetTrack.type} track` 
    };
  }
  
  // Check if time is negative
  if (newTime < 0) {
    return { 
      valid: false, 
      reason: 'Cannot move before timeline start',
      suggestedTime: 0
    };
  }
  
  // Check collision with other clips on target track
  const movedClip = { ...clip, startTime: newTime, track: newTrack };
  
  for (const otherClip of allClips) {
    if (otherClip.id === clip.id) continue;
    
    if (checkCollision(movedClip, otherClip)) {
      return { 
        valid: false, 
        reason: `Collision with ${otherClip.id}`,
        collidingClip: otherClip
      };
    }
  }
  
  return { valid: true };
};

/**
 * Get insert point for ripple insert
 * Finds gap or pushes clips to the right
 */
export const findInsertPoint = (clip, insertTime, track, allClips) => {
  const clipsOnTrack = allClips
    .filter(c => c.track === track && c.id !== clip.id)
    .sort((a, b) => a.startTime - b.startTime);
  
  // Find if there's a clip at insert point
  const clipAtPoint = clipsOnTrack.find(c => 
    insertTime >= c.startTime && insertTime < c.startTime + c.duration
  );
  
  if (clipAtPoint) {
    // Insert BEFORE this clip (push it right)
    return {
      insertTime: clipAtPoint.startTime,
      rippleClips: clipsOnTrack.filter(c => c.startTime >= clipAtPoint.startTime),
      rippleAmount: clip.duration
    };
  }
  
  // Find gap
  const gapStart = insertTime;
  const nextClip = clipsOnTrack.find(c => c.startTime > insertTime);
  
  if (nextClip) {
    const gapSize = nextClip.startTime - gapStart;
    if (gapSize >= clip.duration) {
      // Fits in gap
      return { insertTime: gapStart, rippleClips: [], rippleAmount: 0 };
    } else {
      // Doesn't fit, ripple needed
      return {
        insertTime: gapStart,
        rippleClips: clipsOnTrack.filter(c => c.startTime >= nextClip.startTime),
        rippleAmount: clip.duration - gapSize
      };
    }
  }
  
  // Insert at end
  return { insertTime: gapStart, rippleClips: [], rippleAmount: 0 };
};

/**
 * Perform ripple delete - close gap left by deleted clip
 */
export const rippleDelete = (deletedClip, allClips) => {
  const clipsToRipple = allClips
    .filter(c => c.track === deletedClip.track)
    .filter(c => c.startTime > deletedClip.startTime)
    .map(c => ({
      ...c,
      startTime: c.startTime - deletedClip.duration
    }));
  
  const unchangedClips = allClips.filter(c => 
    c.id !== deletedClip.id && 
    (c.track !== deletedClip.track || c.startTime <= deletedClip.startTime)
  );
  
  return [...unchangedClips, ...clipsToRipple];
};

/**
 * Calculate trim preview
 * Returns new in/out points and duration
 */
export const calculateTrim = (clip, edge, deltaTime, minDuration = 0.1) => {
  if (edge === 'start') {
    // Trimming start (changing IN point)
    const newInPoint = Math.max(0, clip.inPoint + deltaTime);
    const maxIn = (clip.outPoint || clip.duration) - minDuration;
    
    const finalInPoint = Math.min(newInPoint, maxIn);
    const newDuration = (clip.outPoint || clip.duration) - finalInPoint;
    const newStartTime = clip.startTime - (finalInPoint - clip.inPoint);
    
    return {
      inPoint: finalInPoint,
      outPoint: clip.outPoint || clip.duration,
      duration: newDuration,
      startTime: newStartTime
    };
  } else {
    // Trimming end (changing OUT point)
    const currentOut = clip.outPoint || clip.duration;
    const newOutPoint = Math.max(clip.inPoint + minDuration, currentOut + deltaTime);
    const newDuration = newOutPoint - clip.inPoint;
    
    return {
      inPoint: clip.inPoint,
      outPoint: newOutPoint,
      duration: newDuration,
      startTime: clip.startTime
    };
  }
};

/**
 * Get magnetic timeline suggestions
 * Returns suggested positions based on nearby clips
 */
export const getMagneticSuggestions = (clip, currentTime, allClips) => {
  const suggestions = [];
  const MAGNETIC_RANGE = 2; // seconds
  
  allClips.forEach(otherClip => {
    if (otherClip.id === clip.id) return;
    if (otherClip.track !== clip.track) return;
    
    const otherStart = otherClip.startTime;
    const otherEnd = otherClip.startTime + otherClip.duration;
    
    // Suggest snapping to start
    if (Math.abs(currentTime - otherStart) < MAGNETIC_RANGE) {
      suggestions.push({
        time: otherStart,
        strength: 1 - Math.abs(currentTime - otherStart) / MAGNETIC_RANGE,
        type: 'align-start'
      });
    }
    
    // Suggest snapping to end
    if (Math.abs(currentTime - otherEnd) < MAGNETIC_RANGE) {
      suggestions.push({
        time: otherEnd,
        strength: 1 - Math.abs(currentTime - otherEnd) / MAGNETIC_RANGE,
        type: 'align-end'
      });
    }
  });
  
  // Sort by strength
  suggestions.sort((a, b) => b.strength - a.strength);
  
  return suggestions[0] || null;
};

export default {
  checkCollision,
  findSnapPoint,
  validateClipMove,
  findInsertPoint,
  rippleDelete,
  calculateTrim,
  getMagneticSuggestions,
  SNAP_THRESHOLD
};
