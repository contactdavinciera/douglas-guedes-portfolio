# 🎼 MAESTRO DEV SERVER - GUIA DE USO

## 🚀 Como Rodar SEM Desconexões

### **Opção 1: Script Dedicado (RECOMENDADO)**
```powershell
pnpm maestro
```
- Abre terminal dedicado só para o Vite
- Não fecha se você rodar outros comandos
- Melhor para desenvolvimento

### **Opção 2: Terminal Separado**
```powershell
.\start-maestro-dedicated.ps1
```
- Abre nova janela PowerShell
- Use seu terminal atual para git, npm, etc.
- Terminal do Vite fica isolado

### **Opção 3: Versão Estável**
```powershell
pnpm dev:stable
```
- Roda no terminal atual
- Configurações otimizadas para estabilidade
- Host habilitado para rede local

### **Opção 4: Auto-Restart**
```powershell
.\start-maestro-auto.ps1
```
- Reinicia automaticamente se cair
- Útil para desenvolvimento longo
- Conta quantas vezes reiniciou

---

## ⚠️ IMPORTANTE

### **NÃO FAÇA ISSO:**
❌ Rodar `git commit` no mesmo terminal do Vite
❌ Rodar `pnpm install` no terminal do Vite
❌ Fechar o terminal do Vite sem querer

### **FAÇA ISSO:**
✅ Mantenha Vite em terminal dedicado
✅ Use outro terminal para git/npm
✅ Use VS Code integrado terminal com múltiplas abas

---

## 🔧 Configurações do Vite

O `vite.config.js` foi otimizado com:
- ✅ Port fixo (5173)
- ✅ Watch com polling
- ✅ HMR timeout aumentado
- ✅ CORS habilitado
- ✅ Host aberto para rede

---

## 📊 URLs

- **Local**: http://localhost:5173
- **Network**: http://[seu-ip]:5173 (para testar em celular/tablet)

---

## 🆘 Se Ainda Assim Desconectar

1. **Pare todos os processos Node:**
   ```powershell
   Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Limpe cache e reinstale:**
   ```powershell
   Remove-Item -Recurse -Force node_modules, .vite
   pnpm install
   ```

3. **Use versão debug:**
   ```powershell
   pnpm dev:debug
   ```

---

## 💡 Dica Pro

Use VS Code com múltiplos terminais:
- Terminal 1: Vite rodando
- Terminal 2: Git commands
- Terminal 3: Testes/outros scripts

**Atalho VS Code:** `Ctrl + Shift + 5` para split terminal
