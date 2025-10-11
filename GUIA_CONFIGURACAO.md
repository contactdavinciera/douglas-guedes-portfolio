# 🚀 Guia de Configuração Completa - Douglas Guedes Portfolio

## ✅ Status Atual

### Frontend (React + Vite)
- ✅ **Rodando em**: http://localhost:5173
- ✅ **CSS**: Fundo preto renderizando corretamente
- ✅ **Supabase**: Opcional, não trava se não configurado
- ✅ **Dependências**: Todas instaladas via pnpm

### Backend (Flask + Python)
- ✅ **Rodando em**: http://localhost:5001
- ✅ **Ambiente virtual**: `color-studio-backend/venv/`
- ✅ **Dependências**: Todas instaladas (exceto psycopg2 - não necessário)
- ✅ **Database**: SQLite criado automaticamente
- ✅ **CORS**: Configurado para localhost:5173

## 📋 O Que Ainda Falta

### 1. Tokens da Cloudflare (Necessário para Uploads)

Edite o arquivo `color-studio-backend/.env` e adicione:

```bash
# Cloudflare API Token
CLOUDFLARE_API_TOKEN=your_real_token_here

# R2 Storage Keys
R2_ACCESS_KEY_ID=your_r2_access_key_here
R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
```

#### Como obter os tokens:

**Cloudflare API Token:**
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Use template "Edit Cloudflare Stream" ou crie custom com:
   - Stream: Edit
   - Account Resources: Include → Your Account
4. Copie o token gerado

**R2 Access Keys:**
1. Acesse: https://dash.cloudflare.com/
2. Vá em R2 Object Storage
3. Clique em "Manage R2 API Tokens"
4. Create API Token
5. Copie `Access Key ID` e `Secret Access Key`

### 2. Supabase (Opcional - para features de Timeline)

Edite o arquivo raiz `.env` e descomente:

```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Como obter:
1. Criar conta em https://supabase.com
2. Criar novo projeto
3. Settings → API
4. Copiar `Project URL` e `anon/public key`

## 🎯 Como Rodar Localmente

### Terminal 1 - Frontend
```powershell
# Na raiz do projeto
npm run dev
```
Acesse: http://localhost:5173

### Terminal 2 - Backend
```powershell
# Navegar para backend
cd color-studio-backend

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Rodar servidor
python src\main.py
```
Acesse: http://localhost:5001/health

## 🧪 Como Testar

### 1. Testar Frontend
- Abra http://localhost:5173
- Navegue pelas páginas (Portfolio, Services, About, Contact)
- Verifique console (F12) - não deve ter erros críticos

### 2. Testar Backend
- Abra http://localhost:5001/health
- Deve retornar: `{"status": "healthy"}`

### 3. Testar Integração
- Vá em http://localhost:5173/color-studio
- Tente fazer upload de um vídeo pequeno
- Verifique console do navegador e terminal do backend

## 📦 Estrutura de Arquivos Importantes

```
douglas-guedes-portfolio/
├── .env                          # Config frontend (Supabase opcional)
├── src/                          # Frontend React
│   ├── pages/ColorStudio.jsx     # Página de upload
│   └── services/
│       ├── uploadService.js      # Lógica de upload
│       ├── streamApi.js          # API Cloudflare Stream
│       └── r2Api.js              # API R2 Storage
├── color-studio-backend/
│   ├── .env                      # Config backend (Cloudflare REQUIRED)
│   ├── venv/                     # Ambiente virtual Python
│   └── src/
│       ├── main.py               # Entry point
│       ├── routes/               # API endpoints
│       └── services/             # Lógica de negócio
```

## 🔧 Troubleshooting

### Backend não inicia
```powershell
# Verificar se porta 5001 está livre
Get-NetTCPConnection -LocalPort 5001

# Se ocupada, mudar PORT no .env do backend
```

### Frontend não conecta no backend
1. Verificar se `VITE_API_URL` no `.env` raiz aponta para `http://localhost:5001`
2. Verificar CORS no terminal do backend
3. Checar console do navegador (F12)

### Uploads não funcionam
1. Verificar tokens Cloudflare no `color-studio-backend/.env`
2. Verificar logs do terminal do backend
3. Checar Network tab no DevTools (F12)

## 📝 Próximos Passos

1. ✅ **Testar backend via navegador** → Confirmar http://localhost:5001/health
2. ⏳ **Adicionar tokens Cloudflare** → Para uploads funcionarem
3. ⏳ **Testar upload end-to-end** → Upload de vídeo pequeno
4. ⏳ **Configurar Supabase** (opcional) → Para timeline features

## 🆘 Ajuda

Se encontrar problemas:
1. Cheque logs no terminal do backend
2. Abra DevTools (F12) e veja console + Network
3. Verifique se ambos servidores estão rodando
4. Confirme que portas 5001 e 5173 não estão bloqueadas por firewall

---
**Última atualização**: 11/10/2025 01:50 AM
