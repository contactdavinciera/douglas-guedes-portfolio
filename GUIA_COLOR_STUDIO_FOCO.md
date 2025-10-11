# 🎬 FOCO: COLOR STUDIO - GUIA PRÁTICO

## 🎯 OBJETIVO

Validar o **núcleo técnico complexo** do projeto:
- ✅ Upload de vídeos (MP4 + RAW)
- ✅ Conversão FFmpeg (RAW → H.265)
- ✅ Integração Cloudflare (R2 + Stream)
- ✅ Timeline profissional
- ✅ Sistema de color grading

**Portfolio/Sobre/Textos:** Deixar para DEPOIS ✅

---

## 🚀 PLANO SIMPLIFICADO (3 PASSOS)

```
┌────────────────────────────┐
│  PASSO 1: TOKENS (30min)   │
│  • Cloudflare Dashboard    │
│  • Copiar 3 tokens         │
│  • Configurar .env         │
└────────────────────────────┘
            ↓
┌────────────────────────────┐
│  PASSO 2: UPLOAD (20min)   │
│  • Testar MP4 pequeno      │
│  • Ver conversão           │
│  • Confirmar Stream        │
└────────────────────────────┘
            ↓
┌────────────────────────────┐
│  PASSO 3: GRADE (30min)    │
│  • ProColorGradingStudio   │
│  • Timeline + LUTs         │
│  • Correções de cor        │
└────────────────────────────┘
```

**Total:** ~1h30min de trabalho foco!

---

## 📝 PASSO 1: OBTER TOKENS CLOUDFLARE

### Por que precisamos?
- **CLOUDFLARE_API_TOKEN:** Acesso à API do Cloudflare
- **R2_ACCESS_KEY_ID:** Upload para R2 Storage
- **R2_SECRET_ACCESS_KEY:** Autenticação R2

### Como obter (passo a passo)

#### 1.1) Cloudflare API Token

**Acesso:**
1. Ir para https://dash.cloudflare.com/
2. Login (se não tiver conta, criar)
3. Clicar no ícone do perfil (canto superior direito)
4. **"Meu Perfil"** → **"Tokens de API"**

**Criar Token:**
5. Clicar **"Criar token"**
6. **Duas opções:**

   **OPÇÃO A - Template (Mais fácil):**
   - Buscar template: **"Edit Cloudflare Stream"**
   - Clicar **"Usar modelo"**
   - Scroll down → **"Continuar para o resumo"**
   - **"Criar token"**
   - ⚠️ **COPIAR TOKEN** (só aparece UMA vez!)
   - Anotar: `CLOUDFLARE_API_TOKEN=token_aqui`

   **OPÇÃO B - Personalizado (Se não achar template):**
   - Clicar **"Criar token personalizado"**
   - Nome: "Color Studio API"
   - Permissões:
     - Account → Stream → Edit
     - Account → R2 → Edit
   - Recursos da conta: Inclua → Sua conta
   - **"Continuar para o resumo"**
   - **"Criar token"**
   - ⚠️ **COPIAR TOKEN** (só aparece UMA vez!)

**Exemplo de token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ...
```

#### 1.2) R2 API Tokens

**Acesso:**
1. No dashboard Cloudflare (já logado)
2. Sidebar esquerda → **"R2"** (ícone de balde/bucket)
3. Canto superior direito → **"Manage R2 API Tokens"**

**Criar Token:**
4. Clicar **"Create API Token"**
5. Nome: "Color Studio R2"
6. Permissões: **"Admin Read & Write"** (ou "Edit" se disponível)
7. (Opcional) TTL: "Forever" ou tempo específico
8. **"Create API Token"**

**Copiar Credenciais:**
9. Vai aparecer 2 valores:
   - **Access Key ID:** tipo `7f89a3b2c1d4e5f6a7b8c9d0`
   - **Secret Access Key:** tipo `9x8y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h`
10. ⚠️ **COPIAR AMBOS** (só aparecem UMA vez!)

**Anotar:**
```
R2_ACCESS_KEY_ID=sua_access_key_aqui
R2_SECRET_ACCESS_KEY=sua_secret_key_aqui
```

#### 1.3) Account ID

**Pegar Account ID:**
1. No dashboard Cloudflare
2. Sidebar → Clicar em qualquer produto (Workers, Pages, etc.)
3. Na URL você verá: `dash.cloudflare.com/[ACCOUNT_ID]/workers`
4. Copiar esse `ACCOUNT_ID` da URL

**Ou mais fácil:**
- Sidebar → R2
- No topo da página de R2, logo abaixo do título, deve mostrar seu Account ID

**Exemplo:**
```
CLOUDFLARE_ACCOUNT_ID=d4582884a8eb6bd3a185a18e3a918026
```

#### ✅ Checklist: Você deve ter agora

```bash
CLOUDFLARE_ACCOUNT_ID=d4582884a8eb6bd3a185a18e3a918026
CLOUDFLARE_API_TOKEN=eyJhbGciOiJIUzI1NiIs...
R2_ACCESS_KEY_ID=7f89a3b2c1d4e5f6...
R2_SECRET_ACCESS_KEY=9x8y7z6w5v4u3t2s...
```

---

## 🔧 PASSO 1.5: CONFIGURAR .ENV BACKEND

### Como fazer

**1. Abrir arquivo:**
```
color-studio-backend/.env
```

**2. Substituir valores:**

**ANTES (valores exemplo):**
```bash
CLOUDFLARE_ACCOUNT_ID=d4582884a8eb6bd3a185a18e3a918026
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
R2_ACCESS_KEY_ID=your_r2_access_key_here
R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
R2_BUCKET_NAME=color-studio-raw-files
```

**DEPOIS (valores reais):**
```bash
CLOUDFLARE_ACCOUNT_ID=d4582884a8eb6bd3a185a18e3a918026  # (pode ser o mesmo)
CLOUDFLARE_API_TOKEN=eyJhbGciOiJIUzI1NiIs...  # ← SEU TOKEN REAL
R2_ACCESS_KEY_ID=7f89a3b2c1d4e5f6...         # ← SEU ACCESS KEY
R2_SECRET_ACCESS_KEY=9x8y7z6w5v4u3t2s...     # ← SEU SECRET KEY
R2_BUCKET_NAME=color-studio-raw-files        # (pode deixar igual)
```

**3. Salvar arquivo** (Ctrl+S)

---

### IMPORTANTE: Reiniciar Backend

**Após editar .env, você DEVE reiniciar o backend!**

**Como fazer:**

**Opção A - Parar e Iniciar:**
1. No terminal do backend (onde está rodando Python)
2. Apertar **Ctrl+C** (para o servidor)
3. Rodar novamente:
   ```powershell
   cd E:\DEV\DOUGLAS` GUEDES.COM\douglas-guedes-portfolio\color-studio-backend
   .\venv\Scripts\Activate.ps1
   python src\main.py
   ```

**Opção B - Usar novo terminal:**
1. Deixar o antigo rodando (ele vai falhar mesmo)
2. Abrir novo terminal PowerShell
3. Rodar comandos acima

---

### ✅ Verificar se funcionou

**Logs do backend devem mostrar:**
```
✅ R2 Service initialized: https://d4582884a8eb6bd3a185a18e3a918026.r2.cloudflarestorage.com/color-studio-raw-files
✅ Database tables created successfully
🚀 Backend initialized successfully
```

**Se aparecer erro:**
```
❌ R2 configuration error: Invalid credentials
```
→ Tokens estão errados, verificar novamente

---

## 🎬 PASSO 2: TESTAR UPLOAD

### Preparação

**Você precisa de:**
1. Vídeo MP4 pequeno (50-200MB recomendado)
2. Resolução: 1080p ou menor
3. Duração: 30 segundos a 2 minutos
4. Codec: H.264 (qualquer MP4 normal serve)

**Onde conseguir se não tiver:**
- Gravar vídeo no celular (30s)
- Baixar vídeo teste: https://sample-videos.com/
- Qualquer MP4 que você tenha

### Passo a Passo do Upload

#### 2.1) Acessar Color Studio
1. Abrir navegador
2. Ir para: http://localhost:5173/color-studio
3. Deve aparecer interface de upload

#### 2.2) Selecionar Arquivo
4. Clicar botão **"Selecionar Arquivo"**
5. Escolher seu vídeo MP4
6. **Aguardar análise** (5-10 segundos)

#### 2.3) Verificar Informações
7. Sistema deve mostrar:
   - ✅ Nome do arquivo
   - ✅ Tamanho (em MB/GB)
   - ✅ Duração (minutos:segundos)
   - ✅ Resolução (1920x1080, etc.)
   - ✅ Tipo: "Standard Video" (não RAW)

#### 2.4) Iniciar Upload
8. Clicar **"Iniciar Upload"**
9. **Acompanhar progresso:**
   - Barra de progresso deve subir (0% → 100%)
   - Mensagem: "Enviando Arquivo..."
   - Depois: "Convertendo para H.265..."

#### 2.5) Monitorar Logs Backend
10. **Olhar terminal do backend**, deve aparecer:
```
[INFO] Upload initialized for file: seu_video.mp4
[INFO] Chunk 1/10 uploaded
[INFO] Chunk 2/10 uploaded
...
[INFO] Upload completed to R2
[INFO] Starting FFmpeg conversion...
[INFO] FFmpeg processing...
[INFO] Conversion completed
[INFO] Uploading to Cloudflare Stream...
[INFO] Video available at: https://stream.cloudflare.com/abc123
```

#### 2.6) Sucesso Final
11. Frontend deve mostrar:
   - ✅ Mensagem de sucesso
   - ✅ "Timeline View" aparece
   - ✅ Ou player de vídeo

---

### 🐛 Possíveis Erros e Soluções

#### Erro 1: "Falha ao iniciar upload"
**Causa:** Tokens inválidos ou R2 não configurado
**Solução:**
1. Verificar tokens no .env
2. Reiniciar backend
3. Verificar logs do backend para erro específico

#### Erro 2: "Upload travou em X%"
**Causa:** Conexão interrompida ou arquivo muito grande
**Solução:**
1. Usar arquivo menor (< 200MB)
2. Verificar internet estável
3. Tentar novamente

#### Erro 3: "Conversão falhou"
**Causa:** FFmpeg não instalado ou arquivo corrompido
**Solução:**
1. Verificar se FFmpeg está instalado:
   ```powershell
   ffmpeg -version
   ```
2. Se não, instalar FFmpeg:
   - Download: https://ffmpeg.org/download.html
   - Ou via Chocolatey: `choco install ffmpeg`
3. Reiniciar backend após instalar

#### Erro 4: "Cloudflare Stream error"
**Causa:** Token sem permissão para Stream
**Solução:**
1. Voltar ao dashboard Cloudflare
2. Verificar se Stream está habilitado na sua conta
3. Recriar token com permissões corretas

---

### ✅ Checklist de Sucesso

**Upload funcionou se:**
- [ ] ✅ Arquivo foi selecionado
- [ ] ✅ Informações aparecem corretas
- [ ] ✅ Progress bar chegou a 100%
- [ ] ✅ Conversão completou
- [ ] ✅ Mensagem de sucesso apareceu
- [ ] ✅ Logs backend sem erros críticos

---

## 🎨 PASSO 3: TESTAR PRO COLOR GRADING STUDIO

### O que é?
Sistema completo de color grading com:
- Timeline com múltiplos takes
- Correções de cor primárias
- Sistema de LUTs inteligente
- Markers colaborativos
- Preview em tempo real

### Como Testar

#### 3.1) Acessar ProStudio
1. Ir para: http://localhost:5173/pro-studio
2. Deve aparecer tela "Bem-vindo ao Color Grading Studio Pro"

#### 3.2) Criar Projeto
3. Clicar **"Criar Novo Projeto"**
4. Preencher:
   - Nome: "Teste Color Studio"
   - Formato: **"SDR (Rec.709)"** (mais simples para começar)
5. Clicar **"Criar Projeto"**

#### 3.3) Timeline (Sem Upload por Enquanto)
6. Deve aparecer timeline vazia
7. **⚠️ Nota:** Por enquanto não tem botão "Upload Take"
   - Isso é uma feature que falta implementar
   - Por ora, timeline fica vazia até adicionarmos takes via código

#### 3.4) Testar Controles (Se tiver take)
Se conseguir adicionar um take (veremos depois):
- **Timeline:**
  - [ ] Drag & drop de takes funciona?
  - [ ] Player de vídeo carrega?
  - [ ] Controles (play/pause) funcionam?

- **Correção de Cor:**
  - [ ] Sliders de exposição funcionam?
  - [ ] Temperatura/Tint mudam preview?
  - [ ] Botão "Salvar" funciona?

- **LUTs:**
  - [ ] Sistema detecta color space?
  - [ ] Recomenda LUT de conversão?
  - [ ] LUTs criativos aparecem?

- **Markers:**
  - [ ] Consegue adicionar marker?
  - [ ] Thread de respostas funciona?
  - [ ] Filtros funcionam?

---

### 🎯 O Que Validar Agora

**PRIORIDADE MÁXIMA:**
1. ✅ Upload MP4 funciona
2. ✅ Conversão FFmpeg completa
3. ✅ Vídeo aparece no Cloudflare Stream

**SECUNDÁRIO (se tempo):**
4. ProStudio carrega sem erro
5. Timeline aparece (mesmo vazia)
6. Controles de cor funcionam (se tiver take mock)

**DEIXAR PARA DEPOIS:**
- Popular biblioteca de LUTs
- Implementar UI de upload no ProStudio
- Supabase realtime
- Markers complexos

---

## 📊 RESULTADO ESPERADO

### Sucesso Completo 🎉
```
✅ Tokens Cloudflare configurados
✅ Backend reiniciado com tokens
✅ Upload MP4 funcionou
✅ Conversão FFmpeg completou
✅ Vídeo no Cloudflare Stream
✅ ProStudio abre sem erro
```

**Se conseguir isso, MISSÃO COMPLETA!** 🚀

### Próximos Passos (depois)
- Implementar botão "Upload Take" no ProStudio
- Popular biblioteca de LUTs
- Adicionar conteúdo do Portfolio
- Melhorar About/Services
- Deploy em produção

---

## 🚨 PROBLEMAS COMUNS

### 1. Backend não reinicia
**Solução:** Parar processo Python manualmente
```powershell
Get-Process python | Stop-Process -Force
```
Depois rodar backend novamente

### 2. FFmpeg não encontrado
**Solução:** Instalar FFmpeg
```powershell
# Via Chocolatey
choco install ffmpeg

# Ou baixar manual
# https://ffmpeg.org/download.html
```

### 3. R2 bucket não existe
**Solução:** Criar bucket no dashboard
1. Cloudflare → R2
2. Create bucket
3. Nome: "color-studio-raw-files"

### 4. Upload muito lento
**Causa:** Arquivo grande ou internet lenta
**Solução:** Usar arquivo < 100MB

### 5. CORS error no navegador
**Causa:** Backend não está permitindo frontend
**Solução:** Já configurado, mas verificar logs

---

## 📞 COMUNICAÇÃO COMIGO

**Me avise quando:**
1. ✅ Conseguir os 3 tokens → "Tokens obtidos!"
2. ✅ Configurar .env → "Env configurado!"
3. ✅ Testar upload → "Upload [sucesso/falha]"
4. ❌ Qualquer erro → Copie mensagem completa

**Formato ideal para erro:**
```
Erro: [copiar mensagem]
Quando: [o que estava fazendo]
Logs backend: [últimas 10 linhas]
Console navegador: [F12 → erros]
```

---

## 🎯 FOCO AGORA

**Sua missão:**
1. Obter tokens Cloudflare (30 min)
2. Configurar .env backend (5 min)
3. Reiniciar backend (1 min)
4. Testar upload MP4 (20 min)

**Total:** ~1 hora de trabalho

**Quando terminar qualquer etapa, me avise!**

**Pronto para começar com os tokens?** 🚀
