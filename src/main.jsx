import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// 0 = nativo; 1 = shim
localStorage.voiceShimEnabled = '0';
localStorage.biometricShimEnabled = '0';

createRoot(document.getElementById('root')).render(<App />);
