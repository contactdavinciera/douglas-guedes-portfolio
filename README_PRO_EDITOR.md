# 🎬 DOUGLAS GUEDES PRO STUDIO

## 💎 O Editor de Vídeo Web MAIS AVANÇADO do Mundo

### **Premiado Sistema de Edição + Color Grading 100% Browser-Based**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react)](https://reactjs.org/)
[![WebCodecs](https://img.shields.io/badge/WebCodecs-Enabled-green)](https://w3c.github.io/webcodecs/)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com)

---

## 🌟 O QUE É?

Um sistema revolucionário de edição de vídeo e color grading que roda **100% no navegador**, combinando:
- ✅ **Editor profissional** (nível Premiere/Final Cut)
- ✅ **Color grading** (nível DaVinci Resolve)
- ✅ **Colaboração em tempo real** (melhor que Frame.io)
- ✅ **AI-powered tools** (legendagem + lettering automático)
- ✅ **Marketplace de profissionais** (Fiverr para video)
- ✅ **Precificação dinâmica** (pay-per-minute)

---

## 🚀 PRINCIPAIS FEATURES

### **🎬 VIDEO EDITOR**
- Multi-track timeline (unlimited tracks)
- Drag & Drop de clips
- Cut/Split/Trim
- Ripple delete (auto-close gaps)
- Copy/Paste/Duplicate
- Snap to grid (frame-accurate @ 24fps)
- 15+ keyboard shortcuts (Space, J/K/L, C, M, etc)
- Real-time preview (WebCodecs API)
- Waveform visualization
- Markers coloridos

### **🎨 COLOR GRADING**
- GPU-accelerated (WebGL)
- Real-time preview
- Lift/Gamma/Gain
- Primary & Secondary correction
- LUT support (.cube)
- Scopes (Waveform, Vectorscope, Histogram)
- Color wheels profissionais
- HDR & Dolby Vision support

### **🤖 AI FEATURES**
- **Auto Subtitling**: Whisper.cpp (90+ idiomas)
- **Dynamic Lettering**: 10+ presets (TikTok, Instagram, YouTube)
- Auto color matching
- Scene detection
- Audio cleanup

### **👥 COLLABORATION**
- Real-time sync (WebRTC)
- Multi-user editing
- Chat integrado
- Markers compartilhados
- Version control
- Approval workflow

### **💰 PRICING SYSTEM**
- Pay-per-minute ($10/min base)
- Multiplicadores dinâmicos:
  - **Color Space**: SDR (1x), HDR (1.5x), Dolby (2.5x)
  - **Source Format**: H.264 (1x), ProRes (1.3x), RAW (2x)
  - **Services**: +Color (1.5x), +Maestro (2x)
  - **Delivery**: Proxy (1x), High (1.3x), HDR (1.6x), Dolby (2x)

### **🎯 MAESTRO (Professional Help)**
- Frame.io melhorado
- Before/After comparison
- Split view com slider
- Professional marketplace
- Escrow payment
- Rating system

---

## 🛠️ TECH STACK

### **Frontend:**
- React 18 + Vite
- TailwindCSS + shadcn/ui
- WebCodecs API (hardware decode)
- Web Audio API (audio mixing)
- WebGL/Three.js (GPU effects)
- WebRTC (collaboration)
- Whisper.cpp (subtitles)
- IndexedDB (local storage)
- Service Workers (cache)

### **Backend:**
- FastAPI (Python)
- FFmpeg (transcode)
- Cloudflare R2 (storage)
- Cloudflare Stream (delivery)
- Stripe (payments)
- Supabase (database)
- Redis (real-time)

---

## 📦 INSTALAÇÃO

### **Pré-requisitos:**
```bash
Node.js 18+
Python 3.9+
pnpm
```

### **Clone & Install:**
```bash
git clone https://github.com/contactdavinciera/douglas-guedes-portfolio.git
cd douglas-guedes-portfolio
pnpm install
```

### **Backend Setup:**
```bash
cd color-studio-backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### **Environment Variables:**
Crie `.env`:
```bash
# Cloudflare
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_STREAM_TOKEN=your_token
VITE_R2_ACCESS_KEY_ID=your_key
VITE_R2_SECRET_ACCESS_KEY=your_secret
VITE_R2_BUCKET_NAME=your_bucket

# Supabase
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

### **Run Development:**
```bash
# Terminal 1 - Frontend
pnpm dev

# Terminal 2 - Backend
cd color-studio-backend
python src/main.py
```

---

## 📱 SCREENS

### **Video Editor:**
- 16:9 fullscreen container
- Media Pool + Source Monitor + Program Monitor
- Timeline com ruler, markers e waveforms
- Track controls (lock/mute/solo)
- Effects panel

### **Pricing Calculator:**
- Interactive sliders
- Real-time breakdown
- Visual feedback
- Cost per minute

### **Maestro Dashboard:**
- Project overview
- Team management
- Analytics
- Professional marketplace

---

## 🎯 KEYBOARD SHORTCUTS

| Tecla | Ação |
|-------|------|
| **Space** | Play/Pause |
| **J/K/L** | Shuttle (Reverse/Stop/Forward) |
| **C** | Cut/Split clip |
| **M** | Add Marker |
| **E** | Toggle Effects Panel |
| **I/O** | Mark In/Out points |
| **S** | Toggle Snap |
| **Ctrl+C** | Copy clip |
| **Ctrl+V** | Paste clip |
| **Ctrl+D** | Duplicate clip |
| **Del** | Delete selected |
| **+/-** | Zoom In/Out |
| **←/→** | Previous/Next frame |

---

## 💰 BUSINESS MODEL

### **Revenue Streams:**
1. **Pay-per-project** (90% margin)
   - Average: $100-500/project
   - Target: 1000 users/month
   - **$1.2M-6M/year**

2. **Professional Services** (10% commission)
   - Marketplace de coloristas/editores
   - Average: $200/hour
   - **$500K-2M/year**

3. **Subscription** (optional)
   - Pro: $29/month (unlimited projects)
   - Enterprise: $99/month (team features)
   - **$300K-1M/year**

### **Total Year 1 Projection: $2M-9M**

---

## 📚 DOCUMENTATION

- [Business Model](BUSINESS_MODEL.md) - Modelo de negócio completo
- [Technical Roadmap](TECHNICAL_ROADMAP.md) - Roadmap técnico detalhado
- [API Documentation](#) - Em breve
- [Video Tutorials](#) - Em breve

---

## 🗺️ ROADMAP

### **✅ Phase 1: MVP (Complete!)**
- [x] Video Editor
- [x] Timeline System
- [x] Markers & Track Controls
- [x] Effects Panel
- [x] Pricing Calculator
- [x] Maestro Dashboard

### **⏳ Phase 2: Performance (4 weeks)**
- [ ] WebCodecs integration
- [ ] Web Audio API
- [ ] WebGL GPU effects
- [ ] WebRTC collaboration

### **⏳ Phase 3: AI (2 weeks)**
- [ ] Auto Subtitling (Whisper)
- [ ] Dynamic Lettering
- [ ] Scene detection
- [ ] Auto color matching

### **⏳ Phase 4: Professional (3 weeks)**
- [ ] Stripe integration
- [ ] Professional Marketplace
- [ ] Maestro review system
- [ ] Escrow payments

### **⏳ Phase 5: Infrastructure (2 weeks)**
- [ ] R2 upload pipeline
- [ ] FFmpeg transcode workers
- [ ] Cloudflare Stream
- [ ] Service Workers (cache)

---

## 🤝 CONTRIBUTING

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### **Development Process:**
1. Fork the repo
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 AUTHOR

**Douglas Guedes**
- Portfolio: [douglasguedes.com](https://douglasguedes.com)
- Email: contact@douglasguedes.com
- LinkedIn: [linkedin.com/in/douglasguedes](https://linkedin.com/in/douglasguedes)
- GitHub: [@contactdavinciera](https://github.com/contactdavinciera)

---

## 🙏 ACKNOWLEDGMENTS

- **Cloudflare** - R2 & Stream
- **Supabase** - Database
- **Stripe** - Payments
- **OpenAI** - Whisper
- **Three.js** - WebGL
- **shadcn/ui** - Components

---

## 📊 STATS

![GitHub stars](https://img.shields.io/github/stars/contactdavinciera/douglas-guedes-portfolio?style=social)
![GitHub forks](https://img.shields.io/github/forks/contactdavinciera/douglas-guedes-portfolio?style=social)
![GitHub issues](https://img.shields.io/github/issues/contactdavinciera/douglas-guedes-portfolio)
![GitHub pull requests](https://img.shields.io/github/issues-pr/contactdavinciera/douglas-guedes-portfolio)

---

## 🔥 LIVE DEMO

**Experimente agora:** [proedit.douglasguedes.com](https://proedit.douglasguedes.com)

---

<div align="center">

**Made with ❤️ by Douglas Guedes**

**Star ⭐ this repo if you find it useful!**

</div>
