import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Disattiva eventuali Service Worker (debug Android/PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => {});
}

const el = document.getElementById('root');
if (!el) {
  console.error('Root element #root non trovato');
}
createRoot(el).render(<App />);
