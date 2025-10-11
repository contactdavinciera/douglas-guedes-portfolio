# MAESTRO NLE - PROFESSIONAL TIMELINE IMPLEMENTATION GUIDE

## 🎯 ARCHITECTURE OVERVIEW

### Core Concept: Fixed Playhead, Scrolling Content

```
┌─────────────────────────────────────────────────────────┐
│  FIXED HEADER (Timecode Ruler)                          │
│  [00:00:00:00] [00:00:10:00] [00:00:20:00] ...         │
├─────────────────────────────────────────────────────────┤
│  FIXED VIEWPORT (1920x1080 or user's screen)            │
│  ┌──────────────────────────────────────┐               │
│  │  Track │  SCROLLABLE CONTENT          │               │
│  │  Labels│  ┌──────────────────────┐   │               │
│  │  ┌───┐ │  │  Clips positioned    │   │               │
│  │  │V1 │ │  │  by TIME not pixels  │   │               │
│  │  └───┘ │  │       ▼ PLAYHEAD     │   │               │
│  │  ┌───┐ │  │       │ (FIXED)      │   │               │
│  │  │A1 │ │  │  ████████████████    │   │               │
│  │  └───┘ │  └──────────────────────┘   │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘

KEY: Playhead is rendered OUTSIDE the scroll container
     Content scrolls UNDER the fixed playhead
```

---

## 📐 MATHEMATICAL FOUNDATION

### 1. Coordinate System

Everything is TIME-BASED, converted to pixels for rendering:

```javascript
// Core formula
pixelPosition = time * scale

// Where:
scale = BASE_SCALE * zoom
BASE_SCALE = 10 (pixels per second at zoom 1.0)

// Examples:
zoom 1.0x: 30 seconds = 30 * 10 * 1.0 = 300px
zoom 2.0x: 30 seconds = 30 * 10 * 2.0 = 600px
zoom 0.5x: 30 seconds = 30 * 10 * 0.5 = 150px
```

### 2. Playhead Positioning

```javascript
// Playhead is FIXED at viewport center
playheadPosition = viewportWidth * 0.5

// Content scroll to center playhead
scrollLeft = (currentTime * scale) - playheadPosition

// This ensures:
// - Playhead never moves visually
// - Content slides under playhead
// - Timecode always matches visual position
```

### 3. Visible Time Range

```javascript
visibleDuration = viewportWidth / scale
startTime = currentTime - (visibleDuration * 0.5)
endTime = currentTime + (visibleDuration * 0.5)

// Example at zoom 1.0x with 1920px viewport:
// visibleDuration = 1920 / 10 = 192 seconds
// If currentTime = 60s:
//   startTime = 60 - 96 = -36s (clamp to 0)
//   endTime = 60 + 96 = 156s
```

---

## 🏗️ IMPLEMENTATION STRUCTURE

### HTML Structure

```html
<div class="timeline-container">
  <!-- FIXED HEADER -->
  <div class="timeline-ruler-fixed">
    <!-- Ruler ticks, always synced with content below -->
  </div>

  <!-- VIEWPORT (Fixed size, overflow hidden) -->
  <div class="timeline-viewport">
    <!-- FIXED PLAYHEAD (position: absolute, left: 50%) -->
    <div class="playhead-fixed">
      <div class="playhead-line"></div>
      <div class="playhead-timecode">00:02:17:19</div>
    </div>

    <!-- SCROLLABLE CONTENT -->
    <div class="timeline-content-scroll">
      <!-- Track labels (sticky left) -->
      <div class="track-labels-sticky">
        <div class="track-label">V1</div>
        <div class="track-label">A1</div>
      </div>

      <!-- Clips container (scrolls horizontally) -->
      <div class="clips-container">
        <!-- Each clip positioned by: left = startTime * scale -->
        <div class="clip" style="left: 300px; width: 600px">
          <!-- Clip at 30s, duration 60s, zoom 1.0 -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### CSS Architecture

```css
/* VIEWPORT - Fixed container */
.timeline-viewport {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  overflow: hidden; /* No scrollbars visible */
}

/* FIXED PLAYHEAD - Never moves */
.playhead-fixed {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
}

.playhead-line {
  width: 2px;
  height: 100%;
  background: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

/* SCROLLABLE CONTENT */
.timeline-content-scroll {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  /* Width = maxTime * scale */
}

/* CLIP - Positioned by time */
.clip {
  position: absolute;
  /* left = startTime * scale */
  /* width = duration * scale */
  height: 60px;
  background: purple;
}
```

---

## ⚙️ ZOOM BEHAVIOR

### Zoom In (Ctrl +)

```javascript
// User presses Ctrl +
newZoom = currentZoom * 1.5

// Timeline state updates:
1. scale = BASE_SCALE * newZoom
2. All clips recalculate: newLeft = startTime * newScale
3. Scroll position updates to keep playhead centered:
   newScrollLeft = (currentTime * newScale) - playheadPosition
4. Ruler regenerates ticks for new scale

Result:
- Content appears larger
- Playhead stays fixed at center
- Current timecode unchanged
- More detail visible
```

### Zoom Out (Ctrl -)

```javascript
// User presses Ctrl -
newZoom = currentZoom / 1.5

// Same process as zoom in
// Result: Content appears smaller, more timeline visible
```

---

## 🧲 MAGNETIC SNAPPING

### Snap Points Registration

```javascript
snapEngine.registerClips([
  { id: 'clip1', startTime: 10, duration: 30 }, // Creates snaps at 10s and 40s
  { id: 'clip2', startTime: 50, duration: 20 }  // Creates snaps at 50s and 70s
])

// Also adds timeline zero (0s)
```

### Snap Detection During Drag

```javascript
// While dragging clip to time 39.7s:
const snap = snapEngine.findSnap(39.7, 'clip1')

// Returns:
{
  time: 40,
  type: 'clip-end',
  clipId: 'clip2',
  distance: 0.3 // seconds
}

// If distance < threshold (0.2s), snap to 40s
// Visual indicator appears at snap point
```

---

## 🎮 USER INTERACTIONS

### 1. Playhead Movement

```javascript
// User clicks ruler or scrubs
setCurrentTime(newTime)

// useEffect triggers:
useEffect(() => {
  const scrollLeft = timelineState.getScrollPosition()
  scrollContainer.scrollLeft = scrollLeft
  // Playhead stays fixed, content scrolls
}, [currentTime, zoom])
```

### 2. Clip Dragging

```javascript
// On mouse move during drag:
const deltaPixels = mouseX - startMouseX
const deltaTime = deltaPixels / scale
const newStartTime = originalStartTime + deltaTime

// Check snap:
const snap = snapEngine.findSnap(newStartTime, clipId)
if (snap) {
  newStartTime = snap.time // Magnetic snap!
}

// Update clip:
clip.startTime = newStartTime
clip.style.left = `${newStartTime * scale}px`
```

### 3. Ruler Scrubbing

```javascript
// User clicks/drags ruler:
const rect = ruler.getBoundingClientRect()
const clickX = event.clientX - rect.left
const clickTime = timelineState.pixelToTime(clickX + scrollLeft)
setCurrentTime(clickTime)
```

---

## 📊 PERFORMANCE OPTIMIZATIONS

### 1. Virtualization
Only render clips visible in viewport + small buffer

```javascript
const { startTime, endTime } = timelineState.getVisibleTimeRange()
const visibleClips = allClips.filter(clip => 
  clip.startTime < endTime &&
  clip.startTime + clip.duration > startTime
)
```

### 2. RequestAnimationFrame
Use RAF for smooth scrolling

```javascript
const syncScroll = () => {
  const targetScroll = timelineState.getScrollPosition()
  scrollContainer.scrollLeft = targetScroll
  // Smooth 60fps updates
}

requestAnimationFrame(syncScroll)
```

### 3. Debounced Ruler Regeneration
Don't regenerate ticks on every scroll

```javascript
const debouncedRulerUpdate = debounce(() => {
  const ticks = rulerGenerator.generateTicks()
  renderRuler(ticks)
}, 100)
```

---

## ✅ BENEFITS OF THIS ARCHITECTURE

1. **Frame-Accurate**: Mathematical precision, no rounding errors
2. **Scalable**: Handles hours of content without performance issues
3. **Predictable**: Timecode always matches visual position
4. **Professional**: Matches industry-standard NLE behavior
5. **Maintainable**: Clear separation of concerns

---

## 🚀 NEXT STEPS

1. Refactor VideoEditor.jsx to use TimelineState
2. Create ProfessionalTimelineRuler component
3. Update TimelineClip to use timeToPixel()
4. Implement FixedPlayhead overlay
5. Add zoom controls (Ctrl +/-)
6. Add magnetic snapping visual feedback
7. Implement frame-stepping (Left/Right arrows)
8. Add IN/OUT point system

---

## 📚 REFERENCES

- DaVinci Resolve Timeline Architecture
- Premiere Pro Timeline Principles
- Final Cut Pro Magnetic Timeline
- Avid Media Composer Track-Based Editing
