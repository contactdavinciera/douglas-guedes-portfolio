# 🎨 Painéis Redimensionáveis - Maestro Color Studio

## ✅ IMPLEMENTADO!

### Sistema de Resize (Arrastar bordas)

```
┌─────────────────────────────────────┐
│ Toolbar                             │
├──────┬──────────────────────────────┤
│MEDIA ┃ SOURCE │ PROGRAM            │ ← Altura ajustável
│POOL  ┃ 📺     │   🎬               │   (30% - 70%)
│      ┃        │                    │
│↔️    ┃        │                    │ ← Largura ajustável
│180px ┃        │                    │   (180px - 400px)
│-400px┃        │                    │
├──────┸────────────────────────────────
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ ← Arraste aqui! (↕️)
├──────────────────────────────────────┤
│ Timeline 🎭                         │ ← Altura automática
│ Batuta │ Takes │ Markers           │   (resto do espaço)
├──────────────────────────────────────┤
│ Workspaces                          │
└──────────────────────────────────────┘
```

---

## 🎯 Como usar:

### 1. **Redimensionar Media Pool (largura):**
- Passe o mouse na **borda direita** do Media Pool
- Cursor vira `↔️` (ew-resize)
- **Arraste** para esquerda/direita
- **Limites:** 180px (mínimo) até 400px (máximo)

### 2. **Redimensionar Preview/Timeline (altura):**
- Passe o mouse na **barra horizontal** entre Preview e Timeline
- Cursor vira `↕️` (ns-resize)
- **Arraste** para cima/baixo
- **Limites:** 30% (mínimo) até 70% (máximo)

---

## 🛠️ Implementação Técnica

### Estados:
```javascript
const [mediaPoolWidth, setMediaPoolWidth] = useState(224); // px
const [previewHeight, setPreviewHeight] = useState(50);   // %
const [isResizing, setIsResizing] = useState(null);       // 'mediaPool' | 'preview' | null
```

### Resize Handles:
```jsx
{/* Handle Vertical (Media Pool) */}
<div
  className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500"
  onMouseDown={() => setIsResizing('mediaPool')}
/>

{/* Handle Horizontal (Preview/Timeline) */}
<div
  className="h-1 bg-gray-800 hover:bg-blue-500 cursor-ns-resize"
  onMouseDown={() => setIsResizing('preview')}
>
  <div className="w-12 h-0.5 bg-gray-600 rounded-full" /> {/* Indicador */}
</div>
```

### Mouse Events:
```javascript
useEffect(() => {
  const handleMouseMove = (e) => {
    if (isResizing === 'mediaPool') {
      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 400) {
        setMediaPoolWidth(newWidth);
      }
    } else if (isResizing === 'preview') {
      const container = document.querySelector('[data-forja-container]');
      const rect = container.getBoundingClientRect();
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      if (newHeight >= 30 && newHeight <= 70) {
        setPreviewHeight(newHeight);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(null);
    document.body.style.cursor = 'default';
  };

  if (isResizing) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = isResizing === 'mediaPool' ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none'; // Previne seleção de texto
  }

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isResizing]);
```

---

## 🎨 Visual Feedback:

### Handles inativos:
- **Media Pool:** Linha transparente 1px
- **Preview/Timeline:** Barra cinza com indicador central

### Handles ativos (hover):
- **Cor:** Azul (`bg-blue-500`)
- **Cursor:** Muda automaticamente
- **Transição:** Suave (`transition-colors`)

### Durante resize:
- **Cursor global:** Muda em toda a tela
- **User-select:** Desabilitado (evita selecionar texto)
- **Tempo real:** Painel atualiza enquanto arrasta

---

## 📊 Limites e Constraints:

| Painel | Propriedade | Mínimo | Máximo | Padrão |
|--------|------------|--------|--------|--------|
| **Media Pool** | Largura | 180px | 400px | 224px |
| **Preview** | Altura | 30% | 70% | 50% |
| **Timeline** | Altura | Auto | Auto | Resto |

---

## 🚀 Próximas Melhorias:

### Fase 2:
- [ ] **Salvar preferências** no localStorage
- [ ] **Double-click** no handle = reset ao padrão
- [ ] **Snap points** (25%, 50%, 75%)
- [ ] **Animação suave** ao resetar

### Fase 3:
- [ ] **Preset layouts** (Cinema, Edit, Color)
- [ ] **Keyboard shortcuts** (Ctrl+0 = reset)
- [ ] **Multi-monitor** support
- [ ] **Responsive breakpoints**

---

## 🎭 Comparação com DaVinci/Premiere:

### DaVinci Resolve:
✅ Resize handles nas bordas
✅ Limites min/max
✅ Visual feedback (hover)
❌ Snap points
❌ Preset layouts

### Adobe Premiere Pro:
✅ Painéis flutuantes
✅ Docking system
❌ Implementado aqui (mais complexo)

### **Maestro Color Studio:**
✅ Resize handles
✅ Limites configuráveis
✅ Tempo real
✅ Visual feedback
🎯 **Simples e eficiente!**

---

**Maestro Color Studio** - Professional NLE com painéis personalizáveis! 🎬✨
