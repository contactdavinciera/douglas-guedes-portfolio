import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  const [mediaSortBy, setMediaSortBy] = useState('name'); // 'name', 'duration', 'type'

  // Refs
  const timelineRef = useRef(null);
  const playheadRef = useRef(null);

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
        case 'l': // L - Forward play
          e.preventDefault();
          setPlaybackSpeed(1);
          setIsPlaying(true);
          break;
        case 'i': // I - Set in point
          e.preventDefault();
          console.log('Set in point:', currentTime);
          break;
        case 'o': // O - Set out point
          e.preventDefault();
          console.log('Set out point:', currentTime);
          break;
        case 'c': // C - Cut/Split
          e.preventDefault();
          handleSplitClip();
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
          handleDeleteClip();
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
        case 'arrowleft':
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - (1/24))); // 1 frame back
          break;
        case 'arrowright':
          e.preventDefault();
          setCurrentTime(Math.min(duration, currentTime + (1/24))); // 1 frame forward
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, selectedClip, snapToGrid]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (playbackSpeed * 1/24); // 1 frame step
        if (next >= duration || next < 0) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 1000 / 24); // 24fps

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, duration]);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center p-4">
      {/* Main Editor Container - Optimized layout */}
      <div className="w-[95vw] h-[95vh] bg-[#262626] rounded-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Bar */}
        <div className="h-12 bg-[#1a1a1a] border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">Pro Studio Editor</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
                <FolderOpen className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
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
                  <div className="h-full bg-[#1e1e1e] border-r border-gray-700 flex flex-col">
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
                  <div className="h-full bg-[#1e1e1e] border-r border-gray-700 flex flex-col">
                    <div className="h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
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
                  <div className="h-full bg-[#1e1e1e] flex flex-col">
                    <div className="h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
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
              <div className="h-full bg-[#1e1e1e] flex flex-col">
                
                {/* Timeline Header */}
                <div className="h-10 bg-[#252525] border-b border-gray-700 flex items-center justify-between px-3">
                  <span className="text-gray-300 text-sm font-semibold">Timeline</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-gray-400"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <div className="text-xs text-gray-500 w-12 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-gray-400"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Timeline Ruler with Markers */}
                <div className="h-8 bg-[#2a2a2a] border-b border-gray-700 relative">
                  <div 
                    className="h-full flex items-end"
                    style={{ width: `${100 * zoomLevel}%` }}
                  >
                    {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
                      <div key={i} className="flex-1 border-l border-gray-600 relative">
                        <span className="absolute top-0 left-1 text-[10px] text-gray-400 font-mono">
                          {formatTimecode(i * 10)}
                        </span>
                        {/* Minor ticks */}
                        {Array.from({ length: 9 }).map((_, j) => (
                          <div
                            key={j}
                            className="absolute h-2 border-l border-gray-700"
                            style={{ left: `${((j + 1) / 10) * 100}%` }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  {/* Markers */}
                  {markers.map(marker => (
                    <div
                      key={marker.id}
                      className="absolute top-0 h-full w-1 cursor-pointer group"
                      style={{ 
                        left: `${(marker.time / duration) * 100}%`,
                        backgroundColor: marker.color === 'red' ? '#ef4444' :
                                       marker.color === 'blue' ? '#3b82f6' :
                                       marker.color === 'green' ? '#22c55e' :
                                       marker.color === 'yellow' ? '#eab308' :
                                       marker.color === 'purple' ? '#a855f7' : '#f97316'
                      }}
                      onClick={() => handleMarkerClick(marker.time)}
                      onContextMenu={(e) => {
                        e.preventDefault();
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
                      {/* Tooltip */}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {marker.label}
                      </div>
                    </div>
                  ))}
                  
                  {/* Playhead */}
                  <div
                    ref={playheadRef}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
                  </div>
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
                        onDrop={(e) => handleDrop(e, track.id)}
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
                        {timelineClips.filter(c => c.track === 'v1').map(clip => {
                          const media = mediaBins.find(m => m.id === clip.mediaId);
                          const left = (clip.startTime / duration) * 100;
                          const width = (clip.duration / duration) * 100;
                          return (
                            <div
                              key={clip.id}
                              className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all ${
                                selectedClip === clip.id 
                                  ? 'ring-2 ring-blue-500 bg-blue-600' 
                                  : 'bg-purple-700 hover:bg-purple-600'
                              }`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              onClick={() => setSelectedClip(clip.id)}
                            >
                              <div className="px-2 py-1 text-xs text-white truncate">
                                {media?.name || 'Clip'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    ))}
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
    </div>
  );
};

export default VideoEditor;
