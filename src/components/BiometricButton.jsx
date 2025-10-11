cat > src/components/BiometricButton.jsx <<'JSX'
import React from 'react';
import { verifyBiometric } from '@/services/biometric';
import { Capacitor } from '@capacitor/core';

export default function BiometricButton() {
  const onClick = async () => {
    // Avvia SEMPRE su gesto utente (qui siamo su onClick)
    const platform = Capacitor.getPlatform();
    if (platform !== 'android' && platform !== 'ios') {
      alert('L’impronta funziona solo su APK installato. In web useremo il simulatore.');
    }
    try {
      const { verified } = await verifyBiometric({
        title: 'Sblocca Walleet',
        subtitle: 'Conferma la tua identità',
        description: 'Autenticazione biometrica',
        allowDeviceCredential: true, // PIN/Pattern fallback su Android
      });
      if (verified) {
        alert('✅ Autenticazione riuscita!');
        // TODO: sblocca qui l’area protetta
      }
    } catch (e) {
      alert('❌ Autenticazione fallita: ' + (e?.message || e));
    }
  };

  return (
    <button onClick={onClick} style={{padding:'10px 16px', borderRadius:8}}>
      🔓 Sblocca con impronta
    </button>
  );
}
JSX
