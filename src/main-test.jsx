import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('🔥 TEST - Starting minimal React app...');

const TestApp = () => {
  console.log('✅ TEST - TestApp rendering!');
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ REACT WORKS!</h1>
        <p style={{ fontSize: '24px', marginBottom: '10px' }}>Se você vê isso, React está funcionando!</p>
        <p style={{ fontSize: '18px', color: '#ffd700' }}>Agora vamos descobrir o problema...</p>
        <div style={{ marginTop: '30px', fontSize: '14px', opacity: 0.8 }}>
          <p>✓ Vite: OK</p>
          <p>✓ React: OK</p>
          <p>✓ Render: OK</p>
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  console.log('✅ TEST - Root element found!');
  createRoot(root).render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
  console.log('✅ TEST - Render complete!');
} else {
  console.error('❌ TEST - Root element NOT found!');
}
