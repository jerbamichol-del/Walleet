import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

function Tag({ ok, label }) {
  const bg = ok === true ? '#16a34a22' : ok === false ? '#dc262622' : '#52525b22';
  const fg = ok === true ? '#16a34a' : ok === false ? '#dc2626' : '#52525b';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 999, background: bg, color: fg, fontSize: 12, marginLeft: 8 }}>
      {label}
    </span>
  );
}

export default function Diagnostics() {
  const [platform, setPlatform] = useState('');
  const [availSpeechPlugin, setAvailSpeechPlugin] = useState(null);
  const [availBioPlugin, setAvailBioPlugin] = useState(null);

  const [speechAvail, setSpeechAvail] = useState(null);
  const [speechPerm, setSpeechPerm] = useState(null);
  const [speechLast, setSpeechLast] = useState('');
  const [bioAvail, setBioAvail] = useState(null);
  const [bioType, setBioType] = useState('');
  const [langs, setLangs] = useState([]);
  const [status, setStatus] = useState([]);

  const listenerRefs = useRef({ partial: null, result: null, error: null });
  const startWatchdog = useRef(null);

  const log = (msg) => setStatus((s) => [String(msg), ...s].slice(0, 120));

  const getMicGranted = (obj) => {
    // Il plugin può restituire: { speechRecognition:"granted" } oppure { status/microphone/state:"granted" }
    const v = obj || {};
    const st = v.speechRecognition || v.microphone || v.status || v.state;
    return st === 'granted';
  };

  const refreshMicPerm = async () => {
    try {
      if (!Capacitor.isPluginAvailable('SpeechRecognition')) {
        setSpeechPerm(false);
        return;
      }
      if (typeof SpeechRecognition.checkPermissions === 'function') {
        const res = await SpeechRecognition.checkPermissions();
        setSpeechPerm(getMicGranted(res));
        log('Speech.checkPermissions: ' + JSON.stringify(res));
      } else if (typeof SpeechRecognition.hasPermission === 'function') {
        const res = await SpeechRecognition.hasPermission();
        setSpeechPerm(!!res?.permission);
        log('Speech.hasPermission(legacy): ' + JSON.stringify(res));
      } else {
        setSpeechPerm(null);
        log('Nessuna API permessi disponibile su SpeechRecognition');
      }
    } catch (e) {
      setSpeechPerm(false);
      log('refreshMicPerm ERR: ' + (e?.message || e));
    }
  };

  useEffect(() => {
    const pf = Capacitor.getPlatform();
    setPlatform(pf);

    let speechOK = false;
    let bioOK = false;
    try { speechOK = Capacitor.isPluginAvailable('SpeechRecognition'); } catch (e) { log('isPluginAvailable(SpeechRecognition) ERR: ' + (e?.message || e)); }
    try { bioOK   = Capacitor.isPluginAvailable('NativeBiometric'); }   catch (e) { log('isPluginAvailable(NativeBiometric) ERR: ' + (e?.message || e)); }

    setAvailSpeechPlugin(!!speechOK);
    setAvailBioPlugin(!!bioOK);

    (async () => {
      if (speechOK) {
        try { const a = await SpeechRecognition.available(); setSpeechAvail(a?.available ?? null); log('Speech.available: ' + JSON.stringify(a)); }
        catch (e) { setSpeechAvail(false); log('Speech.available ERR: ' + (e?.message || e)); }
        await refreshMicPerm();
        try { const L = await SpeechRecognition.getSupportedLanguages?.(); if (L) { setLangs(L); log('Speech.getSupportedLanguages: '+JSON.stringify(L).slice(0,200)+'...'); } } catch(e) { log('getSupportedLanguages ERR: '+(e?.message||e)); }
      } else {
        log('Plugin SpeechRecognition NON disponibile per Capacitor');
      }

      if (bioOK) {
        try { const { isAvailable, biometryType } = await NativeBiometric.isAvailable(); setBioAvail(!!isAvailable); setBioType(biometryType || ''); log('Biometric.isAvailable: ' + JSON.stringify({ isAvailable, biometryType })); }
        catch (e) { setBioAvail(false); log('Biometric.isAvailable ERR: ' + (e?.message || e)); }
      } else {
        log('Plugin NativeBiometric NON disponibile per Capacitor');
      }
    })();

    // pulizia listeners on unmount
    return () => {
      try { SpeechRecognition.removeAllListeners(); } catch {}
      if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; }
    };
  }, []);

  const reqSpeechPerm = async () => {
    try {
      if (typeof SpeechRecognition.requestPermissions === 'function') {
        const r = await SpeechRecognition.requestPermissions();
        log('Speech.requestPermissions: ' + JSON.stringify(r));
        const c = await SpeechRecognition.checkPermissions?.();
        if (c) {
          setSpeechPerm(getMicGranted(c));
          log('Speech.checkPermissions (post-request): ' + JSON.stringify(c));
        } else {
          setSpeechPerm(getMicGranted(r));
        }
      } else if (typeof SpeechRecognition.requestPermission === 'function') {
        const r = await SpeechRecognition.requestPermission();
        setSpeechPerm(!!r?.permission);
        log('Speech.requestPermission(legacy): ' + JSON.stringify(r));
      } else {
        log('API richiesta permessi non disponibile su SpeechRecognition');
        alert('Richiesta permessi non disponibile su questo plugin/build.');
      }
    } catch (e) {
      log('reqSpeechPerm ERR: ' + (e?.message || e));
      alert('Permesso microfono: ' + (e?.message || e));
    }
  };

  const attachListenersIfNeeded = () => {
    try {
      if (!listenerRefs.current.partial) {
        listenerRefs.current.partial = SpeechRecognition.addListener('partialResults', (r) => {
          console.log('[speech] partial', r);
          setSpeechLast(r?.matches?.[0] || '');
        });
      }
      if (!listenerRefs.current.result) {
        listenerRefs.current.result = SpeechRecognition.addListener('result', (r) => {
          console.log('[speech] result', r);
          setSpeechLast(r?.matches?.[0] || '');
        });
      }
      if (!listenerRefs.current.error) {
        listenerRefs.current.error = SpeechRecognition.addListener('error', (e) => {
          console.error('[speech] error', e);
          log('Speech error: ' + JSON.stringify(e));
        });
      }
    } catch (e) {
      log('attachListenersIfNeeded ERR: ' + (e?.message || e));
    }
  };

  const startSpeech = async () => {
    try {
      // Permessi
      if (speechPerm !== true) {
        await reqSpeechPerm();
        const c = await SpeechRecognition.checkPermissions?.();
        if (c && !getMicGranted(c)) return;
      }

      // Listener PRIMA dello start
      attachListenersIfNeeded();

      // Watchdog: se non arrivano eventi entro 6s, avvisa
      if (startWatchdog.current) clearTimeout(startWatchdog.current);
      startWatchdog.current = setTimeout(() => {
        log('⚠️ Nessun evento dal riconoscimento entro 6s (prova popup:true, lingua, servizi Google).');
      }, 6000);

      await SpeechRecognition.start({
        language: 'it-IT',
        partialResults: true,
        popup: true,       // forziamo il popup nativo
        maxResults: 5,
      });
      log('Speech.start OK');
      console.log('[speech] start called');
    } catch (e) {
      log('Speech.start ERR: ' + (e?.message || e));
      alert('Speech ERR: ' + (e?.message || e));
    }
  };

  const stopSpeech = async () => {
    try {
      await SpeechRecognition.stop();
      console.log('[speech] stop called');
      log('Speech.stop OK');
      if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; }
      // NON rimuovo i listener subito: servono per ricevere l'ultimo "result"
    } catch (e) {
      log('Speech.stop ERR: ' + (e?.message || e));
    }
  };

  const testBiometric = async () => {
    try {
      // Considera successo se NON lancia eccezioni
      await NativeBiometric.verifyIdentity({
        reason: 'Sblocca Walleet',
        title: 'Sblocca Walleet',
        subtitle: 'Conferma la tua identità',
        description: 'Autenticazione biometrica',
        useFallback: true,
        allowDeviceCredential: true,
      });
      log('Biometric.verifyIdentity OK (nessuna eccezione)');
      alert('✅ Autenticazione riuscita');
    } catch (e) {
      log('Biometric.verifyIdentity ERR: ' + (e?.message || e));
      alert('❌ Biometria ERR: ' + (e?.message || e));
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Diagnostica Walleet</h2>

      <div>Piattaforma: <b>{platform}</b></div>
      <div>Capacitor.isPluginAvailable('SpeechRecognition'): <Tag ok={availSpeechPlugin} label={String(availSpeechPlugin)} /></div>
      <div>Capacitor.isPluginAvailable('NativeBiometric'): <Tag ok={availBioPlugin} label={String(availBioPlugin)} /></div>

      <h3 style={{ marginTop: 12 }}>Microfono / Speech</h3>
<div style={{fontSize:12,opacity:0.85,background:'#11182711',padding:8,borderRadius:8}}>
<b>Guida debug voce</b><br/>
1) Aggiorna <b>Google</b> e <b>Speech Services by Google</b> dal Play Store.<br/>
2) Imposta <b>Impostazioni → App → App predefinite → Inserimento vocale</b> su <b>Google</b> (non quello del produttore).<br/>
3) In <b>Impostazioni → App → Google → Permessi</b> consenti <b>Microfono</b>.<br/>
4) Riavvia l'app e riprova.
</div>
      <div>available(): <Tag ok={speechAvail} label={String(speechAvail)} /></div>
      <div>hasPermission(): <Tag ok={speechPerm} label={String(speechPerm)} /></div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={async()=>{ try{ const L=await SpeechRecognition.getSupportedLanguages?.(); if(L){ setLangs(L); log('Self-test: languages '+L.length); } }catch(e){ log('Self-test ERR: '+(e?.message||e)); } }}>Self-test lingue</button>
        <button onClick={reqSpeechPerm}>Concedi permesso microfono</button>
        <button onPointerDown={startSpeech} onPointerUp={stopSpeech}>🎙️ Premi e parla</button>
        <button onClick={startSpeech}>Avvia (tap)</button>
        <button onClick={stopSpeech}>Stop</button>
      </div>
      <div style={{ marginTop: 6 }}>Ultimo riconosciuto: <code>{speechLast}</code></div>
<div style={{ marginTop: 6, fontSize:12, opacity:0.85 }}>Lingue supportate (sample): <code>{(langs||[]).slice(0,6).join(', ')||'-'}</code></div>

      <h3 style={{ marginTop: 12 }}>Biometria</h3>
      <div>isAvailable(): <Tag ok={bioAvail} label={String(bioAvail)} /></div>
      <div>biometryType: <code>{bioType || '-'}</code></div>
      <div style={{ marginTop: 8 }}>
        <button onClick={testBiometric}>🔒 Prova autenticazione</button>
      </div>

      <h3 style={{ marginTop: 12 }}>Log</h3>
      <pre style={{ background: '#0b1020', color: '#cbd5e1', padding: 12, borderRadius: 8, maxHeight: 280, overflow: 'auto' }}>
{status.map((l) => `• ${l}\n`)}
      </pre>
    </div>
  );
}
