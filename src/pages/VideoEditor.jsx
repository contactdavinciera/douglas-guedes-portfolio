import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import '../styles/maestro-timeline.css';
import '../styles/maestro-enhancements.css';
import { importMedia, pollTranscodeStatus } from '@/services/mediaImporter';
import MaestroPlayer from '@/services/maestroPlayer';
import MaestroWaveform from '@/components/MaestroWaveform';
import MaestroScrubber from '@/components/MaestroScrubber';
import MediaImportDialog from '@/components/MediaImportDialog';
import ProjectSettingsDialog from '@/components/ProjectSettingsDialog';
import TimelineRuler from '@/components/TimelineRuler';
import * as EditingFunctions from '@/services/editingFunctions';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  Save,
  Upload,
  Settings,
  Plus,
  Copy,
  Layers,
  Zap,
  List,
  Grid,
  SortAsc,
  FolderOpen,
  FileVideo,
  FileAudio
} from 'lucide-react';

const VideoEditor = () => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 min default
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedClip, setSelectedClip] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [timelineClips, setTimelineClips] = useState([
    { id: 'clip1', mediaId: 1, track: 'v1', startTime: 10, duration: 30, inPoint: 0, outPoint: 30 },
    { id: 'clip2', mediaId: 2, track: 'v1', startTime: 45, duration: 25, inPoint: 0, outPoint: 25 },
    { id: 'clip3', mediaId: 3, track: 'a1', startTime: 10, duration: 60, inPoint: 0, outPoint: 60 },
  ]);
  const [mediaBins, setMediaBins] = useState([
    { id: 1, name: 'Video_001.braw', duration: 120, thumbnail: null, type: 'video' },
    { id: 2, name: 'Video_002.r3d', duration: 90, thumbnail: null, type: 'video' },
    { id: 3, name: 'Audio_001.wav', duration: 180, thumbnail: null, type: 'audio' },
  ]);
  const [draggedMedia, setDraggedMedia] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // For J/K/L
  const [rippleDelete, setRippleDelete] = useState(true); // Auto-close gaps
  const [trackHeight, setTrackHeight] = useState({ v1: 80, a1: 60, a2: 60 });
  const [selectedClips, setSelectedClips] = useState([]); // Multiple selection
  const [clipboard, setClipboard] = useState(null); // Copy/paste
  const [proxyMode, setProxyMode] = useState(true); // Performance
  const [showScopes, setShowScopes] = useState(false); // Waveform/Vectorscope
  const [inPoint, setInPoint] = useState(null); // IN point for selection
  const [outPoint, setOutPoint] = useState(null); // OUT point for selection
  const [copiedSelection, setCopiedSelection] = useState(null); // Copied IN/OUT range
  const [showImportDialog, setShowImportDialog] = useState(false); // Media import modal
  const [showProjectSettings, setShowProjectSettings] = useState(false); // Project settings dialog
  const [projectSettings, setProjectSettings] = useState({
    framerate: 24,
    colorSpace: 'SDR',
    resolution: '1920x1080',
    timecodeStart: '00:00:00:00'
  });
  const [markers, setMarkers] = useState([
    { id: 'm1', time: 30, color: 'red', label: 'Start Scene 1', type: 'comment' },
    { id: 'm2', time: 75, color: 'green', label: 'Music Cue', type: 'audio' },
  ]);
  const [tracks, setTracks] = useState([
    { id: 'v1', name: 'V1', type: 'video', locked: false, solo: false, muted: false, height: 80 },
    { id: 'a1', name: 'A1', type: 'audio', locked: false, solo: false, muted: false, height: 60 },
    { id: 'a2', name: 'A2', type: 'audio', locked: false, solo: false, muted: false, height: 60 },
  ]);
  const [effects, setEffects] = useState([
    { id: 'fx1', name: 'Cross Dissolve', type: 'transition', category: 'video' },
    { id: 'fx2', name: 'Fade to Black', type: 'transition', category: 'video' },
    { id: 'fx3', name: 'Gaussian Blur', type: 'filter', category: 'video' },
    { id: 'fx4', name: 'Color Correction', type: 'filter', category: 'color' },
    { id: 'fx5', name: 'Crossfade', type: 'transition', category: 'audio' },
  ]);
  const [nestedSequences, setNestedSequences] = useState([]);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [mediaViewMode, setMediaViewMode] = useState('list'); // 'list' or 'thumbnails'
  const [jumpFeedback, setJumpFeedback] = useState(null); // Visual feedback for navigation
  const [mediaSortBy, setMediaSortBy] = useState('name'); // 'name', 'duration', 'type'
  const [uploadProgress, setUploadProgress] = useState(null); // { filename, progress }
  const [transcodeJobs, setTranscodeJobs] = useState([]); // Active transcode jobs
  const [scrubber, setScrubber] = useState({ visible: false, x: 0, y: 0, time: 0, thumbnail: null });
  const [trimmingClip, setTrimmingClip] = useState(null); // { clipId, side: 'left'|'right' }

  // Refs
  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const maestroPlayer = useRef(null);

  // Timecode formatting
  const formatTimecode = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 24); // 24fps
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  };

  // Handle playhead drag
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.5));

  // Snap to grid
  const snapTime = (time) => {
    if (!snapToGrid) return time;
    const snapInterval = 1 / 24; // 1 frame at 24fps
    return Math.round(time / snapInterval) * snapInterval;
  };

  // Sort media bins
  const getSortedMediaBins = () => {
    const sorted = [...mediaBins];
    if (mediaSortBy === 'name') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (mediaSortBy === 'duration') {
      return sorted.sort((a, b) => b.duration - a.duration);
    } else if (mediaSortBy === 'type') {
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    }
    return sorted;
  };

  // Import Media - Maestro Pipeline
  const handleImportMedia = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,audio/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        try {
          console.log(`🎬 Importing: ${file.name}`);
          
          setUploadProgress({ filename: file.name, progress: 0 });
          
          // Import with auto-detection
          const media = await importMedia(file);
          
          console.log('✅ Media imported:', media);
          
          // Add to media pool
          setMediaBins(prev => [...prev, {
            id: media.id || Date.now(),
            name: media.name,
            duration: media.duration || 0,
            type: media.type === 'proxy-ready' || media.codec.includes('h264') ? 'video' : 'video',
            thumbnail: media.thumbnailURL || null,
            ...media
          }]);
          
          // If transcoding, start polling
          if (media.type === 'transcoding') {
            startTranscodePolling(media.jobId, media);
          }
          
          setUploadProgress(null);
          
        } catch (error) {
          console.error('❌ Import failed:', error);
          setUploadProgress(null);
          alert(`Failed to import ${file.name}: ${error.message}`);
        }
      }
    };
    
    input.click();
  };

  // Poll transcode status
  const startTranscodePolling = (jobId, media) => {
    const intervalId = setInterval(async () => {
      try {
        const status = await pollTranscodeStatus(jobId);
        
        console.log(`⚙️ Transcode progress: ${status.progress}%`);
        
        // Update media bin status
        setMediaBins(prev => prev.map(m => 
          m.id === media.id 
            ? { ...m, status: status.status, progress: status.progress }
            : m
        ));
        
        // If complete, stop polling
        if (status.status === 'completed') {
          console.log('✅ Transcode complete!');
          clearInterval(intervalId);
          
          // Update with final URLs
          setMediaBins(prev => prev.map(m => 
            m.id === media.id 
              ? { 
                  ...m, 
                  status: 'ready',
                  playbackURL: status.playbackURL,
                  thumbnailURL: status.thumbnailURL
                }
              : m
          ));
        }
        
        if (status.status === 'failed') {
          console.error('❌ Transcode failed');
          clearInterval(intervalId);
        }
        
      } catch (error) {
        console.error('Poll error:', error);
        clearInterval(intervalId);
      }
    }, 3000); // Poll every 3 seconds
    
    // Store interval ID to clear later
    setTranscodeJobs(prev => [...prev, { jobId, intervalId }]);
  };

  // Initialize Maestro Player
  useEffect(() => {
    if (!maestroPlayer.current) {
      maestroPlayer.current = new MaestroPlayer();
      console.log('🎼 Maestro Player initialized');
    }
    
    // Prevent text selection on double-click/drag
    const preventSelection = (e) => {
      const target = e.target;
      // Allow selection only in input fields
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    const maestroContainer = document.querySelector('.maestro-software-mode');
    if (maestroContainer) {
      maestroContainer.addEventListener('selectstart', preventSelection);
      maestroContainer.addEventListener('dragstart', (e) => {
        // Allow drag only for draggable items
        if (!e.target.closest('[draggable="true"]')) {
          e.preventDefault();
        }
      });
    }
    
    return () => {
      // Cleanup transcode polling on unmount
      transcodeJobs.forEach(job => clearInterval(job.intervalId));
      
      if (maestroContainer) {
        maestroContainer.removeEventListener('selectstart', preventSelection);
      }
    };
  }, []);

  // Playback Functions
  const handlePlay = async () => {
    if (!maestroPlayer.current) return;
    
    // Find active clip at current time - PRIORITIZE TOP LAYER
    const activeClips = timelineClips.filter(c => 
      currentTime >= c.startTime && currentTime < c.startTime + c.duration
    );
    
    // Sort by track (video tracks first, then by track ID)
    // V1 > V2 > A1 > A2 (higher priority on top)
    const sortedClips = activeClips.sort((a, b) => {
      const aTrack = tracks.findIndex(t => t.id === a.track);
      const bTrack = tracks.findIndex(t => t.id === b.track);
      return aTrack - bTrack; // Lower index = higher priority
    });
    
    const activeClip = sortedClips[0]; // Top layer wins
    
    if (activeClip) {
      const mediaFile = mediaBins.find(m => m.id === activeClip.mediaId);
      
      if (mediaFile) {
        try {
          const player = await maestroPlayer.current.loadClip(activeClip.id, mediaFile);
          
          // Seek to correct position in clip
          const clipTime = currentTime - activeClip.startTime + activeClip.inPoint;
          player.seek(clipTime);
          
          // Play
          await player.play();
          setIsPlaying(true);
          
        } catch (error) {
          console.error('Playback error:', error);
        }
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Maestro player will handle pause
  };

  const handleSeek = async (time) => {
    setCurrentTime(time);
    
    // If playing, seek active player
    if (maestroPlayer.current?.currentPlayer) {
      const activeClip = timelineClips.find(c => 
        time >= c.startTime && time < c.startTime + c.duration
      );
      
      if (activeClip) {
        const clipTime = time - activeClip.startTime + activeClip.inPoint;
        maestroPlayer.current.currentPlayer.seek(clipTime);
      }
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, media) => {
    setDraggedMedia(media);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, track) => {
    e.preventDefault();
    if (!draggedMedia || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 64; // Subtract track label width
    const percentage = x / (rect.width - 64);
    const dropTime = snapTime(percentage * duration * zoomLevel);

    const newClip = {
      id: `clip${Date.now()}`,
      mediaId: draggedMedia.id,
      track: track,
      startTime: Math.max(0, dropTime),
      duration: draggedMedia.duration,
      inPoint: 0,
      outPoint: draggedMedia.duration,
    };

    setTimelineClips([...timelineClips, newClip]);
    setDraggedMedia(null);
  };

  // Drag clip between tracks
  const handleClipDragStart = (e, clip) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('clipId', clip.id);
  };

  const handleClipDrop = (e, targetTrack) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clipId = e.dataTransfer.getData('clipId');
    if (!clipId) return;

    const clip = timelineClips.find(c => c.id === clipId);
    if (!clip) return;

    // Get clip type (video or audio)
    const media = mediaBins.find(m => m.id === clip.mediaId);
    const clipType = media?.type || 'video';

    // Get target track type
    const targetTrackObj = tracks.find(t => t.id === targetTrack);
    const targetType = targetTrackObj?.type;

    // VALIDATION: Video clips can only go to video tracks, audio to audio tracks
    if (clipType !== targetType) {
      console.warn(`❌ Cannot drop ${clipType} clip on ${targetType} track!`);
      alert(`Cannot place ${clipType.toUpperCase()} clips on ${targetType.toUpperCase()} tracks!`);
      return;
    }

    // Move clip to new track
    setTimelineClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, track: targetTrack } : c
    ));
    
    console.log(`✅ Moved ${clipType} clip to ${targetTrack}`);
  };

  // Move clip up/down layers (Alt + Arrow)
  const moveClipToLayer = (clipId, direction) => {
    const clip = timelineClips.find(c => c.id === clipId);
    if (!clip) return;

    const currentTrackIndex = tracks.findIndex(t => t.id === clip.track);
    const newTrackIndex = currentTrackIndex + (direction === 'up' ? -1 : 1);

    if (newTrackIndex >= 0 && newTrackIndex < tracks.length) {
      const newTrack = tracks[newTrackIndex];
      
      setTimelineClips(prev => prev.map(c => 
        c.id === clipId ? { ...c, track: newTrack.id } : c
      ));
      
      console.log(`🔼 Moved clip to ${newTrack.id}`);
    }
  };

  // Jump to next clip start (Arrow Down)
  const jumpToNextClip = () => {
    // Find all clips that start AFTER current time
    const nextClips = timelineClips
      .filter(c => c.startTime > currentTime)
      .sort((a, b) => a.startTime - b.startTime);
    
    if (nextClips.length > 0) {
      const nextClip = nextClips[0];
      setCurrentTime(nextClip.startTime);
      setSelectedClip(nextClip.id);
      console.log(`⬇️ Jumped to next clip: ${nextClip.id} at ${formatTimecode(nextClip.startTime)}`);
    }
  };

  // Jump to previous clip start (Arrow Up)
  const jumpToPreviousClip = () => {
    // Find all clips that start BEFORE current time
    const prevClips = timelineClips
      .filter(c => c.startTime < currentTime)
      .sort((a, b) => b.startTime - a.startTime);
    
    if (prevClips.length > 0) {
      const prevClip = prevClips[0];
      setCurrentTime(prevClip.startTime);
      setSelectedClip(prevClip.id);
      console.log(`⬆️ Jumped to previous clip: ${prevClip.id} at ${formatTimecode(prevClip.startTime)}`);
    } else {
      // If no previous clip, go to start
      setCurrentTime(0);
      console.log('⬆️ Jumped to timeline start');
    }
  };

  // Split/Cut clip at playhead
  const handleSplitClip = () => {
    const clipsToSplit = timelineClips.filter(clip => 
      currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );

    if (clipsToSplit.length === 0) return;

    const newClips = [];
    const remainingClips = timelineClips.filter(clip => !clipsToSplit.includes(clip));

    clipsToSplit.forEach(clip => {
      const splitPoint = currentTime - clip.startTime;
      
      // First part
      newClips.push({
        ...clip,
        id: `${clip.id}_a`,
        duration: splitPoint,
        outPoint: clip.inPoint + splitPoint,
      });

      // Second part
      newClips.push({
        ...clip,
        id: `${clip.id}_b`,
        startTime: currentTime,
        duration: clip.duration - splitPoint,
        inPoint: clip.inPoint + splitPoint,
      });
    });

    setTimelineClips([...remainingClips, ...newClips]);
  };

  // Delete selected clip with ripple
  const handleDeleteClip = () => {
    if (!selectedClip) return;

    const clipToDelete = timelineClips.find(c => c.id === selectedClip);
    if (!clipToDelete) return;

    let updatedClips = timelineClips.filter(c => c.id !== selectedClip);

    // Ripple delete - close gaps automatically
    if (rippleDelete) {
      const endTime = clipToDelete.startTime + clipToDelete.duration;
      
      updatedClips = updatedClips.map(clip => {
        if (clip.track === clipToDelete.track && clip.startTime >= endTime) {
          return {
            ...clip,
            startTime: clip.startTime - clipToDelete.duration
          };
        }
        return clip;
      });
    }

    setTimelineClips(updatedClips);
    setSelectedClip(null);
  };

  // Copy clip (Ctrl+C)
  const handleCopyClip = () => {
    if (selectedClip) {
      const clip = timelineClips.find(c => c.id === selectedClip);
      setClipboard(clip);
    }
  };

  // Paste clip (Ctrl+V)
  const handlePasteClip = () => {
    if (!clipboard) return;

    const newClip = {
      ...clipboard,
      id: `clip${Date.now()}`,
      startTime: snapTime(currentTime),
    };

    setTimelineClips([...timelineClips, newClip]);
  };

  // Ripple trim - adjust following clips when trimming
  const handleRippleTrim = (clipId, newDuration) => {
    const clip = timelineClips.find(c => c.id === clipId);
    if (!clip) return;

    const durationDiff = newDuration - clip.duration;
    const endTime = clip.startTime + clip.duration;

    const updatedClips = timelineClips.map(c => {
      if (c.id === clipId) {
        return { ...c, duration: newDuration, outPoint: c.inPoint + newDuration };
      }
      
      // Move following clips on same track
      if (c.track === clip.track && c.startTime >= endTime) {
        return { ...c, startTime: c.startTime + durationDiff };
      }
      
      return c;
    });

    setTimelineClips(updatedClips);
  };

  // Add track
  const handleAddTrack = (type) => {
    // Implementation for adding new tracks
    console.log('Add track:', type);
  };

  // Toggle track height
  const handleToggleTrackHeight = (trackId) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, height: t.height === 80 ? 120 : 80 } : t
    ));
  };

  // Track controls
  const handleToggleTrackLock = (trackId) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, locked: !t.locked } : t
    ));
  };

  const handleToggleTrackMute = (trackId) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, muted: !t.muted } : t
    ));
  };

  const handleToggleTrackSolo = (trackId) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, solo: !t.solo } : t
    ));
  };

  // Markers
  const handleAddMarker = () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const newMarker = {
      id: `m${Date.now()}`,
      time: snapTime(currentTime),
      color: colors[markers.length % colors.length],
      label: `Marker ${markers.length + 1}`,
      type: 'comment'
    };
    setMarkers([...markers, newMarker]);
  };

  const handleDeleteMarker = (markerId) => {
    setMarkers(markers.filter(m => m.id !== markerId));
  };

  const handleMarkerClick = (time) => {
    setCurrentTime(time);
  };

  // Nested sequence
  const handleCreateNestedSequence = () => {
    if (selectedClips.length === 0) return;

    const newSequence = {
      id: `seq${Date.now()}`,
      name: `Sequence ${nestedSequences.length + 1}`,
      clips: timelineClips.filter(c => selectedClips.includes(c.id)),
      duration: Math.max(...timelineClips.filter(c => selectedClips.includes(c.id))
        .map(c => c.startTime + c.duration))
    };

    setNestedSequences([...nestedSequences, newSequence]);
    console.log('Created nested sequence:', newSequence);
  };

  // Apply effect to clip
  const handleApplyEffect = (effectId, clipId) => {
    const effect = effects.find(e => e.id === effectId);
    const clip = timelineClips.find(c => c.id === clipId);
    
    if (!effect || !clip) return;

    const updatedClip = {
      ...clip,
      effects: [...(clip.effects || []), { effectId, ...effect }]
    };

    setTimelineClips(timelineClips.map(c => 
      c.id === clipId ? updatedClip : c
    ));

    console.log('Applied effect:', effect.name, 'to clip:', clip.id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c': // Copy
            e.preventDefault();
            handleCopyClip();
            return;
          case 'v': // Paste
            e.preventDefault();
            handlePasteClip();
            return;
          case 'z': // Undo (TODO: implement undo/redo)
            e.preventDefault();
            console.log('Undo');
            return;
          case 'y': // Redo
            e.preventDefault();
            console.log('Redo');
            return;
          case 'd': // Duplicate
            e.preventDefault();
            if (selectedClip) {
              const clip = timelineClips.find(c => c.id === selectedClip);
              if (clip) {
                const newClip = {
                  ...clip,
                  id: `clip${Date.now()}`,
                  startTime: clip.startTime + clip.duration + 1
                };
                setTimelineClips([...timelineClips, newClip]);
              }
            }
            return;
          default:
            break;
        }
      }

      // Alt + Arrow keys - Move clip between layers
      if (e.altKey) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (selectedClip) {
            moveClipToLayer(selectedClip, e.key === 'ArrowUp' ? 'up' : 'down');
          }
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space - Play/Pause
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'j': // J - Reverse play
          e.preventDefault();
          setPlaybackSpeed(-1);
          setIsPlaying(true);
          break;
        case 'k': // K - Pause
          e.preventDefault();
          setIsPlaying(false);
          setPlaybackSpeed(1);
          break;
        case 'arrowup': // Arrow Up - Jump to PREVIOUS edit point
          e.preventDefault();
          EditingFunctions.jumpToClip(
            'prev',
            currentTime,
            timelineClips,
            (time) => {
              setCurrentTime(time);
              // Show visual feedback
              setJumpFeedback('⬆️ PREV EDIT');
              setTimeout(() => setJumpFeedback(null), 800);
            },
            setSelectedClip
          );
          break;
        case 'arrowdown': // Arrow Down - Jump to NEXT edit point
          e.preventDefault();
          EditingFunctions.jumpToClip(
            'next',
            currentTime,
            timelineClips,
            (time) => {
              setCurrentTime(time);
              // Show visual feedback
              setJumpFeedback('⬇️ NEXT EDIT');
              setTimeout(() => setJumpFeedback(null), 800);
            },
            setSelectedClip
          );
          break;
        case 'arrowleft': // Arrow Left - Previous frame (project FPS)
          e.preventDefault();
          setCurrentTime(prev => Math.max(0, prev - (1 / projectSettings.framerate)));
          break;
        case 'arrowright': // Arrow Right - Next frame (project FPS)
          e.preventDefault();
          setCurrentTime(prev => Math.min(duration, prev + (1 / projectSettings.framerate)));
          break;
        case 'l': // L - Forward play
          e.preventDefault();
          setPlaybackSpeed(1);
          setIsPlaying(true);
          break;
        case 'i': // I - Set IN point
          e.preventDefault();
          EditingFunctions.setInPoint(currentTime, (updater) => {
            const newState = updater({ inPoint, outPoint });
            setInPoint(newState.inPoint);
          });
          break;
        case 'o': // O - Set OUT point
          e.preventDefault();
          EditingFunctions.setOutPoint(currentTime, (updater) => {
            const newState = updater({ inPoint, outPoint });
            setOutPoint(newState.outPoint);
          });
          break;
        case 'b': // Ctrl+B - Razor cut at playhead
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            EditingFunctions.razorCut(
              currentTime,
              timelineClips,
              setTimelineClips,
              selectedClip ? [selectedClip] : null
            );
          }
          break;
        case 'c': // Ctrl+C - Copy selection
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            EditingFunctions.copySelection(
              inPoint,
              outPoint,
              timelineClips,
              setCopiedSelection
            );
          }
          break;
        case 'v': // Ctrl+V or Ctrl+Shift+V - Paste
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              // Insert (ripple)
              EditingFunctions.pasteInsert(
                copiedSelection,
                currentTime,
                timelineClips,
                setTimelineClips
              );
            } else {
              // Overwrite
              EditingFunctions.pasteOverwrite(
                copiedSelection,
                currentTime,
                timelineClips,
                setTimelineClips
              );
            }
          }
          break;
        case 'm': // M - Add marker
          e.preventDefault();
          handleAddMarker();
          break;
        case 'e': // E - Toggle effects panel
          e.preventDefault();
          setShowEffectsPanel(!showEffectsPanel);
          break;
        case 's': // S - Snap toggle
          if (e.ctrlKey || e.metaKey) return; // Allow Ctrl+S for save
          e.preventDefault();
          setSnapToGrid(!snapToGrid);
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          // If IN/OUT set, ripple delete between them
          if (inPoint !== null && outPoint !== null) {
            EditingFunctions.rippleDelete(
              inPoint,
              outPoint,
              timelineClips,
              setTimelineClips
            );
            // Clear IN/OUT after delete
            setInPoint(null);
            setOutPoint(null);
          } else {
            // Regular clip delete
            handleDeleteClip();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, selectedClip, snapToGrid, timelineClips, inPoint, outPoint, copiedSelection, projectSettings]);

  // Playback loop - Frame-accurate with PROJECT FRAMERATE
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId;
    let lastTime = performance.now();
    const fps = projectSettings.framerate;
    const frameTime = 1000 / fps; // Dynamic framerate from project settings

    console.log(`▶️ Playing at ${fps} fps (${frameTime.toFixed(2)}ms per frame)`);

    const animate = (currentPerformanceTime) => {
      const deltaTime = currentPerformanceTime - lastTime;

      if (deltaTime >= frameTime) {
        setCurrentTime(prev => {
          const next = prev + (playbackSpeed * (1 / fps)); // 1 frame step at project FPS
          if (next >= duration || next < 0) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
        
        lastTime = currentPerformanceTime - (deltaTime % frameTime);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, playbackSpeed, duration, projectSettings.framerate]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] pt-20 pb-6 px-4">
      {/* Thumbnail Scrubber */}
      <MaestroScrubber
        visible={scrubber.visible}
        x={scrubber.x}
        y={scrubber.y}
        time={scrubber.time}
        thumbnailURL={scrubber.thumbnail}
        formatTimecode={formatTimecode}
      />

      {/* Jump Navigation Feedback */}
      {jumpFeedback && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[99999]">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-sm animate-bounce">
            {jumpFeedback}
          </div>
        </div>
      )}
      
      {/* Main Editor Container - Below header - SOFTWARE MODE */}
      <div className="maestro-software-mode w-full max-w-[98vw] h-[calc(100vh-7rem)] mx-auto bg-[#262626] rounded-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Bar */}
        <div className="h-12 bg-[#1a1a1a] border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold text-lg">🎼 Maestro</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                onClick={() => setShowProjectSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                onClick={handleImportMedia}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Media
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
                <Settings className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Keyboard Shortcuts Panel */}
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-gray-500 flex gap-2">
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">Space</kbd> Play</span>
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">JKL</kbd> Shuttle</span>
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">C</kbd> Cut</span>
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">M</kbd> Marker</span>
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">E</kbd> Effects</span>
              <span className="text-gray-600">|</span>
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">Ctrl+C/V/D</kbd> Copy/Paste/Dup</span>
            </div>
            <div className="text-green-400 text-sm font-mono">
              {formatTimecode(currentTime)} / {formatTimecode(duration)}
            </div>
            
            {/* Upload Progress */}
            {uploadProgress && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <div className="animate-spin">⚙️</div>
                <span>Uploading: {uploadProgress.filename}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-h-0">
          
          <ResizablePanelGroup direction="vertical" className="flex-1">
            
            {/* Top Section - Viewers + Media Pool - Reduced height */}
            <ResizablePanel defaultSize={50} minSize={35}>
              <ResizablePanelGroup direction="horizontal">
                
                {/* Media Pool / Bins + Effects - Increased size */}
                <ResizablePanel defaultSize={22} minSize={18}>
                  <div className="maestro-media-pool h-full bg-[#1e1e1e] border-r border-gray-700 flex flex-col">
                    <div className="h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowEffectsPanel(false)}
                          className={`text-xs px-2 py-1 rounded ${!showEffectsPanel ? 'bg-[#3a3a3a] text-white' : 'text-gray-500'} hover:text-white`}
                        >
                          Media
                        </button>
                        <button
                          onClick={() => setShowEffectsPanel(true)}
                          className={`text-xs px-2 py-1 rounded ${showEffectsPanel ? 'bg-[#3a3a3a] text-white' : 'text-gray-500'} hover:text-white`}
                        >
                          Effects
                        </button>
                      </div>
                      {!showEffectsPanel && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-gray-400"
                            onClick={() => setMediaViewMode(mediaViewMode === 'list' ? 'thumbnails' : 'list')}
                            title={mediaViewMode === 'list' ? 'Thumbnail view' : 'List view'}
                          >
                            {mediaViewMode === 'list' ? <Grid className="w-3 h-3" /> : <List className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-gray-400"
                            onClick={() => {
                              const sorts = ['name', 'duration', 'type'];
                              const currentIndex = sorts.indexOf(mediaSortBy);
                              setMediaSortBy(sorts[(currentIndex + 1) % sorts.length]);
                            }}
                            title={`Sort by: ${mediaSortBy}`}
                          >
                            <SortAsc className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {!showEffectsPanel ? (
                        // Media Pool
                        mediaViewMode === 'list' ? (
                          // LIST VIEW (Default)
                          <div className="space-y-1">
                            {getSortedMediaBins().map(item => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a] transition-colors group"
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                              >
                                {item.type === 'video' ? (
                                  <FileVideo className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                ) : (
                                  <FileAudio className="w-4 h-4 text-green-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-300 truncate group-hover:text-white">{item.name}</div>
                                  <div className="text-[10px] text-gray-500">{formatTimecode(item.duration)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // THUMBNAIL VIEW
                          <div className="space-y-3">
                            {getSortedMediaBins().map(item => (
                              <div
                                key={item.id}
                                className="bg-[#2a2a2a] rounded p-3 cursor-grab active:cursor-grabbing hover:bg-[#333] transition-colors border border-gray-700"
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                              >
                                <div className="aspect-video bg-[#1a1a1a] rounded mb-3 flex items-center justify-center">
                                  <span className="text-gray-500 text-2xl">{item.type === 'video' ? '🎬' : '🎵'}</span>
                                </div>
                                <div className="text-sm text-gray-300 truncate font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{formatTimecode(item.duration)}</div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        // Effects Panel
                        <>
                          <div className="text-xs text-gray-400 font-semibold mb-2">VIDEO TRANSITIONS</div>
                          {effects.filter(e => e.category === 'video' && e.type === 'transition').map(effect => (
                            <div
                              key={effect.id}
                              className="bg-[#2a2a2a] rounded p-2 cursor-pointer hover:bg-[#333] transition-colors border border-gray-700"
                              onClick={() => selectedClip && handleApplyEffect(effect.id, selectedClip)}
                              title="Click to apply to selected clip"
                            >
                              <div className="text-xs text-gray-300">{effect.name}</div>
                            </div>
                          ))}
                          
                          <div className="text-xs text-gray-400 font-semibold mb-2 mt-3">VIDEO FILTERS</div>
                          {effects.filter(e => e.category === 'video' && e.type === 'filter').map(effect => (
                            <div
                              key={effect.id}
                              className="bg-[#2a2a2a] rounded p-2 cursor-pointer hover:bg-[#333] transition-colors border border-gray-700"
                              onClick={() => selectedClip && handleApplyEffect(effect.id, selectedClip)}
                            >
                              <div className="text-xs text-gray-300">{effect.name}</div>
                            </div>
                          ))}
                          
                          <div className="text-xs text-gray-400 font-semibold mb-2 mt-3">COLOR GRADING</div>
                          {effects.filter(e => e.category === 'color').map(effect => (
                            <div
                              key={effect.id}
                              className="bg-[#2a2a2a] rounded p-2 cursor-pointer hover:bg-[#333] transition-colors border border-gray-700"
                              onClick={() => selectedClip && handleApplyEffect(effect.id, selectedClip)}
                            >
                              <div className="text-xs text-gray-300">{effect.name}</div>
                            </div>
                          ))}
                          
                          <div className="text-xs text-gray-400 font-semibold mb-2 mt-3">AUDIO</div>
                          {effects.filter(e => e.category === 'audio').map(effect => (
                            <div
                              key={effect.id}
                              className="bg-[#2a2a2a] rounded p-2 cursor-pointer hover:bg-[#333] transition-colors border border-gray-700"
                              onClick={() => selectedClip && handleApplyEffect(effect.id, selectedClip)}
                            >
                              <div className="text-xs text-gray-300">{effect.name}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Source Monitor */}
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="maestro-monitor h-full bg-[#1e1e1e] border-r border-gray-700 flex flex-col">
                    <div className="maestro-panel h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
                      <span className="text-gray-300 text-sm font-semibold">Source Monitor</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400">
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-black">
                      <div className="text-gray-600 text-sm">No Source Selected</div>
                    </div>
                    {/* Source Controls */}
                    <div className="h-12 bg-[#252525] border-t border-gray-700 flex items-center justify-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Program Monitor (Timeline Output) */}
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="maestro-monitor h-full bg-[#1e1e1e] flex flex-col">
                    <div className="maestro-panel h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
                      <span className="text-gray-300 text-sm font-semibold">Program Monitor</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400">
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-black">
                      <div className="text-gray-600 text-sm">Timeline Preview</div>
                    </div>
                    {/* Program Controls */}
                    <div className="h-12 bg-[#252525] border-t border-gray-700 flex items-center justify-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-green-400"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </ResizablePanel>

              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Section - Timeline - Increased space */}
            <ResizablePanel defaultSize={50} minSize={35}>
              <div className="h-full bg-[#1e1e1e] flex flex-col maestro-timeline">
                
                {/* Timeline Header with Zoom Slider */}
                <div className="h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
                  <span className="text-gray-300 text-sm font-semibold">🎼 Timeline</span>
                  <div className="flex items-center gap-4">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-gray-400 maestro-button"
                        onClick={handleZoomOut}
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <div className="maestro-zoom-slider">
                        <div className="maestro-zoom-track" />
                        <div 
                          className="maestro-zoom-fill" 
                          style={{ width: `${((zoomLevel - 0.5) / 9.5) * 100}%` }}
                        />
                        <div 
                          className="maestro-zoom-thumb" 
                          style={{ left: `${((zoomLevel - 0.5) / 9.5) * 100}%` }}
                        />
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-gray-400 maestro-button"
                        onClick={handleZoomIn}
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                      <div className="text-xs text-gray-400 w-12 text-center font-mono">
                        {Math.round(zoomLevel * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Timecode Ruler - Frame Accurate */}
                <TimelineRuler
                  duration={duration}
                  currentTime={currentTime}
                  onSeek={(time) => {
                    setCurrentTime(time);
                    setIsPlaying(false); // Pause when scrubbing
                  }}
                  zoomLevel={zoomLevel}
                  projectSettings={projectSettings}
                />

                {/* Timeline Tracks Container */}
                <div 
                  className="maestro-timeline-area relative" 
                  onClick={handleTimelineClick}
                >
                  {/* Markers */}
                  {markers.map(marker => (
                    <div
                      key={marker.id}
                      className="absolute top-0 h-full w-1 cursor-pointer group z-30"
                      style={{ 
                        left: `${(marker.time / duration) * 100 * zoomLevel}%`,
                        backgroundColor: marker.color === 'red' ? '#ef4444' :
                                       marker.color === 'blue' ? '#3b82f6' :
                                       marker.color === 'green' ? '#22c55e' :
                                       marker.color === 'yellow' ? '#eab308' :
                                       marker.color === 'purple' ? '#a855f7' : '#f97316'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(marker.time);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteMarker(marker.id);
                      }}
                      title={`${marker.label} - Right-click to delete`}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                        style={{ 
                          borderTopColor: marker.color === 'red' ? '#ef4444' :
                                         marker.color === 'blue' ? '#3b82f6' :
                                         marker.color === 'green' ? '#22c55e' :
                                         marker.color === 'yellow' ? '#eab308' :
                                         marker.color === 'purple' ? '#a855f7' : '#f97316'
                        }}
                      />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {marker.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline Tracks */}
                <div 
                  ref={timelineRef}
                  className="flex-1 overflow-auto bg-[#1a1a1a]"
                  onClick={handleTimelineClick}
                >
                  <div style={{ width: `${100 * zoomLevel}%`, minHeight: '100%' }}>
                    {tracks.map(track => (
                      <div 
                        key={track.id}
                        className="border-b border-gray-700 relative"
                        style={{ 
                          height: `${track.height}px`,
                          backgroundColor: track.type === 'video' ? '#252525' : '#1e1e1e',
                          opacity: track.muted ? 0.5 : 1
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          handleDrop(e, track.id);
                          handleClipDrop(e, track.id);
                        }}
                      >
                        {/* Track Controls */}
                        <div className="absolute left-0 top-0 h-full w-16 bg-[#2a2a2a] border-r border-gray-700 flex flex-col items-center justify-center z-10 gap-1">
                          <span className="text-xs text-gray-400 font-semibold">{track.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleTrackLock(track.id)}
                              className={`text-[10px] ${track.locked ? 'text-red-400' : 'text-gray-600'} hover:text-white`}
                              title={track.locked ? 'Unlock' : 'Lock'}
                            >
                              {track.locked ? '🔒' : '🔓'}
                            </button>
                            <button
                              onClick={() => handleToggleTrackMute(track.id)}
                              className={`text-[10px] ${track.muted ? 'text-red-400' : 'text-gray-600'} hover:text-white`}
                              title={track.muted ? 'Unmute' : 'Mute'}
                            >
                              {track.muted ? '🔇' : '🔊'}
                            </button>
                            <button
                              onClick={() => handleToggleTrackSolo(track.id)}
                              className={`text-[10px] ${track.solo ? 'text-yellow-400' : 'text-gray-600'} hover:text-white`}
                              title={track.solo ? 'Unsolo' : 'Solo'}
                            >
                              S
                            </button>
                          </div>
                        </div>
                      <div className="ml-16 h-full relative">
                        {timelineClips.filter(c => c.track === track.id).map(clip => {
                          const media = mediaBins.find(m => m.id === clip.mediaId);
                          const left = (clip.startTime / duration) * 100;
                          const width = (clip.duration / duration) * 100;
                          const isAudio = track.type === 'audio';
                          return (
                            <div
                              key={clip.id}
                              draggable
                              onDragStart={(e) => handleClipDragStart(e, clip)}
                              className={`maestro-clip absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing transition-all ${
                                selectedClip === clip.id 
                                  ? 'ring-2 ring-blue-500 bg-blue-600' 
                                  : isAudio 
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-purple-700 hover:bg-purple-600'
                              }`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              onClick={() => setSelectedClip(clip.id)}
                            >
                              <div className="px-2 py-1 text-xs text-white truncate pointer-events-none">
                                {media?.name || 'Clip'}
                                <span className="opacity-60 ml-1">{formatTimecode(clip.duration)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    ))}
                    
                    {/* IN/OUT Selection Range */}
                    {inPoint !== null && outPoint !== null && (
                      <div
                        className="maestro-in-out-range"
                        style={{
                          left: `${(inPoint / duration) * 100 * zoomLevel}%`,
                          width: `${((outPoint - inPoint) / duration) * 100 * zoomLevel}%`,
                        }}
                      />
                    )}
                    
                    {/* IN Marker */}
                    {inPoint !== null && (
                      <div
                        className="maestro-in-marker"
                        style={{
                          left: `${(inPoint / duration) * 100 * zoomLevel}%`,
                        }}
                      />
                    )}
                    
                    {/* OUT Marker */}
                    {outPoint !== null && (
                      <div
                        className="maestro-out-marker"
                        style={{
                          left: `${(outPoint / duration) * 100 * zoomLevel}%`,
                        }}
                      />
                    )}
                    
                    {/* Maestro Playhead - ALWAYS ON TOP! Rendered LAST */}
                    <div
                      className="maestro-playhead"
                      style={{ 
                        left: `${(currentTime / duration) * 100 * zoomLevel}%`,
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        zIndex: 999999
                      }}
                      title={formatTimecode(currentTime)}
                    />
                  </div>
                </div>

                {/* Timeline Footer */}
                <div className="h-8 bg-[#252525] border-t border-gray-700 flex items-center justify-between px-3">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs text-gray-400 hover:text-white"
                      onClick={handleSplitClip}
                      title="Split clip at playhead (C)"
                    >
                      <Scissors className="w-3 h-3 mr-1" />
                      Cut
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`h-6 text-xs ${snapToGrid ? 'text-green-400' : 'text-gray-400'} hover:text-white`}
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      title="Snap to grid (S)"
                    >
                      {snapToGrid ? '⊞' : '⊡'} Snap
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`h-6 text-xs ${rippleDelete ? 'text-blue-400' : 'text-gray-400'} hover:text-white`}
                      onClick={() => setRippleDelete(!rippleDelete)}
                      title="Ripple delete - auto-close gaps"
                    >
                      <Layers className="w-3 h-3 mr-1" />
                      Ripple
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`h-6 text-xs ${proxyMode ? 'text-yellow-400' : 'text-gray-400'} hover:text-white`}
                      onClick={() => setProxyMode(!proxyMode)}
                      title="Proxy mode - better performance"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Proxy
                    </Button>
                    {selectedClip && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs text-cyan-400 hover:text-cyan-300"
                          onClick={handleCopyClip}
                          title="Copy clip (Ctrl+C)"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs text-red-400 hover:text-red-300"
                          onClick={handleDeleteClip}
                          title="Delete selected clip (Del)"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    {clipboard && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs text-green-400 hover:text-green-300"
                        onClick={handlePasteClip}
                        title="Paste clip (Ctrl+V)"
                      >
                        Paste
                      </Button>
                    )}
                    <div className="h-4 w-px bg-gray-700 mx-1" />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs text-purple-400 hover:text-purple-300"
                      onClick={handleAddMarker}
                      title="Add marker (M)"
                    >
                      + Marker
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`h-6 text-xs ${showEffectsPanel ? 'text-blue-400' : 'text-gray-400'} hover:text-white`}
                      onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                      title="Toggle effects panel (E)"
                    >
                      Effects
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>24 fps • 1920x1080</span>
                    <span>•</span>
                    <span>{timelineClips.length} clips</span>
                    {proxyMode && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-400">⚡ Proxy</span>
                      </>
                    )}
                    {rippleDelete && (
                      <>
                        <span>•</span>
                        <span className="text-blue-400">Ripple ON</span>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </ResizablePanel>

          </ResizablePanelGroup>

        </div>

      </div>

      {/* Project Settings Dialog */}
      <ProjectSettingsDialog
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
        onSave={(settings) => {
          setProjectSettings(settings);
          console.log('📐 Project settings updated:', settings);
        }}
        currentSettings={projectSettings}
      />

      {/* Media Import Dialog */}
      <MediaImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={(file, mediaInfo) => {
          console.log('📁 Importing file:', file.name, mediaInfo);
          // Handle file import logic here
        }}
      />
    </div>
  );
};

export default VideoEditor;
