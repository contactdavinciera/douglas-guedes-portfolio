import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';

console.log('🎼 MAESTRO - Step 1: main.jsx loading...');

// Import CSS
console.log('🎼 MAESTRO - Importing CSS...');
import './index.css'
import './styles/premium-design.css'
console.log('✅ CSS imported');

console.log('🎼 MAESTRO - Step 2: Importing App...');
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log('🎼 MAESTRO - Step 3: Creating root...');

const rootElement = document.getElementById('root');
console.log('🎼 MAESTRO - Root element:', rootElement);

if (!rootElement) {
  console.error('❌ FATAL: Root element not found!');
  document.body.innerHTML = '<div style="color: red; padding: 50px; font-size: 24px;">❌ ERROR: Root element not found!</div>';
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('✅ MAESTRO - Render complete!');
  } catch (error) {
    console.error('❌ FATAL ERROR during render:', error);
    document.body.innerHTML = `<div style="color: red; padding: 50px;"><h1>❌ RENDER ERROR</h1><pre>${error.toString()}</pre></div>`;
  }
}

