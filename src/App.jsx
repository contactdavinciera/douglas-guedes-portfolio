import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import ColorStudio from './pages/ColorStudio'
import ClientDashboard from './pages/ClientDashboard'
import ColoristDashboardPage from './pages/ColoristDashboard'
import BatchPricingCalculatorPage from './pages/BatchPricingCalculatorPage'
import ProColorGradingStudio from './pages/ProColorGradingStudio'
// import './App.css' // ⚠️ Desabilitado - usando apenas index.css para evitar conflitos

console.log('App.jsx loaded - Version 2.4 - Fixed CSS Loading'); // Para verificar o deploy

function App() {
  return (
    <Routes>
      {/* Pro Studio - Fullscreen (sem Header/Footer) */}
      <Route path="/pro-studio" element={<ProColorGradingStudio />} />
      
      {/* Rotas normais do site (com Header/Footer) */}
      <Route path="*" element={
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#000000',
          color: '#ffffff'
        }}>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/color-studio" element={<ColorStudio />} />
              <Route path="/color-studio/:mediaFileId" element={<ColorStudio />} />
              <Route path="/dashboard" element={<ClientDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  )
}

export default App



// Trigger new deploy for frontend
// Forcing a new deploy
// Another attempt to force deploy
