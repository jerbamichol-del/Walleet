// /data/data/com.termux/files/home/Walleet/components/BiometricButton.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

type Props = {
  onAuthenticated?: () => void;
  auto?: boolean;
  className?: string;
  label?: string;
};

export default function BiometricButton({ onAuthenticated, auto = false, className, label }: Props) {
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const platform = Capacitor.getPlatform();
  const isNative = platform === 'android' || platform === 'ios';

  const probe = useCallback(async () => {
    setMessage('');
    if (!isNative) {
      setAvailable(false);
      setMessage('Biometria non supportata su web.');
      return;
    }
    try {
      const res = await NativeBiometric.isAvailable();
      const ok = !!(res as any)?.isAvailable;
      setAvailable(ok);
      setBiometryType((res as any)?.biometryType ?? null);
      if (!ok) {
        // Importante: anche se non ci sono impronte, permettiamo il click per usare il fallback PIN
        setMessage('Nessuna impronta/volto configurati. Userò il PIN come fallback.');
      }
    } catch (err: any) {
      setAvailable(false);
      setMessage(`Impossibile verificare la biometria: ${err?.message || String(err)}`);
    }
  }, [isNative]);

  const doAuth = useCallback(async () => {
    setMessage('');
    setBusy(true);
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Autentica per sbloccare Walleet',
        title: 'Autenticazione',
        subtitle: 'Conferma identità',
        description: 'Usa impronta/volto o PIN',
        // 👉 consenti PIN/password come fallback quando non ci sono biometrie
        useFallback: true,
      } as any);
      setBusy(false);
      setMessage('Autenticazione riuscita ✅');
      onAuthenticated?.();
    } catch (err: any) {
      setBusy(false);
      const code = (err?.code || err?.message || 'unknown') + '';
      let human = 'Autenticazione annullata o non riuscita.';
      const s = code.toLowerCase();
      if (s.includes('notenrolled')) human = 'Nessuna impronta/volto registrati: resta il PIN come fallback.';
      if (s.includes('notavailable') || s.includes('nohardware')) human = 'Biometria non disponibile su questo dispositivo.';
      if (s.includes('lockout')) human = 'Troppi tentativi: attendi e riprova.';
      setMessage(`${human} (${code})`);
    }
  }, [onAuthenticated]);

  useEffect(() => { probe(); }, [probe]);

  useEffect(() => {
    if (auto && isNative) doAuth();
  }, [auto, isNative, doAuth]);

  const text = label || (biometryType ? `Sblocca (${biometryType})` : 'Sblocca con biometria/PIN');
  // ❗ Non disabilitare più il bottone quando available=false: lasciamo usare il PIN fallback
  const disabled = !isNative || busy;

  return (
    <div className={className} style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        onClick={doAuth}
        disabled={disabled}
        style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #ccc', fontWeight: 600, opacity: disabled ? 0.6 : 1 }}
      >
        {busy ? 'Verifico…' : text}
      </button>
      {message ? <small style={{ color: '#555' }}>{message}</small> : null}
    </div>
  );
}
