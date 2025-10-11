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
// PROFESSIONAL: Context-aware navigation through clips
// - If playhead is ON a clip: navigate to its IN or OUT
// - If at OUT of clip: next is IN of next clip (seamless edit-to-edit navigation)
export const jumpToClip = (direction, currentTime, clips, setCurrentTime, setSelectedClip) => {
  console.log(`🎯 Navigate Edit Points:`, { 
    direction, 
    currentTime: currentTime.toFixed(3), 
    clipCount: clips.length 
  });

  if (clips.length === 0) {
    console.log('⚠️ No clips on timeline');
    return;
  }

  // Find which clip(s) the playhead is currently on/in
  const THRESHOLD = 0.04; // 40ms threshold
  
  const currentClip = clips.find(clip => {
    const clipIn = clip.startTime;
    const clipOut = clip.startTime + clip.duration;
    return currentTime >= clipIn - THRESHOLD && currentTime <= clipOut + THRESHOLD;
  });

  // Build sorted list of ALL edit points (IN and OUT of each clip)
  const editPoints = [];
  
  clips.forEach(clip => {
    editPoints.push({
      time: clip.startTime,
      type: 'IN',
      clipId: clip.id,
      clip: clip
    });
    
    editPoints.push({
      time: clip.startTime + clip.duration,
      type: 'OUT',
      clipId: clip.id,
      clip: clip
    });
  });

  // Sort by time
  editPoints.sort((a, b) => a.time - b.time);
  
  console.log(`📍 Current context:`, currentClip ? 
    `ON ${currentClip.id} (${currentClip.startTime.toFixed(2)}s - ${(currentClip.startTime + currentClip.duration).toFixed(2)}s)` : 
    `Not on any clip`
  );

  if (direction === 'next') {
    // NEXT: Find next edit point after current position
    
    if (currentClip) {
      const clipIn = currentClip.startTime;
      const clipOut = currentClip.startTime + currentClip.duration;
      
      // Are we at the IN of this clip?
      if (Math.abs(currentTime - clipIn) < THRESHOLD) {
        // We're at IN → Jump to OUT of same clip
        setCurrentTime(clipOut);
        setSelectedClip(currentClip.id);
        console.log(`⬇️ IN → OUT of ${currentClip.id} (${clipOut.toFixed(2)}s)`);
        return;
      }
      
      // Are we at the OUT of this clip?
      if (Math.abs(currentTime - clipOut) < THRESHOLD) {
        // We're at OUT → Jump to IN of NEXT clip
        const nextClip = clips
          .filter(c => c.startTime > clipOut + THRESHOLD)
          .sort((a, b) => a.startTime - b.startTime)[0];
        
        if (nextClip) {
          setCurrentTime(nextClip.startTime);
          setSelectedClip(nextClip.id);
          console.log(`⬇️ OUT → NEXT CLIP IN: ${nextClip.id} (${nextClip.startTime.toFixed(2)}s)`);
        } else {
          console.log(`⬇️ Already at last clip`);
        }
        return;
      }
      
      // We're INSIDE the clip (not at IN or OUT) → Jump to OUT
      setCurrentTime(clipOut);
      setSelectedClip(currentClip.id);
      console.log(`⬇️ Inside clip → OUT of ${currentClip.id} (${clipOut.toFixed(2)}s)`);
      return;
    }
    
    // Not on any clip → Jump to next edit point
    const nextPoint = editPoints.find(ep => ep.time > currentTime + THRESHOLD);
    if (nextPoint) {
      setCurrentTime(nextPoint.time);
      if (nextPoint.type === 'IN') {
        setSelectedClip(nextPoint.clipId);
      }
      console.log(`⬇️ Gap → ${nextPoint.type} of ${nextPoint.clipId} (${nextPoint.time.toFixed(2)}s)`);
    } else {
      console.log(`⬇️ Already at end of timeline`);
    }
    
  } else if (direction === 'prev') {
    // PREV: Find previous edit point before current position
    
    if (currentClip) {
      const clipIn = currentClip.startTime;
      const clipOut = currentClip.startTime + currentClip.duration;
      
      // Are we at the OUT of this clip?
      if (Math.abs(currentTime - clipOut) < THRESHOLD) {
        // We're at OUT → Jump to IN of same clip
        setCurrentTime(clipIn);
        setSelectedClip(currentClip.id);
        console.log(`⬆️ OUT → IN of ${currentClip.id} (${clipIn.toFixed(2)}s)`);
        return;
      }
      
      // Are we at the IN of this clip?
      if (Math.abs(currentTime - clipIn) < THRESHOLD) {
        // We're at IN → Jump to OUT of PREVIOUS clip
        const prevClip = clips
          .filter(c => (c.startTime + c.duration) < clipIn - THRESHOLD)
          .sort((a, b) => b.startTime - a.startTime)[0];
        
        if (prevClip) {
          const prevOut = prevClip.startTime + prevClip.duration;
          setCurrentTime(prevOut);
          setSelectedClip(prevClip.id);
          console.log(`⬆️ IN → PREV CLIP OUT: ${prevClip.id} (${prevOut.toFixed(2)}s)`);
        } else {
          // No previous clip, go to timeline start
          setCurrentTime(0);
          setSelectedClip(null);
          console.log(`⬆️ First clip → Timeline START`);
        }
        return;
      }
      
      // We're INSIDE the clip (not at IN or OUT) → Jump to IN
      setCurrentTime(clipIn);
      setSelectedClip(currentClip.id);
      console.log(`⬆️ Inside clip → IN of ${currentClip.id} (${clipIn.toFixed(2)}s)`);
      return;
    }
    
    // Not on any clip → Jump to previous edit point
    const prevPoint = editPoints
      .filter(ep => ep.time < currentTime - THRESHOLD)
      .sort((a, b) => b.time - a.time)[0];
      
    if (prevPoint) {
      setCurrentTime(prevPoint.time);
      if (prevPoint.type === 'IN') {
        setSelectedClip(prevPoint.clipId);
      }
      console.log(`⬆️ Gap → ${prevPoint.type} of ${prevPoint.clipId} (${prevPoint.time.toFixed(2)}s)`);
    } else {
      // Go to timeline start
      setCurrentTime(0);
      setSelectedClip(null);
      console.log(`⬆️ Timeline START`);
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
