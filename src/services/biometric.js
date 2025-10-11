import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

// Shim semplice: conferma via dialog
async function webBiometricShim() {
  const ok = window.confirm('Simula sblocco biometrico?');
  if (!ok) throw new Error('Utente ha annullato (shim)');
  return { verified: true };
}

export async function verifyBiometric({
  title = 'Sblocca con impronta',
  subtitle = 'Conferma la tua identità',
  description = 'Autenticazione biometrica',
  allowDeviceCredential = true,
} = {}) {
  const preferShim = localStorage.getItem('biometricShimEnabled') === '1';
  const isAndroid = Capacitor.getPlatform() === 'android';

  if (preferShim) return webBiometricShim();

  if (isAndroid) {
    try {
      const { isAvailable, biometryType } = await NativeBiometric.isAvailable();
      if (!isAvailable) throw new Error('Biometria non disponibile');
      const res = await NativeBiometric.verifyIdentity({
        reason: description,
        title, subtitle, description,
        useFallback: allowDeviceCredential,
        allowDeviceCredential,
      });
      if (!res?.verified) throw new Error('Verifica fallita');
      return { verified: true, biometryType };
    } catch (e) {
      console.warn('[biometric] nativo fallito, fallback shim:', e);
      return webBiometricShim();
    }
  }

  return webBiometricShim();
}
