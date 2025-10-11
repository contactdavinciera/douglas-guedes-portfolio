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

// Jump to Next/Previous Clip (Arrow Up/Down)
export const jumpToClip = (direction, currentTime, clips, setCurrentTime, setSelectedClip) => {
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  if (direction === 'next') {
    const nextClip = sortedClips.find(c => c.startTime > currentTime);
    if (nextClip) {
      setCurrentTime(nextClip.startTime);
      setSelectedClip(nextClip.id);
      console.log(`⬇️ Jumped to next clip: ${nextClip.id}`);
    }
  } else if (direction === 'prev') {
    const prevClips = sortedClips.filter(c => c.startTime < currentTime);
    const prevClip = prevClips[prevClips.length - 1];
    if (prevClip) {
      setCurrentTime(prevClip.startTime);
      setSelectedClip(prevClip.id);
      console.log(`⬆️ Jumped to previous clip: ${prevClip.id}`);
    } else {
      setCurrentTime(0);
      console.log(`⬆️ Jumped to timeline start`);
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
