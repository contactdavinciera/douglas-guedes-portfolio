# 🚀 Scripts de Inicialização

## 🎯 Uso Rápido

### **Opção 1: Clique Duplo (Windows)**
```
start-dev.bat
```
- Abre 2 janelas automaticamente
- Frontend e Backend rodando separados
- Não fecha se der erro

### **Opção 2: PowerShell**
```powershell
.\start-dev.ps1
```
- Mesmo comportamento do `.bat`
- Melhor para PowerShell users

### **Opção 3: Docker Compose (Backend Flask)**
```bash
docker-compose up -d
```
- Roda apenas o Backend Flask no Docker
- Supabase continua no Docker separado
- Frontend roda com `pnpm dev`

---

## 📦 Estrutura

```
FRONTEND (Vite)     → localhost:5173  → pnpm dev
BACKEND (Flask)     → localhost:5001  → Python / Docker
SUPABASE (Docker)   → localhost:54321 → Docker Compose (separado)
```

---

## 🐳 Docker vs Python Direto

### **Rodar Flask com Python:**
```bash
cd color-studio-backend
python src/main.py
```

### **Rodar Flask com Docker:**
```bash
docker-compose up backend
```

---

## ⚠️ Importante

- **Supabase** já roda no Docker separadamente
- **Frontend** sempre roda com `pnpm dev` (development)
- **Backend Flask** pode rodar direto OU no Docker

---

## 🔧 Para Parar Tudo

### Python:
- Fechar as janelas dos terminais
- Ou `Ctrl+C`

### Docker:
```bash
docker-compose down
```

---

## 💡 Recomendação

**Desenvolvimento:**
- Use `start-dev.bat` → Mais rápido, hot reload funciona

**Produção/Testes:**
- Use `docker-compose up` → Ambiente isolado
