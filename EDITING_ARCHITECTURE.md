# 🎬 Maestro Color Studio - Arquitetura de Edição

## 📐 Sistema de Clips e Tracks

### Estrutura de Dados

```javascript
// Estado global da timeline
const timelineState = {
  tracks: {
    v2: { type: 'video', priority: 2, locked: false, clips: [] },
    v1: { type: 'video', priority: 1, locked: false, clips: [] },
    a2: { type: 'audio', priority: 2, locked: false, clips: [] },
    a1: { type: 'audio', priority: 1, locked: false, clips: [] }
  },
  
  clips: {
    'clip_001': {
      id: 'clip_001',
      takeId: 'take_abc',
      trackId: 'v1',
      startTime: 0,      // Posição na timeline (segundos)
      duration: 120,     // Duração visível (segundos)
      inPoint: 0,        // Ponto de entrada no source
      outPoint: 120,     // Ponto de saída no source
      speed: 1.0,        // Velocidade (1.0 = normal, 0.5 = slow, 2.0 = fast)
      linkedAudioId: 'clip_002', // Link com audio
      effects: [],
      transitions: { in: null, out: null }
    }
  }
}
```

---

## 🎨 Render Engine - Prioridade de Layers

### Video Priority (Z-Index)
```
┌─────────────────────────────┐
│ V2 (priority: 2) ← TOPO     │ ⬅️ Este video domina
│ [Clip 3]  [Clip 4]          │
├─────────────────────────────┤
│ V1 (priority: 1) ← BASE     │ ⬅️ Aparece onde V2 está vazio
│ [Clip 1][Clip 2][Clip 5]    │
└─────────────────────────────┘

Lógica:
- Percorre de V2 → V1
- Primeiro clip com conteúdo no timecode = visível
- Se V2 vazio → mostra V1
```

### Audio Mix (Soma)
```
┌─────────────────────────────┐
│ A2 (priority: 2) ← VOZ OFF  │ ⬅️ +volume
│ [Narração]                  │
├─────────────────────────────┤
│ A1 (priority: 1) ← MÚSICA   │ ⬅️ +volume
│ [Background Music]          │
└─────────────────────────────┘

Lógica:
- A1 + A2 = mix (soma)
- Volume ajustável por track
- Pan L/R independente
```

---

## 🛠️ Ferramentas de Edição

### 1. Selection Tool (V)

**Funcionalidades:**
```javascript
// Drag entre tracks
function handleClipDrag(clipId, sourceTrack, targetTrack, newStartTime) {
  // 1. Remove do track source
  removeClipFromTrack(sourceTrack, clipId);
  
  // 2. Adiciona no track target
  addClipToTrack(targetTrack, clipId, newStartTime);
  
  // 3. Se snap ativado, ajusta para grid
  if (isSnapping) {
    newStartTime = snapToNearestSecond(newStartTime);
  }
  
  // 4. Atualiza PROGRAM monitor
  updateProgramPreview(newStartTime);
}

// Trim (ajustar bordas)
function handleClipTrim(clipId, edge, newPosition) {
  if (edge === 'left') {
    // Ajusta inPoint (entrada)
    updateClipInPoint(clipId, newPosition);
  } else {
    // Ajusta outPoint (saída)
    updateClipOutPoint(clipId, newPosition);
  }
}
```

---

### 2. Razor Tool (C)

**Funcionalidades:**
```javascript
function handleRazorCut(trackId, timecode) {
  // 1. Encontra clip nessa posição
  const clip = findClipAtPosition(trackId, timecode);
  
  if (!clip) return;
  
  // 2. Calcula offset dentro do clip
  const offset = timecode - clip.startTime;
  
  // 3. Cria 2 novos clips
  const leftClip = {
    ...clip,
    id: generateId(),
    duration: offset,
    outPoint: clip.inPoint + offset
  };
  
  const rightClip = {
    ...clip,
    id: generateId(),
    startTime: timecode,
    duration: clip.duration - offset,
    inPoint: clip.inPoint + offset
  };
  
  // 4. Remove clip original
  removeClip(clip.id);
  
  // 5. Adiciona os 2 novos
  addClip(leftClip);
  addClip(rightClip);
  
  // 6. Se linkedAudio, corta também
  if (clip.linkedAudioId) {
    handleRazorCut(audioTrackId, timecode);
  }
}
```

---

### 3. Insert & Overwrite

**INSERT (empurra clips):**
```javascript
function insertClip(takeId, trackId, insertTime) {
  // 1. Cria novo clip
  const newClip = createClipFromTake(takeId, insertTime);
  
  // 2. Move todos clips após insertTime
  const clipsToMove = getClipsAfter(trackId, insertTime);
  clipsToMove.forEach(clip => {
    clip.startTime += newClip.duration;
  });
  
  // 3. Adiciona novo clip
  addClip(newClip);
}
```

**OVERWRITE (substitui):**
```javascript
function overwriteClip(takeId, trackId, insertTime) {
  // 1. Cria novo clip
  const newClip = createClipFromTake(takeId, insertTime);
  
  // 2. Remove clips que se sobrepõem
  const overlappingClips = getOverlappingClips(
    trackId, 
    insertTime, 
    insertTime + newClip.duration
  );
  
  overlappingClips.forEach(clip => removeClip(clip.id));
  
  // 3. Adiciona novo clip
  addClip(newClip);
}
```

---

## 🎬 PROGRAM Monitor - Render Logic

### Qual clip mostrar?
```javascript
function getProgramVideoAtTime(timecode) {
  // 1. Percorre de V2 → V1 (top down)
  for (const trackId of ['v2', 'v1']) {
    const clip = findClipAtPosition(trackId, timecode);
    
    if (clip) {
      // 2. Calcula offset dentro do clip
      const clipOffset = timecode - clip.startTime;
      const sourceTime = clip.inPoint + (clipOffset * clip.speed);
      
      // 3. Retorna take + timecode source
      return {
        takeId: clip.takeId,
        sourceTime: sourceTime,
        effects: clip.effects
      };
    }
  }
  
  // 4. Nenhum clip encontrado = tela preta
  return null;
}

function getProgramAudioAtTime(timecode) {
  const audioSources = [];
  
  // 1. Percorre TODOS tracks de audio
  for (const trackId of ['a1', 'a2']) {
    const clip = findClipAtPosition(trackId, timecode);
    
    if (clip) {
      const clipOffset = timecode - clip.startTime;
      const sourceTime = clip.inPoint + clipOffset;
      
      audioSources.push({
        takeId: clip.takeId,
        sourceTime: sourceTime,
        volume: getTrackVolume(trackId),
        pan: getTrackPan(trackId)
      });
    }
  }
  
  // 2. Retorna todos (serão mixados)
  return audioSources;
}
```

---

## ⌨️ Keyboard Shortcuts

### Global
```javascript
useEffect(() => {
  function handleKeyPress(e) {
    // Ferramentas
    if (e.key === 'v') setEditMode('select');
    if (e.key === 'c') setEditMode('razor');
    if (e.key === 's') setIsSnapping(!isSnapping);
    
    // Playback
    if (e.key === ' ') togglePlayPause();
    if (e.key === 'j') playReverse();
    if (e.key === 'k') pause();
    if (e.key === 'l') playForward();
    
    // Navigation
    if (e.key === 'ArrowLeft') seekFrame(-1);
    if (e.key === 'ArrowRight') seekFrame(1);
    if (e.key === 'Home') seekTo(0);
    if (e.key === 'End') seekTo(totalDuration);
    
    // Editing
    if (e.ctrlKey && e.key === 'k') cutAtPlayhead();
    if (e.key === 'Delete') rippleDelete();
    if (e.key === 'Backspace') deleteWithGap();
  }
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 🎯 Próximas Implementações

### Fase Atual (Agora)
- [x] Toolbar de ferramentas
- [ ] Drag entre tracks (V1↔V2)
- [ ] Razor Tool funcional
- [ ] Render logic (V2 domina V1)
- [ ] Keyboard shortcuts básicos

### Fase 2
- [ ] Trim (ajustar bordas)
- [ ] Insert/Overwrite
- [ ] Link/Unlink V+A
- [ ] Multi-seleção
- [ ] Undo/Redo

### Fase 3
- [ ] Transições (dissolve, wipe)
- [ ] Audio mixing (volume, pan)
- [ ] Markers coloridos
- [ ] Compound clips

---

**Maestro Color Studio** - Professional NLE 🎭
