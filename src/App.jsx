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
import Maestro from './pages/Maestro'
import VideoEditor from './pages/VideoEditor'
import VideoEditorTest from './pages/VideoEditorTest'
import PricingCalculator from './pages/PricingCalculator'
import Marketplace from './pages/Marketplace'
import './App.css'

console.log('🎼 MAESTRO - App.jsx loaded - Version 2.4');

function App() {
  console.log('🎼 MAESTRO - App component rendering...');
  
  return (
      <div className="min-h-screen bg-black text-white" style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
        <Header />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/color-studio" element={<ColorStudio />} />
            <Route path="/color-studio/:mediaFileId" element={<ColorStudio />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/pro-studio" element={<ProColorGradingStudio />} />
            <Route path="/video-editor-test" element={<VideoEditorTest />} />
            <Route path="/video-editor" element={<VideoEditor />} />
            <Route path="/pricing" element={<PricingCalculator />} />
            <Route path="/maestro" element={<Maestro />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </main>
        <Footer />
      </div>

  )
}

export default App



// Trigger new deploy for frontend
// Forcing a new deploy
// Another attempt to force deploy
