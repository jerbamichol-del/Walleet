import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Forza gli shim "Legacy" (voce + biometria) su tutte le build
localStorage.voiceShimEnabled = '1';
localStorage.biometricShimEnabled = '1';

createRoot(document.getElementById('root')).render(<App />);
