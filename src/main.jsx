import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// voce nativa (0), impronta shim (1)
localStorage.voiceShimEnabled = '0';
localStorage.biometricShimEnabled = '1';

createRoot(document.getElementById('root')).render(<App />);
