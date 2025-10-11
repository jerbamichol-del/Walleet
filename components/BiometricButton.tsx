// ~/Walleet/App.tsx
import React, { useState } from 'react';
import BiometricButton from './components/BiometricButton';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  return (
    <div style={{ padding: 16 }}>
      <h2>Walleet · Test Biometria</h2>

      {/* Bottone biometrico semplice */}
      <BiometricButton onAuthenticated={() => setStatus('ok')} />

      {/* Feedback a video */}
      {status === 'ok' && <p>✅ Autenticazione riuscita</p>}
      {status === 'idle' && <p>Premi “Sblocca con biometria”.</p>}
    </div>
  );
}
