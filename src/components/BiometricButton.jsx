import React from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export default function BiometricButton() {
  const testBiometric = async () => {
    const platform = Capacitor.getPlatform();
    if (platform !== 'android' && platform !== 'ios') {
      alert('L’impronta funziona solo sull’APK installato (non in preview web).');
      return;
    }

    try {
      const { isAvailable } = await NativeBiometric.isAvailable();
      if (!isAvailable) {
        alert('Biometria non disponibile o non configurata.\nRegistra un’impronta/volto nelle impostazioni di sistema.');
        return;
      }

      await NativeBiometric.verifyIdentity({ reason: 'Sblocca Walleet' });
      alert('✅ Autenticazione riuscita!');
    } catch (e) {
      alert('❌ Autenticazione fallita: ' + (e?.message || e));
    }
  };

  return (
    <button onClick={testBiometric} style={{padding:'10px 16px', borderRadius:10}}>
      🔓 Sblocca con impronta
    </button>
  );
}
