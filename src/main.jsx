import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// 0 = prova nativo; 1 = forza shim (web)
localStorage.voiceShimEnabled = '0';        // voce: nativo
localStorage.biometricShimEnabled = '0';    // impronta: nativo

createRoot(document.getElementById('root')).render(<App />);
