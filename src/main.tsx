import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/Layout/ErrorBoundary.tsx'
import './index.css'

console.log('%c [SIMVEX] 🚀 APP STARTED - v0.4.1 (Y-Axis Fixed)', 'background: #000; color: #bada55; font-size: 20px; font-weight: bold;');
console.log('%c [SIMVEX] If you do not see this, clear browser cache!', 'background: #000; color: #ff0000; font-size: 16px;');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
