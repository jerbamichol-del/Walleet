import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

console.log('[BOOT] main.jsx caricato');
const el = document.getElementById('root');
if (!el) {
  // se manca il root, mostra overlay errore
  const evt = new Error('Elemento #root non trovato');
  window.dispatchEvent(new ErrorEvent('error', { message: evt.message, filename: 'main.jsx' }));
} else {
  createRoot(el).render(<App />);
}
