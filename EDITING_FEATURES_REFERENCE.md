# 🎬 Funcionalidades de Edição - Premiere Pro & DaVinci Resolve

## 📋 Roadmap de Implementação - Maestro Color Studio

### ✅ Fase 1: FORJA Básica (IMPLEMENTADO)
- [x] Dual Preview (SOURCE + PROGRAM)
- [x] Media Pool (lista/grid)
- [x] Timeline com 4 tracks (V2, V1, A2, A1)
- [x] Batuta (playhead) arrastável
- [x] Scrubbing em tempo real
- [x] Drag & Drop de takes

---

## 🛠️ Fase 2: Ferramentas de Edição Essenciais (PRÓXIMO)

### 1. **SELECTION TOOL (V)** - Ferramenta de Seleção
```
Funcionalidade:
- Clicar e arrastar takes na timeline
- Mover takes entre tracks (V1→V2, A1→A2)
- Arrastar bordas para TRIM (ajustar in/out points)
- Multi-seleção (Shift+clique)
- Ripple (move clips seguintes automaticamente)

Teclas:
- V = Selection Tool
- Shift = Multi-select
- Alt/Option = Duplicate
```

### 2. **RAZOR TOOL (C)** - Ferramenta de Corte
```
Funcionalidade:
- Clicar na timeline para CORTAR take no ponto
- Corta V+A juntos (link) ou separado
- Razor All (corta todos os tracks)

Teclas:
- C = Razor Tool
- Shift+C = Corta apenas o track selecionado
```

### 3. **TRIM TOOLS** - Ajuste de In/Out Points
```
Tipos:
- Ripple Edit: Ajusta e move clips seguintes
- Roll Edit: Ajusta entre 2 clips (mantém duração total)
- Slip: Move conteúdo interno sem mover posição
- Slide: Move clip sem alterar duração

Teclas:
- [ = Set In Point
- ] = Set Out Point
- Alt+[ = Ripple Delete (remove e puxa)
```

### 4. **INSERT & OVERWRITE**
```
INSERT (tecla ,):
- Adiciona take e EMPURRA os seguintes
- Aumenta duração total da timeline

OVERWRITE (tecla .):
- Substitui conteúdo existente
- Mantém duração total
```

### 5. **TRACKS MANAGEMENT**
```
Funcionalidades:
- Adicionar/remover tracks (V3, V4, A3...)
- Lock/Unlock tracks (padlock)
- Solo track (S)
- Mute track (M)
- Track height (pequeno/médio/grande)

Teclas:
- Ctrl+T = New Track
- Ctrl+Shift+T = Delete Track
```

---

## 🎨 Fase 3: Transições e Efeitos

### 6. **VIDEO TRANSITIONS**
```
Tipos principais:
- Cross Dissolve (fade entre clips)
- Dip to Black/White
- Wipe (horizontal/vertical)
- Slide/Push

Implementação:
- Arrastar transição entre takes
- Duração ajustável (frames/seconds)
- Preview em tempo real
```

### 7. **AUDIO TRANSITIONS**
```
Tipos:
- Crossfade (Constant Power)
- Exponential Fade
- Linear Fade

Keyframes:
- Volume (gain)
- Pan (L/R)
- EQ (low/mid/high)
```

---

## ⌨️ Fase 4: Keyboard Shortcuts (Premiere-like)

### Playback Controls
```
Space = Play/Pause
J/K/L = Rewind/Stop/Forward
Shift+J/L = Faster (2x, 4x, 8x)
I = Set In Point
O = Set Out Point
X = Mark Clip (in→out)
```

### Navigation
```
Home = Go to Start
End = Go to End
→ = Next Frame
← = Previous Frame
Shift+→ = 10 Frames Forward
Shift+← = 10 Frames Back
```

### Editing
```
Q = Ripple Trim Previous
W = Ripple Trim Next
Ctrl+K = Cut at Playhead
Delete = Ripple Delete (remove gap)
Backspace = Delete (leave gap)
Ctrl+Z = Undo
Ctrl+Shift+Z = Redo
```

---

## 📊 Fase 5: Timeline Avançada

### 8. **SNAPPING**
```
- Snap to playhead
- Snap to clips
- Snap to markers
- Magnetic timeline (auto-snap)

Tecla: S = Toggle Snap
```

### 9. **LINKED CLIPS** (Video+Audio)
```
- Link/Unlink video e audio
- Editar juntos ou separados
- Sync offset indicator

Tecla: Ctrl+L = Link/Unlink
```

### 10. **MARKERS**
```
Tipos:
- Timeline Marker (global)
- Clip Marker (específico do take)
- Comment Marker (notas)

Cores:
- Red = Review
- Blue = Normal
- Green = Approved
- Yellow = Warning

Tecla: M = Add Marker
```

---

## 🎯 Implementação Prioritária (AGORA)

### Ordem de Desenvolvimento:

1. **Selection Tool** (mover takes)
   - Drag entre tracks
   - Trim bordas (resize)

2. **Razor Tool** (cortar)
   - Corte simples
   - Razor All

3. **Insert/Overwrite**
   - Adicionar do Media Pool
   - Ripple logic

4. **Keyboard Shortcuts**
   - Playback (Space, J/K/L)
   - Frame-by-frame (←→)
   - Corte (Ctrl+K)

5. **Tracks Management**
   - Lock/Unlock
   - Mute/Solo
   - Add/Remove tracks

---

## 🔧 Arquitetura Técnica

### Estado da Timeline:
```javascript
{
  tracks: [
    {
      id: 'v2',
      type: 'video',
      locked: false,
      clips: []
    },
    {
      id: 'v1',
      type: 'video',
      locked: false,
      clips: [
        {
          id: 'clip1',
          takeId: 'take1',
          inPoint: 0,      // Ponto de entrada no source
          outPoint: 120,   // Ponto de saída no source
          startTime: 0,    // Posição na timeline
          duration: 120,   // Duração visível
          speed: 1.0,      // Velocidade (1.0 = normal)
          linkedAudio: 'audio_clip1'
        }
      ]
    },
    // ... A2, A1
  ],
  mode: 'select', // 'select' | 'razor' | 'trim'
  snap: true,
  selectedClips: ['clip1']
}
```

### Tools State:
```javascript
const [editMode, setEditMode] = useState('select'); // 'select' | 'razor' | 'trim'
const [selectedClips, setSelectedClips] = useState([]);
const [isSnapping, setIsSnapping] = useState(true);
```

---

## 📚 Referências Estudadas

### Premiere Pro
- **Selection Tool:** Cursor padrão, arrasta e ajusta
- **Razor Tool:** Corte preciso com preview visual
- **Ripple Delete:** Remove e puxa automaticamente
- **Insert with Drag:** Shift = Insert, normal = Overwrite

### DaVinci Resolve
- **Magnetic Timeline:** Auto-snap inteligente
- **Blade Edit Mode:** Corte rápido (B)
- **Dynamic Trim:** Ajuste em tempo real com preview
- **Color Coding:** Visual de tipos de clip

### Final Cut Pro X
- **Magnetic Timeline 2.0:** Sem gaps, tudo conectado
- **Roles:** Audio roles (dialogue, music, effects)
- **Multicam Editing:** Múltiplos ângulos
- **Compound Clips:** Agrupamento de clips

---

## 🚀 Próximos Passos

1. ✅ Corrigir bug do clique na timeline
2. 🔄 Implementar Selection Tool (drag entre tracks)
3. 🔄 Implementar Razor Tool (corte)
4. 🔄 Adicionar keyboard shortcuts básicos
5. 🔄 Sistema de undo/redo
6. 🔄 Ripple delete logic

---

**Maestro Color Studio** - Professional Video Editing 🎭
