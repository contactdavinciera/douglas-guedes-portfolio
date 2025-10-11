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
// PROFESSIONAL: Snaps to exact edit points (start/end of clips)
export const jumpToClip = (direction, currentTime, clips, setCurrentTime, setSelectedClip) => {
  // Get ALL edit points (start and end of each clip)
  const editPoints = [];
  
  clips.forEach(clip => {
    editPoints.push({
      time: clip.startTime,
      type: 'start',
      clipId: clip.id,
      clipName: clip.id
    });
    editPoints.push({
      time: clip.startTime + clip.duration,
      type: 'end',
      clipId: clip.id,
      clipName: clip.id
    });
  });

  // Remove duplicates and sort
  const uniquePoints = Array.from(
    new Set(editPoints.map(p => p.time))
  ).sort((a, b) => a - b);

  // Add timeline start if not present
  if (!uniquePoints.includes(0)) {
    uniquePoints.unshift(0);
  }

  const THRESHOLD = 0.01; // 10ms threshold for "same position"

  if (direction === 'next') {
    // Find next edit point AFTER current time (with threshold)
    const nextPoint = uniquePoints.find(time => time > currentTime + THRESHOLD);
    
    if (nextPoint !== undefined) {
      setCurrentTime(nextPoint);
      
      // Select clip that starts at this point
      const clipAtPoint = clips.find(c => Math.abs(c.startTime - nextPoint) < THRESHOLD);
      if (clipAtPoint) {
        setSelectedClip(clipAtPoint.id);
        console.log(`⬇️ Jumped to NEXT edit: ${nextPoint.toFixed(2)}s (${clipAtPoint.id})`);
      } else {
        console.log(`⬇️ Jumped to NEXT edit: ${nextPoint.toFixed(2)}s (end of clip)`);
      }
    } else {
      console.log(`⬇️ Already at last edit point`);
    }
  } else if (direction === 'prev') {
    // Find previous edit point BEFORE current time (with threshold)
    const prevPoints = uniquePoints.filter(time => time < currentTime - THRESHOLD);
    const prevPoint = prevPoints[prevPoints.length - 1];
    
    if (prevPoint !== undefined) {
      setCurrentTime(prevPoint);
      
      // Select clip that starts at this point
      const clipAtPoint = clips.find(c => Math.abs(c.startTime - prevPoint) < THRESHOLD);
      if (clipAtPoint) {
        setSelectedClip(clipAtPoint.id);
        console.log(`⬆️ Jumped to PREV edit: ${prevPoint.toFixed(2)}s (${clipAtPoint.id})`);
      } else {
        console.log(`⬆️ Jumped to PREV edit: ${prevPoint.toFixed(2)}s`);
      }
    } else {
      // Go to start
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
