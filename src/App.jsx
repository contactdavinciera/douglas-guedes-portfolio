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
import './App.css'

console.log('App.jsx loaded - Version 2.2'); // Para verificar o deploy

function App() {
  return (

      <div className="min-h-screen bg-black text-white">
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

  )
}

export default App



// Trigger new deploy for frontend
// Forcing a new deploy
// Another attempt to force deploy
