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
  const [isNative, setIsNative] = useState(false);
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [debug, setDebug] = useState<string>('');

  useEffect(() => {
    const p = Capacitor.getPlatform();
    setIsNative(p === 'android' || p === 'ios');
  }, []);

  const probe = useCallback(async () => {
    setMessage('');
    setDebug(d => d + '\n[probe] start');
    if (!isNative) {
      setAvailable(false);
      setMessage('Biometria non supportata su web.');
      setDebug(d => d + '\n[probe] not native');
      return;
    }
    try {
      const res: any = await NativeBiometric.isAvailable();
      const ok = !!res?.isAvailable;
      setAvailable(ok);
      setBiometryType(res?.biometryType ?? null);
      setDebug(d => d + `\n[probe] isAvailable=${ok} type=${res?.biometryType ?? 'null'}`);
      if (!ok) {
        setMessage('Biometria non configurata. Puoi usare il PIN come fallback o aprire Impostazioni.');
      }
    } catch (err: any) {
      setAvailable(false);
      setMessage(`Impossibile verificare la biometria: ${err?.message || String(err)}`);
      setDebug(d => d + `\n[probe] error=${err?.message || String(err)}`);
    }
  }, [isNative]);

  const doAuth = useCallback(async () => {
    if (!isNative) return;
    setMessage('');
    setBusy(true);
    setDebug(d => d + '\n[auth] start');

    try {
      // Tentativo 1: prompt con biometria se presente + PIN come fallback
      await (NativeBiometric as any).verifyIdentity({
        reason: 'Autentica per sbloccare Walleet',
        title: 'Autenticazione',
        subtitle: 'Conferma identità',
        description: 'Usa impronta/volto o PIN',
        useFallback: true, // fallback generico
        android: {
          // forza esplicitamente il device credential (PIN/Pattern/Password)
          deviceCredentialAllowed: true,
          confirmationRequired: true,
        },
      });
      setBusy(false);
      setMessage('Autenticazione riuscita ✅');
      setDebug(d => d + '\n[auth] success');
      onAuthenticated?.();
      return;
    } catch (err: any) {
      const code = (err?.code || err?.message || 'unknown') + '';
      setDebug(d => d + `\n[auth] fail=${code}`);
      // Tentativo 2: se dice notEnrolled/notAvailable, prova ad aprire le impostazioni di sicurezza
      const s = code.toLowerCase();
      let human = 'Autenticazione annullata o non riuscita.';
      if (s.includes('notenrolled')) human = 'Nessuna impronta/volto registrati: puoi usare il PIN o configurare la biometria.';
      if (s.includes('notavailable') || s.includes('nohardware')) human = 'Biometria non disponibile su questo dispositivo.';
      if (s.includes('lockout')) human = 'Troppi tentativi: attendi e riprova.';
      setMessage(`${human} (${code})`);

      // Se il device ha solo PIN attivo, alcuni device mostrano direttamente la schermata lock.
      // Offriamo anche un link per aprire le impostazioni di sicurezza.
      try {
        (NativeBiometric as any).openSettings?.();
      } catch {}
    } finally {
      setBusy(false);
    }
  }, [isNative, onAuthenticated]);

  useEffect(() => { probe(); }, [probe]);

  useEffect(() => {
    if (auto && isNative) doAuth();
  }, [auto, isNative, doAuth]);

  const text = label || (biometryType ? `Sblocca (${biometryType})` : 'Sblocca con biometria/PIN');
  // Non disabilitiamo quando available=false: lasciamo usare PIN fallback
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

      {/* Pulsantino per aprire le impostazioni di sicurezza se non c'è biometria */}
      {!available && isNative && (
        <button
          type="button"
          onClick={() => (NativeBiometric as any).openSettings?.()}
          style={{ justifySelf: 'start', padding: '6px 10px', borderRadius: 8, border: '1px dashed #aaa', background: '#fafafa' }}
        >
          Apri Impostazioni di sicurezza
        </button>
      )}

      {/* Debug visibile (temporaneo) */}
      <pre style={{ fontSize: 10, color: '#888', whiteSpace: 'pre-wrap', margin: 0 }}>{debug.trim()}</pre>
    </div>
  );
}
