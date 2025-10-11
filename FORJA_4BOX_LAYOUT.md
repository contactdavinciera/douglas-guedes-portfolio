# 🎬 Nova Estrutura FORJA - 4 Boxes Redimensionáveis

## Layout Final:

```
┌─────────────────────────────────────────────────────────┐
│ Toolbar (fixa 48px)                                     │
├──────────┬─────────────────────────┬────────────────────┤
│          │                         │                    │
│  MEDIA   │    SOURCE              │    EDIT PANEL      │
│  POOL    │    📺                  │    🔧 Controls     │
│  📁      │                         │    • Resize        │
│  [v1]    │                         │    • Crop          │
│  [v2]    │                         │    • Transform     │
│  [v3]    │                         │    • Speed         │
│          │                         │                    │
│  15-40%  │    Rest (40-70%)        │    15-40%          │
│  ↔️      │                         │    ↔️             │
├──────────┴─────────────────────────┴────────────────────┤
│ ══ Toolbar Edição (FIXA 40px) ═══════════════════════  │
│ 🎯 Select  ✂️ Razor  🧲 Snap  Space Play  ←→ Frame     │
├───────────────────────────────────────────────────────┤
│                                                          │
│  🎭 Timeline (REDIMENSIONÁVEL 200-600px)                │
│  V2 │                                                   │
│  V1 │ [████████] [████████]                            │
│  A2 │                                                   │
│  A1 │ ═══waveform═══                                   │
│                                                          │
│  ↕️ Arraste aqui                                        │
├───────────────────────────────────────────────────────┤
│ ══ Zoom (FIXA 32px) ═════════════════════════════════ │
│ Zoom: ▬▬▬▬▬ 100%                                       │
├───────────────────────────────────────────────────────┤
│ Workspaces (FIXA 64px)                                 │
│ 🔥 Edit  │  🎨 Color  │  💬 Review                     │
└───────────────────────────────────────────────────────┘
```

---

## Estados:

```javascript
const [mediaPoolWidth, setMediaPoolWidth] = useState(20); // % (15-40%)
const [editPanelWidth, setEditPanelWidth] = useState(20); // % (15-40%)
const [timelineHeight, setTimelineHeight] = useState(300); // px (200-600px)
```

---

## Proporções Mantidas:

### Larguras (horizontal):
- **Media Pool:** 15% - 40%
- **SOURCE:** 100% - MediaPool% - EditPanel%
- **Edit Panel:** 15% - 40%

**Exemplo:**
- Media Pool = 20%
- Edit Panel = 20%
- SOURCE = 60% (resto)

Se aumenta Media Pool para 30%:
- Media Pool = 30%
- Edit Panel = 20%
- SOURCE = 50% (diminui automaticamente)

---

## Elementos FIXOS (não redimensionam):

1. **Toolbar Edição:** 40px
   - Selection Tool, Razor, Snap, Shortcuts

2. **Barra de Zoom:** 32px
   - Slider de zoom
   - Porcentagem

3. **Workspace Selector:** 64px
   - Edit, Color, Review

---

## Elementos REDIMENSIONÁVEIS:

1. **Media Pool (largura):** 15% - 40%
2. **Edit Panel (largura):** 15% - 40%
3. **Timeline (altura):** 200px - 600px

---

## Resize Handles:

```jsx
{/* Media Pool - borda direita */}
<div
  className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500"
  onMouseDown={() => setIsResizing('mediaPool')}
/>

{/* Edit Panel - borda esquerda */}
<div
  className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-blue-500"
  onMouseDown={() => setIsResizing('editPanel')}
/>

{/* Timeline - borda inferior (acima do zoom) */}
<div
  className="h-1 bg-gray-800 hover:bg-blue-500 cursor-ns-resize"
  onMouseDown={() => setIsResizing('timeline')}
/>
```

---

## Edit Panel - Conteúdo:

```jsx
<div className="edit-panel">
  <h3>Edit Controls</h3>
  
  {/* Transform */}
  <section>
    <h4>Transform</h4>
    <input label="Scale X" />
    <input label="Scale Y" />
    <input label="Rotation" />
    <input label="Position X" />
    <input label="Position Y" />
  </section>
  
  {/* Crop */}
  <section>
    <h4>Crop</h4>
    <input label="Top" />
    <input label="Bottom" />
    <input label="Left" />
    <input label="Right" />
  </section>
  
  {/* Speed */}
  <section>
    <h4>Speed / Duration</h4>
    <input label="Speed %" />
    <input label="Duration" />
    <checkbox label="Reverse" />
  </section>
  
  {/* Opacity */}
  <section>
    <h4>Opacity</h4>
    <slider min="0" max="100" />
  </section>
</div>
```

---

## Implementação passo a passo:

1. ✅ Criar estados (mediaPoolWidth, editPanelWidth, timelineHeight)
2. ✅ Atualizar resize handlers
3. 🔄 Reorganizar estrutura HTML (4 boxes)
4. 🔄 Adicionar Edit Panel (nova box)
5. 🔄 Toolbar fixa com ferramentas
6. 🔄 Timeline com altura variável
7. 🔄 Zoom fixo embaixo

---

**Maestro Color Studio** - 4-Box Professional Layout 🎬
