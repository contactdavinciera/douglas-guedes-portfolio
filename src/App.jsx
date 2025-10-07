import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import ColorStudio from './pages/ColorStudio'
import ClientDashboard from './pages/ClientDashboard'
import './App.css'

console.log('App.jsx loaded - Version 2.2'); // Para verificar o deploy

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main>
          <ColorStudio />
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

