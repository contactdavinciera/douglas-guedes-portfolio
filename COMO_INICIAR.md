# 🚀 Script de Inicialização - Frontend + Backend

## ⚠️ IMPORTANTE: Sempre use estes comandos!

### 🎯 Para Iniciar TUDO Corretamente:

#### PowerShell (Windows):
```powershell
# 1️⃣ Parar processos antigos (se houver)
Stop-Process -Name node,python -Force -ErrorAction SilentlyContinue

# 2️⃣ Limpar cache do Vite
Remove-Item -Recurse -Force .vite,node_modules\.vite -ErrorAction SilentlyContinue

# 3️⃣ Abrir 2 terminais PowerShell separados:
```

#### Terminal 1 - Frontend (Vite):
```powershell
cd E:\DEV\DOUGLAS` GUEDES.COM\douglas-guedes-portfolio
npm run dev
```
✅ Aguarde aparecer: `Local: http://localhost:5173/`

#### Terminal 2 - Backend (Flask):
```powershell
cd E:\DEV\DOUGLAS` GUEDES.COM\douglas-guedes-portfolio\color-studio-backend
.\venv\Scripts\Activate.ps1
python src\main.py
```
✅ Aguarde aparecer: `Running on http://127.0.0.1:5001`

### 🌐 URLs para Acessar:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | 🎨 Seu site principal (USE ESTE!) |
| **Backend API** | http://localhost:5001/health | 🔧 Apenas para testes da API |

### ⚡ Atalho Rápido (Salve como `start.ps1`):

```powershell
# start.ps1 - Iniciar Frontend + Backend

# Parar processos antigos
Write-Host "🛑 Parando processos antigos..." -ForegroundColor Yellow
Stop-Process -Name node,python -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Limpar cache
Write-Host "🧹 Limpando cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite,node_modules\.vite -ErrorAction SilentlyContinue

# Iniciar Frontend em novo terminal
Write-Host "🚀 Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Iniciar Backend em novo terminal
Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\color-studio-backend'; .\venv\Scripts\Activate.ps1; python src\main.py"

Write-Host ""
Write-Host "✅ TUDO INICIADO!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  SEMPRE acesse: http://localhost:5173" -ForegroundColor Yellow
```

### 🔄 Se o Site Ficar Branco:

**Causa:** Vite travado/com cache antigo

**Solução Rápida:**
```powershell
# No terminal do Vite, pressione:
Ctrl + C  # Parar Vite

# Limpar e reiniciar:
npm run dev
```

### 🆘 Troubleshooting:

#### Problema: "Port 5173 already in use"
```powershell
Stop-Process -Name node -Force
npm run dev
```

#### Problema: "Port 5001 already in use"
```powershell
Stop-Process -Name python -Force
cd color-studio-backend
.\venv\Scripts\Activate.ps1
python src\main.py
```

#### Problema: Site branco mesmo após reiniciar
1. Feche TODOS os navegadores
2. Abra modo anônimo: `Ctrl + Shift + N`
3. Acesse: http://localhost:5173

### 📝 Checklist Antes de Começar:

- [ ] Vite rodando? (`npm run dev`)
- [ ] Backend rodando? (`python src\main.py`)
- [ ] Ambos sem erros nos terminais?
- [ ] Site abre em http://localhost:5173?
- [ ] Fundo está preto?

---
**💡 Dica:** Sempre mantenha 2 terminais abertos - um para cada serviço!
