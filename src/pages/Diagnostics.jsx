import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeech } from '@capacitor-community/speech-recognition';
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

  const [cordovaReady, setCordovaReady] = useState(false);
  const [cordovaLoaded, setCordovaLoaded] = useState(false);

  const listenerRefs = useRef({ partial: null, result: null, error: null });
  const startWatchdog = useRef(null);

  const log = (msg) => setStatus((s) => [String(msg), ...s].slice(0, 150));

  function hasCordovaSpeech() {
    return typeof window !== 'undefined'
      && window.cordova
      && window.cordova.plugins
      && window.cordova.plugins.speechRecognition;
  }
  function cordovaState() {
    return {
      typeofCordova: typeof window !== 'undefined' ? typeof window.cordova : 'no-window',
      hasPlugins: !!(typeof window !== 'undefined' && window.cordova && window.cordova.plugins),
      hasSpeech: !!(typeof window !== 'undefined' && window.cordova && window.cordova.plugins && window.cordova.plugins.speechRecognition),
    };
  }

  // ===== util: carica script a runtime
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const el = document.createElement('script');
      el.src = src;
      el.onload = ()=>resolve(src);
      el.onerror = ()=>reject(new Error('script load fail: '+src));
      document.head.appendChild(el);
    });
  }

  // ===== carica cordova_plugins.js e il JS del plugin speech se non presenti
  async function ensureCordovaPluginSpeech(){
  try{
    if (typeof window==='undefined' || !window.cordova){ return 'no-cordova'; }
    // 1) carica registry se non presente
    let gotList = false;
    try {
      if (!(window.cordova && window.cordova.require && window.cordova.require('cordova/plugin_list'))) {
        await loadScript('cordova_plugins.js');
      }
      const pl = window.cordova && window.cordova.require ? window.cordova.require('cordova/plugin_list') : null;
      if (pl) { gotList = true; window.__pluginList = pl; }
    } catch(e){ /* ignore, loggeremo sotto */ }

    if (!gotList){
      return 'no-plugin-list';
    }
    // 2) prendi gli items: array con {id, file, clobbers, ...}
    const list = (window.__pluginList && (window.__pluginList || window.__pluginList.moduleList || window.__pluginList.plugins)) || window.__pluginList;
    const items = Array.isArray(list) ? list : (list && list.moduleList ? list.moduleList : []);
    if (!items || !items.length){ return 'empty-list'; }

    // 3) carica SOLO i moduli del pacchetto speech e raccogli path reali
    const targets = items.filter(it => String(it.id||'').indexOf('cordova-plugin-speechrecognition') !== -1);
    if (!targets.length){ return 'speech-not-in-list'; }

    let loaded = [];
    for (const it of targets){
      if (!it.file) continue;
      try{
        await loadScript(it.file); // es: plugins/cordova-plugin-speechrecognition/www/speechRecognition.js
        loaded.push(it.file);
      }catch(e){
        return 'load-fail:'+it.file;
      }
    }
    return loaded.length ? 'ok' : 'nothing-loaded';
  }catch(e){
    return 'err:'+ (e && e.message ? e.message : String(e));
  }
}


  // ===== clobber manuale in window.plugins / cordova.plugins
  async function forceCordovaClobbers(){
    try{
      if (typeof window==='undefined' || !window.cordova) return 'no-cordova';
      window.cordova.plugins = window.cordova.plugins || {};
      window.plugins = window.plugins || {};
      let mod = null;
      try {
        if (window.cordova.require) {
          mod = window.cordova.require('cordova-plugin-speechrecognition.SpeechRecognition');
        }
      } catch(e) {
        // ignore: tenteremo dalle globals
      }
      if (!mod && window.plugins && window.plugins.speechRecognition) {
        mod = window.plugins.speechRecognition;
      }
      if (mod) {
        window.plugins.speechRecognition = mod;
        window.cordova.plugins.speechRecognition = mod;
        window.speechRecognition = window.speechRecognition || mod; // alias
        return 'ok';
      }
      return 'missing';
    } catch(e){
      return 'err:' + (e && e.message ? e.message : String(e));
    }
  }

  // ===== pipeline: carica cordova.js -> attendi deviceready -> ensure plugin -> clobber -> verifica
  async function injectCordovaJs(){
    try {
      if (typeof window === 'undefined') return;

      if (window.cordova) {
        log('cordova.js già disponibile: ' + JSON.stringify(cordovaState()));
        setCordovaLoaded(true);
      } else {
        if (!document.querySelector('script[src="cordova.js"]')) {
          const sc = document.createElement('script');
          sc.src = 'cordova.js';
          sc.onload = () => { log('cordova.js caricato'); setCordovaLoaded(true); };
          sc.onerror = () => { log('cordova.js NON trovato (404)'); };
          document.head.appendChild(sc);
        }
      }

      await new Promise((resolve) => {
        const handler = () => {
          log('deviceready fired');
          setCordovaReady(true);
          resolve();
          document.removeEventListener('deviceready', handler, false);
        };
        document.addEventListener('deviceready', handler, false);
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.cordova) {
            log('deviceready forse già passato: ' + JSON.stringify(cordovaState()));
            resolve();
          }
        }, 1200);
      });

      // (manuale) i plugin Cordova si possono caricare dal bottone dedicato.

      // carica lista e moduli plugin via registry
      const ens = await ensureCordovaPluginSpeech();
      log('ensureCordovaPluginSpeech: '+ens);
      const cl = await forceCordovaClobbers?.();
      if (cl) log('Cordova clobber speech: '+cl);
      // rilettura stato
      log('Post-deviceready cordovaState: ' + JSON.stringify(cordovaState()));
      if (hasCordovaSpeech()) log('Cordova driver: disponibile (post-inject)');
      else log('Cordova driver: NON disponibile (post-inject)');
    } catch (e) {
      log('injectCordovaJs ERR: ' + (e?.message || e));
    }
  }

  const getMicGranted = (obj) => {
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
      if (typeof CapSpeech.checkPermissions === 'function') {
        const res = await CapSpeech.checkPermissions();
        setSpeechPerm(getMicGranted(res));
        log('CapSpeech.checkPermissions: ' + JSON.stringify(res));
      } else if (typeof CapSpeech.hasPermission === 'function') {
        const res = await CapSpeech.hasPermission();
        setSpeechPerm(!!res?.permission);
        log('CapSpeech.hasPermission(legacy): ' + JSON.stringify(res));
      } else {
        setSpeechPerm(null);
        log('Nessuna API permessi disponibile su CapSpeech');
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
        try { const a = await CapSpeech.available(); setSpeechAvail(a?.available ?? null); log('CapSpeech.available: ' + JSON.stringify(a)); }
        catch (e) { setSpeechAvail(false); log('CapSpeech.available ERR: ' + (e?.message || e)); }
        await refreshMicPerm();
        try { const L = await CapSpeech.getSupportedLanguages?.(); if (L) { setLangs(L); log('CapSpeech.getSupportedLanguages: ' + JSON.stringify(L).slice(0,200) + '...'); } }
        catch (e) { log('getSupportedLanguages ERR: ' + (e?.message || e)); }
      } else {
        log('Plugin SpeechRecognition NON disponibile per Capacitor');
      }

      if (bioOK) {
        try { const { isAvailable, biometryType } = await NativeBiometric.isAvailable(); setBioAvail(!!isAvailable); setBioType(biometryType || ''); log('Biometric.isAvailable: ' + JSON.stringify({ isAvailable, biometryType })); }
        catch (e) { setBioAvail(false); log('Biometric.isAvailable ERR: ' + (e?.message || e)); }
      } else {
        log('Plugin NativeBiometric NON disponibile per Capacitor');
      }

      // log iniziale cordova
      if (hasCordovaSpeech()) log('Cordova driver: disponibile (cordova-plugin-speechrecognition)');
      else log('Cordova driver: NON disponibile (cordova-plugin-speechrecognition non caricato)');
    })();

    // auto-inject cordova.js su Android
    try {
      if (typeof window !== 'undefined' && /android/i.test(navigator.userAgent)) {
        // (disabilitato) setTimeout(() => injectCordovaJs(), 300);
      }
    } catch (e) { log('auto-inject cordova.js ERR: ' + (e?.message || e)); }

    return () => {
      try { CapSpeech.removeAllListeners?.(); } catch {}
      if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; }
    };
  }, []);

  const reqSpeechPerm = async () => {
    try {
      if (typeof CapSpeech.requestPermissions === 'function') {
        const r = await CapSpeech.requestPermissions();
        log('CapSpeech.requestPermissions: ' + JSON.stringify(r));
        const c = await CapSpeech.checkPermissions?.();
        if (c) {
          setSpeechPerm(getMicGranted(c));
          log('CapSpeech.checkPermissions (post-request): ' + JSON.stringify(c));
        } else {
          setSpeechPerm(getMicGranted(r));
        }
      } else if (typeof CapSpeech.requestPermission === 'function') {
        const r = await CapSpeech.requestPermission();
        setSpeechPerm(!!r?.permission);
        log('CapSpeech.requestPermission(legacy): ' + JSON.stringify(r));
      } else {
        log('API richiesta permessi non disponibile su CapSpeech');
        alert('Richiesta permessi non disponibile su questo plugin/build.');
      }
    } catch (e) {
      log('reqSpeechPerm ERR: ' + (e?.message || e));
      alert('Permesso microfono: ' + (e?.message || e));
    }
  };

  // ===== DRIVER CAPACITOR
  const attachListenersIfNeeded = () => {
    try {
      if (!listenerRefs.current.partial) {
        listenerRefs.current.partial = CapSpeech.addListener('partialResults', (r) => {
          setSpeechLast(r?.matches?.[0] || '');
        });
      }
      if (!listenerRefs.current.result) {
        listenerRefs.current.result = CapSpeech.addListener('result', (r) => {
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

  const startSpeechCap = async () => {
    try {
      if (speechPerm !== true) {
        await reqSpeechPerm();
        const c = await CapSpeech.checkPermissions?.();
        if (c && !getMicGranted(c)) return;
      }
      attachListenersIfNeeded();
      if (startWatchdog.current) clearTimeout(startWatchdog.current);
      startWatchdog.current = setTimeout(() => log('⚠️ Nessun evento (Capacitor) entro 6s.'), 6000);

      await CapSpeech.start({ language: 'it-IT', partialResults: false, popup: true, maxResults: 5, continuous: false });
      log('CapSpeech.start OK');
    } catch (e) {
      log('CapSpeech.start ERR: ' + (e?.message || e));
    }
  };

  const stopSpeechCap = async () => {
    try { await CapSpeech.stop(); log('CapSpeech.stop OK'); if (startWatchdog.current) { clearTimeout(startWatchdog.current); startWatchdog.current = null; } }
    catch (e) { log('CapSpeech.stop ERR: ' + (e?.message || e)); }
  };

  // ===== DRIVER CORDOVA
  const reqCordovaPerm = async () => {
    if (!hasCordovaSpeech()) return log('Cordova driver non disponibile');
    try {
      const has = await window.cordova.plugins.speechRecognition.hasPermission();
      log('Cordova.hasPermission: ' + JSON.stringify(has));
      if (!has) {
        const r = await window.cordova.plugins.speechRecognition.requestPermission();
        log('Cordova.requestPermission: ' + JSON.stringify(r));
      }
    } catch (e) {
      log('Cordova perm ERR: ' + (e?.message || e));
    }
  };

  const startSpeechCordova = async () => {
    if (!hasCordovaSpeech()) return log('Cordova driver non disponibile');
    try {
      const has = await window.cordova.plugins.speechRecognition.hasPermission();
      if (!has) await window.cordova.plugins.speechRecognition.requestPermission();

      await window.cordova.plugins.speechRecognition.startListening(
        (matches) => {
          setSpeechLast(matches?.[0] || '');
          log('Cordova result: ' + JSON.stringify(matches));
        },
        (err) => {
          log('Cordova error: ' + JSON.stringify(err));
        },
        {
          language: 'it-IT',
          matches: 5,
          showPartial: false,
          showPopup: true,
        }
      );
      log('Cordova.startListening OK');
    } catch (e) {
      log('Cordova.startListening ERR: ' + (e?.message || e));
    }
  };

  // ===== WEB SPEECH (SHIM) =====
  let webRec = null;
  function startWebSpeech(setLast, log){
    try{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR){ log('WebSpeech: API non disponibile su questo WebView'); alert('Web Speech non disponibile'); return; }
      webRec = new SR();
      webRec.lang = 'it-IT';
      webRec.interimResults = true;
      webRec.continuous = true;
      webRec.onresult = (e)=>{ try{ const i=e.resultIndex; const txt=e.results[i][0].transcript; setLast(txt); }catch(_){} };
      webRec.onerror  = (e)=>{ log('WebSpeech error: '+JSON.stringify(e)); };
      webRec.onend    = ()=>{ log('WebSpeech end'); };
      webRec.start();
      log('WebSpeech start');
    }catch(e){ log('WebSpeech ERR: '+(e?.message||e)); }
  }
  function stopWebSpeech(log){
    try{ if(webRec){ webRec.stop(); webRec=null; log('WebSpeech stop'); } }catch(e){ log('WebSpeech stop ERR: '+(e?.message||e)); }
  }

  const stopSpeechCordova = async () => {
    if (!hasCordovaSpeech()) return;
    try { await window.cordova.plugins.speechRecognition.stopListening(); log('Cordova.stopListening OK'); }
    catch (e) { log('Cordova.stopListening ERR: ' + (e?.message || e)); }
  };

  const testBiometric = async () => {
    try {
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
        4) Riavvia l’app e riprova.
      </div>

      <div>available(): <Tag ok={speechAvail} label={String(speechAvail)} /></div>
      <div>hasPermission(): <Tag ok={speechPerm} label={String(speechPerm)} /></div>
      <div style={{fontSize:12,opacity:0.8}}>
        cordovaReady: <code>{String(cordovaReady)}</code>, cordovaLoaded: <code>{String(cordovaLoaded)}</code>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={injectCordovaJs}>Carica cordova.js e attendi deviceready</button>
<button onClick={()=>{ try{ const pl = window.cordova && window.cordova.require && window.cordova.require('cordova/plugin_list'); log('plugin_list keys: '+Object.keys(pl||{}).join(',')); log('plugin_list raw: '+JSON.stringify(pl).slice(0,400)+'...'); }catch(e){ log('no plugin_list: '+(e?.message||e)); } }}>Stampa plugin_list</button>
<button onClick={async()=>{ await ensureCordovaPluginSpeech(); log('try ensure plugins → '+JSON.stringify(cordovaState())); }}>Carica plugin Cordova (registry)</button>
<button onClick={async()=>{ const cl = await forceCordovaClobbers(); log('clobber manuale: '+cl+' → '+JSON.stringify(cordovaState())); }}>Clobber manuale Speech</button>

        {/* Capacitor driver */}
        <button onClick={reqSpeechPerm}>Permesso (Capacitor)</button>
        <button onPointerDown={startSpeechCap} onPointerUp={stopSpeechCap}>🎙️ (Capacitor) Premi e parla</button>
        <button onClick={startSpeechCap}>Avvia (Capacitor)</button>
        <button onClick={stopSpeechCap}>Stop (Capacitor)</button>

        {/* Web Speech (shim) */}
        <button onClick={()=>startWebSpeech(setSpeechLast, log)}>🎤 Web Speech (shim) Avvia</button>
        <button onClick={()=>stopWebSpeech(log)}>Stop (Web Speech)</button>

        {/* Cordova driver */}
        <button onClick={reqCordovaPerm}>Permesso (Cordova)</button>
        <button onClick={startSpeechCordova}>🎙️ Prova driver Cordova</button>
        <button onClick={stopSpeechCordova}>Stop (Cordova)</button>
      </div>

      <div style={{ marginTop: 6 }}>Ultimo riconosciuto: <code>{speechLast}</code></div>
      <div style={{ marginTop: 6, fontSize:12, opacity:0.85 }}>Lingue supportate (Capacitor sample): <code>{(langs||[]).slice(0,6).join(', ')||'-'}</code></div>

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
