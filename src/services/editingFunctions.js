/**
 * MAESTRO EDITING FUNCTIONS
 * Professional NLE editing tools
 */

// IN/OUT Points Management
export const setInPoint = (currentTime, setState) => {
  console.log(`📍 IN Point set at: ${currentTime.toFixed(2)}s`);
  setState(prev => ({ ...prev, inPoint: currentTime }));
};

export const setOutPoint = (currentTime, setState) => {
  console.log(`📍 OUT Point set at: ${currentTime.toFixed(2)}s`);
  setState(prev => ({ ...prev, outPoint: currentTime }));
};

// Copy Selection (IN/OUT range)
export const copySelection = (inPoint, outPoint, clips, setCopiedSelection) => {
  if (inPoint === null || outPoint === null) {
    console.warn('⚠️ No IN/OUT points set');
    return;
  }

  const selectedClips = clips.filter(clip => {
    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;
    return (clipStart < outPoint && clipEnd > inPoint);
  });

  const selection = {
    inPoint,
    outPoint,
    duration: outPoint - inPoint,
    clips: selectedClips.map(clip => ({
      ...clip,
      // Adjust times relative to IN point
      relativeStart: Math.max(0, clip.startTime - inPoint),
      relativeDuration: Math.min(clip.duration, outPoint - clip.startTime)
    }))
  };

  setCopiedSelection(selection);
  console.log(`✂️ Copied selection: ${selection.duration.toFixed(2)}s, ${selection.clips.length} clips`);
};

// Paste Overwrite (Ctrl+V) - Replaces content
export const pasteOverwrite = (copiedSelection, currentTime, clips, setClips) => {
  if (!copiedSelection) {
    console.warn('⚠️ Nothing to paste');
    return;
  }

  // Remove clips in paste range
  const pasteEnd = currentTime + copiedSelection.duration;
  const remainingClips = clips.filter(clip => {
    const clipEnd = clip.startTime + clip.duration;
    return (clipEnd <= currentTime || clip.startTime >= pasteEnd);
  });

  // Add pasted clips at new position
  const newClips = copiedSelection.clips.map((clip, index) => ({
    ...clip,
    id: `clip${Date.now()}_${index}`,
    startTime: currentTime + clip.relativeStart
  }));

  setClips([...remainingClips, ...newClips]);
  console.log(`📋 Pasted (overwrite) at ${currentTime.toFixed(2)}s`);
};

// Paste Insert (Ctrl+Shift+V) - Ripples content forward
export const pasteInsert = (copiedSelection, currentTime, clips, setClips) => {
  if (!copiedSelection) {
    console.warn('⚠️ Nothing to paste');
    return;
  }

  const insertDuration = copiedSelection.duration;

  // Ripple clips forward
  const rippledClips = clips.map(clip => {
    if (clip.startTime >= currentTime) {
      return {
        ...clip,
        startTime: clip.startTime + insertDuration
      };
    }
    return clip;
  });

  // Add pasted clips at insert point
  const newClips = copiedSelection.clips.map((clip, index) => ({
    ...clip,
    id: `clip${Date.now()}_${index}`,
    startTime: currentTime + clip.relativeStart
  }));

  setClips([...rippledClips, ...newClips]);
  console.log(`📋 Pasted (insert/ripple) at ${currentTime.toFixed(2)}s`);
};

// Ripple Delete (Delete between IN/OUT)
export const rippleDelete = (inPoint, outPoint, clips, setClips, selectedTracks = null) => {
  if (inPoint === null || outPoint === null) {
    console.warn('⚠️ No IN/OUT points set');
    return;
  }

  const deleteDuration = outPoint - inPoint;

  // Filter clips to delete
  const filteredClips = clips.filter(clip => {
    // If specific tracks selected, only affect those
    if (selectedTracks && !selectedTracks.includes(clip.track)) {
      return true;
    }

    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    // Keep clips outside the delete range
    return (clipEnd <= inPoint || clipStart >= outPoint);
  });

  // Ripple clips after delete range
  const rippledClips = filteredClips.map(clip => {
    if (clip.startTime >= outPoint) {
      return {
        ...clip,
        startTime: clip.startTime - deleteDuration
      };
    }
    return clip;
  });

  setClips(rippledClips);
  console.log(`🗑️ Ripple deleted: ${deleteDuration.toFixed(2)}s`);
};

// Razor Cut at Playhead (Ctrl+B)
export const razorCut = (currentTime, clips, setClips, selectedClipIds = null) => {
  const newClips = [];
  
  clips.forEach(clip => {
    // If specific clips selected, only cut those
    if (selectedClipIds && !selectedClipIds.includes(clip.id)) {
      newClips.push(clip);
      return;
    }

    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    // Check if playhead is within clip
    if (currentTime > clipStart && currentTime < clipEnd) {
      const cutPoint = currentTime - clipStart;

      // First part (before cut)
      newClips.push({
        ...clip,
        id: `${clip.id}_a`,
        duration: cutPoint,
        outPoint: clip.inPoint + cutPoint
      });

      // Second part (after cut)
      newClips.push({
        ...clip,
        id: `${clip.id}_b`,
        startTime: currentTime,
        duration: clip.duration - cutPoint,
        inPoint: clip.inPoint + cutPoint
      });

      console.log(`✂️ Cut clip ${clip.id} at ${currentTime.toFixed(2)}s`);
    } else {
      newClips.push(clip);
    }
  });

  setClips(newClips);
};

// Jump to Next/Previous Edit Point (Arrow Up/Down)
// PROFESSIONAL: Navigates through IN and OUT points of clips in sequence
// Each clip has 2 edit points: IN (start) and OUT (end) on timeline
export const jumpToClip = (direction, currentTime, clips, setCurrentTime, setSelectedClip) => {
  console.log(`🎯 Navigate Edit Points:`, { 
    direction, 
    currentTime: currentTime.toFixed(3), 
    clipCount: clips.length 
  });

  // Build edit points array with IN and OUT for each clip
  const editPoints = [];
  
  clips.forEach(clip => {
    // IN point (where clip starts on timeline)
    const inPoint = clip.startTime;
    
    // OUT point (where clip ends on timeline)
    // This respects the clip's actual duration in the timeline
    const outPoint = clip.startTime + clip.duration;
    
    editPoints.push({
      time: inPoint,
      type: 'IN',
      clipId: clip.id,
      clipName: clip.id,
      mediaIn: clip.inPoint || 0,
      mediaOut: clip.outPoint || clip.duration
    });
    
    editPoints.push({
      time: outPoint,
      type: 'OUT',
      clipId: clip.id,
      clipName: clip.id,
      mediaIn: clip.inPoint || 0,
      mediaOut: clip.outPoint || clip.duration
    });
  });

  // Sort by time
  editPoints.sort((a, b) => a.time - b.time);
  
  console.log(`📍 Edit points (IN/OUT sequence):`, 
    editPoints.map(p => `${p.time.toFixed(2)}s [${p.type}] ${p.clipId}`)
  );

  // Get unique timeline positions
  const uniqueTimes = [...new Set(editPoints.map(p => p.time))].sort((a, b) => a - b);
  
  // Add timeline start if not present
  if (!uniqueTimes.includes(0)) {
    uniqueTimes.unshift(0);
  }

  console.log(`✅ Unique positions:`, uniqueTimes.map(t => t.toFixed(2)));

  const THRESHOLD = 0.04; // 40ms threshold (almost 1 frame at 24fps)

  if (direction === 'next') {
    // Find NEXT edit point after current position
    const nextTime = uniqueTimes.find(time => time > currentTime + THRESHOLD);
    
    if (nextTime !== undefined) {
      setCurrentTime(nextTime);
      
      // Find which edit point this is
      const editPoint = editPoints.find(ep => Math.abs(ep.time - nextTime) < THRESHOLD);
      
      if (editPoint) {
        // If it's an IN point, select the clip
        if (editPoint.type === 'IN') {
          setSelectedClip(editPoint.clipId);
        }
        
        console.log(`⬇️ NEXT EDIT: ${nextTime.toFixed(2)}s → ${editPoint.type} of ${editPoint.clipId}`);
        console.log(`   Media range: ${editPoint.mediaIn}s - ${editPoint.mediaOut}s`);
      } else {
        console.log(`⬇️ NEXT EDIT: ${nextTime.toFixed(2)}s`);
      }
    } else {
      console.log(`⬇️ Already at last edit point`);
    }
    
  } else if (direction === 'prev') {
    // Find PREVIOUS edit point before current position
    const prevTimes = uniqueTimes.filter(time => time < currentTime - THRESHOLD);
    const prevTime = prevTimes[prevTimes.length - 1];
    
    if (prevTime !== undefined) {
      setCurrentTime(prevTime);
      
      // Find which edit point this is
      const editPoint = editPoints.find(ep => Math.abs(ep.time - prevTime) < THRESHOLD);
      
      if (editPoint) {
        // If it's an IN point, select the clip
        if (editPoint.type === 'IN') {
          setSelectedClip(editPoint.clipId);
        }
        
        console.log(`⬆️ PREV EDIT: ${prevTime.toFixed(2)}s → ${editPoint.type} of ${editPoint.clipId}`);
        console.log(`   Media range: ${editPoint.mediaIn}s - ${editPoint.mediaOut}s`);
      } else {
        console.log(`⬆️ PREV EDIT: ${prevTime.toFixed(2)}s`);
      }
    } else {
      // Go to timeline start
      setCurrentTime(0);
      setSelectedClip(null);
      console.log(`⬆️ Jumped to timeline START (00:00:00:00)`);
    }
  }
};

// Add Track
export const addTrack = (type, tracks, setTracks) => {
  const existingTracks = tracks.filter(t => t.type === type);
  const newId = type === 'video' 
    ? `v${existingTracks.length + 1}` 
    : `a${existingTracks.length + 1}`;

  const newTrack = {
    id: newId,
    name: type === 'video' ? `V${existingTracks.length + 1}` : `A${existingTracks.length + 1}`,
    type,
    height: 60,
    locked: false,
    muted: false,
    solo: false
  };

  // Add video tracks at top, audio tracks at bottom
  if (type === 'video') {
    setTracks([newTrack, ...tracks]);
  } else {
    setTracks([...tracks, newTrack]);
  }

  console.log(`➕ Added ${type} track: ${newId}`);
};

export default {
  setInPoint,
  setOutPoint,
  copySelection,
  pasteOverwrite,
  pasteInsert,
  rippleDelete,
  razorCut,
  jumpToClip,
  addTrack
};
