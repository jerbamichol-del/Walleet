import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeech } from '@capacitor-community/speech-recognition';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

function Tag({ ok, label }) {
  const bg = ok === true ? '#16a34a22' : ok === false ? '#dc262622' : '#52525b22';
  const fg = ok === true ? '#16a34a' : ok === false ? '#dc2626' : '#52525b';
  return <span style={{ padding: '2px 8px', borderRadius: 999, background: bg, color: fg, fontSize: 12, marginLeft: 8 }}>{label}</span>;
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

  const [status, setStatus] = useState([]);
  const startWatchdog = useRef(null);
  const listenerRefs = useRef({ partial: null, result: null, error: null });

  const log = (msg) => setStatus((s) => [String(msg), ...s].slice(0, 180));

  // ==== WEB SPEECH (opzionale, solo se supportato dal WebView) ====
  let webRec = null;
  function startWebSpeech(){
    try{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR){ log('WebSpeech: API non disponibile su questo WebView'); return; }
      webRec = new SR();
      webRec.lang = 'it-IT';
      webRec.interimResults = true;
      webRec.continuous = false;
      webRec.onresult = (e)=>{ try{ const i=e.resultIndex; const txt=e.results[i][0].transcript; setSpeechLast(txt); }catch(_){} };
      webRec.onerror  = (e)=>{ log('WebSpeech error: '+JSON.stringify(e)); };
      webRec.onend    = ()=>{ log('WebSpeech end'); };
      webRec.start();
      log('WebSpeech start');
    }catch(e){ log('WebSpeech ERR: '+(e?.message||e)); }
  }
  function stopWebSpeech(){ try{ if(webRec){ webRec.stop(); webRec=null; log('WebSpeech stop'); } }catch(e){ log('WebSpeech stop ERR: '+(e?.message||e)); } }

  // ==== CAPACITOR – LISTENER & CONTROL ====
  const attachListenersIfNeeded = () => {
    try {
      if (!listenerRefs.current.result) {
        listenerRefs.current.result = CapSpeech.addListener('result', (r) => {
          setSpeechLast(r?.matches?.[0] || '');
          log('CapSpeech result: '+JSON.stringify(r?.matches||[]));
        });
      }
      if (!listenerRefs.current.partial) {
        listenerRefs.current.partial = CapSpeech.addListener('partialResults', (r) => {
          setSpeechLast(r?.matches?.[0] || '');
        });
      }
      if (!listenerRefs.current.error) {
        listenerRefs.current.error = CapSpeech.addListener('error', (e) => {
          log('CapSpeech error: ' + JSON.stringify(e));
        });
      }
    } catch (e) {
      log('attachListenersIfNeeded ERR: ' + (e?.message || e));
    }
  };

  const reqSpeechPerm = async () => {
    try {
      if (typeof CapSpeech.requestPermissions === 'function') {
        const r = await CapSpeech.requestPermissions();
        log('CapSpeech.requestPermissions: ' + JSON.stringify(r));
        const c = await CapSpeech.checkPermissions?.();
        if (c) { setSpeechPerm((c.speechRecognition||c.microphone||c.status)==='granted'); log('CapSpeech.checkPermissions (post): ' + JSON.stringify(c)); }
      } else if (typeof CapSpeech.requestPermission === 'function') {
        const r = await CapSpeech.requestPermission();
        setSpeechPerm(!!r?.permission);
        log('CapSpeech.requestPermission(legacy): ' + JSON.stringify(r));
      }
    } catch (e) { log('reqSpeechPerm ERR: '+(e?.message||e)); }
  };

  const startSpeechCap = async () => {
    try {
      attachListenersIfNeeded();
      if (startWatchdog.current) clearTimeout(startWatchdog.current);
      startWatchdog.current = setTimeout(() => log('⚠️ Nessun evento (Capacitor) entro 6s.'), 6000);
      await CapSpeech.start({
        language: 'it-IT',
        partialResults: false,
        popup: true,          // forza il pop-up Google
        maxResults: 5,
        continuous: false     // chiudi dopo una frase
      });
      log('CapSpeech.start OK');
    } catch (e) {
      log('CapSpeech.start ERR: ' + (e?.message || e));
    }
  };

  const stopSpeechCap = async () => {
    try { await CapSpeech.stop(); log('CapSpeech.stop OK'); if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; } }
    catch (e) { log('CapSpeech.stop ERR: ' + (e?.message || e)); }
  };

  // ==== BIOMETRIA ====
  const testBiometric = async () => {
    try {
      const { isAvailable, biometryType } = await NativeBiometric.isAvailable();
      if (!isAvailable) { alert('Biometria non disponibile sul dispositivo'); return; }
      await NativeBiometric.verifyIdentity({
        reason: 'Sblocca Walleet',
        title: 'Sblocca Walleet',
        subtitle: 'Conferma la tua identità',
        description: 'Autenticazione biometrica',
        useFallback: true,
        allowDeviceCredential: true,
      });
      log('Biometric.verifyIdentity OK');
      alert('✅ Autenticazione riuscita');
    } catch (e) {
      log('Biometric.verifyIdentity ERR: ' + (e?.message || e));
      alert('❌ Biometria ERR: ' + (e?.message || e));
    }
  };

  useEffect(() => {
    setPlatform(Capacitor.getPlatform());
    let speechOK=false, bioOK=false;
    try { speechOK = Capacitor.isPluginAvailable('SpeechRecognition'); } catch {}
    try { bioOK   = Capacitor.isPluginAvailable('NativeBiometric'); }   catch {}
    setAvailSpeechPlugin(!!speechOK);
    setAvailBioPlugin(!!bioOK);

    (async () => {
      if (speechOK) {
        try { const a = await CapSpeech.available(); setSpeechAvail(a?.available ?? null); log('CapSpeech.available: ' + JSON.stringify(a)); }
        catch (e) { setSpeechAvail(false); log('CapSpeech.available ERR: ' + (e?.message || e)); }
        try {
          if (typeof CapSpeech.checkPermissions==='function'){
            const p = await CapSpeech.checkPermissions(); setSpeechPerm((p.speechRecognition||p.microphone||p.status)==='granted'); log('CapSpeech.checkPermissions: '+JSON.stringify(p));
          } else if (typeof CapSpeech.hasPermission==='function'){
            const p = await CapSpeech.hasPermission(); setSpeechPerm(!!p?.permission); log('CapSpeech.hasPermission(legacy): '+JSON.stringify(p));
          }
        } catch (e) { setSpeechPerm(false); log('perm check ERR: '+(e?.message||e)); }
      }
    })();

    return () => {
      try { CapSpeech.removeAllListeners?.(); } catch {}
      if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; }
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Diagnostica Walleet</h2>

      <div>Piattaforma: <b>{platform}</b></div>
      <div>Capacitor.isPluginAvailable('SpeechRecognition'): <Tag ok={availSpeechPlugin} label={String(availSpeechPlugin)} /></div>
      <div>Capacitor.isPluginAvailable('NativeBiometric'): <Tag ok={availBioPlugin} label={String(availBioPlugin)} /></div>

      <h3 style={{ marginTop: 12 }}>Microfono / Speech</h3>
      <div>available(): <Tag ok={speechAvail} label={String(speechAvail)} /></div>
      <div>hasPermission(): <Tag ok={speechPerm} label={String(speechPerm)} /></div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Capacitor */}
        <button onClick={reqSpeechPerm}>Permesso (Capacitor)</button>
        <button onPointerDown={startSpeechCap} onPointerUp={stopSpeechCap}>🎙️ (Capacitor) Premi e parla</button>
        <button onClick={startSpeechCap}>Avvia (Capacitor)</button>
        <button onClick={stopSpeechCap}>Stop (Capacitor)</button>

        {/* Web Speech (shim opzionale) */}
        <button onClick={startWebSpeech}>🎤 Web Speech (shim) Avvia</button>
        <button onClick={stopWebSpeech}>Stop (Web Speech)</button>
      </div>

      <div style={{ marginTop: 6 }}>Ultimo riconosciuto: <code>{speechLast}</code></div>

      <h3 style={{ marginTop: 12 }}>Biometria</h3>
      <div>isAvailable(): <Tag ok={bioAvail} label={String(bioAvail)} /></div>
      <div>biometryType: <code>{bioType || '-'}</code></div>
      <div style={{ marginTop: 8 }}>
        <button onClick={testBiometric}>🔒 Prova autenticazione</button>
      </div>

      <h3 style={{ marginTop: 12 }}>Log</h3>
      <pre style={{ background: '#0b1020', color: '#cbd5e1', padding: 12, borderRadius: 8, maxHeight: 340, overflow: 'auto' }}>
{status.map((l) => `• ${l}\n`)}
      </pre>
    </div>
  );
}
