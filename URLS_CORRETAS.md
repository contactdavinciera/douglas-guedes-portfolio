# ⚠️ IMPORTANTE: URLs Corretas

## 🎯 SEMPRE Use Estas URLs:

### ✅ FRONTEND (Seu Site React)
```
http://localhost:5173
```
**Este é o seu site principal!**
- Fundo preto ✅
- Navegação funcionando ✅
- Todas as páginas ✅
- Interface completa ✅

### ❌ BACKEND (Apenas API - NÃO abra no navegador)
```
http://localhost:5001
```
**Este é apenas para API!**
- Mostra página de teste branca (não é seu site)
- Usado apenas pelo frontend para fazer uploads
- Não deve ser acessado diretamente no navegador

## 📝 Como Funciona

```
┌─────────────────────────────────────────┐
│  SEU NAVEGADOR                          │
│                                         │
│  http://localhost:5173 (FRONTEND)      │
│  ↓                                      │
│  Seu site React com fundo preto        │
│  ↓                                      │
│  Quando você faz upload:                │
│  ├─→ Chama http://localhost:5001/api/  │
│  │   (BACKEND - nos bastidores)        │
│  └─→ Recebe resposta e mostra na tela  │
└─────────────────────────────────────────┘
```

## 🚨 Se Você Ver Tela Branca

**Verifique a URL:**
- ❌ `http://localhost:5001` → ERRADO! Página de teste do backend
- ✅ `http://localhost:5173` → CORRETO! Seu site React

## 📚 Resumo

| Serviço | URL | Acessar no Navegador? | Para Que Serve |
|---------|-----|----------------------|----------------|
| **Frontend** | `http://localhost:5173` | ✅ SIM | Seu site principal |
| **Backend** | `http://localhost:5001` | ❌ NÃO | API para uploads |

---
**Salve este link nos favoritos:** http://localhost:5173
