import { SpeechRecognition as CapSpeech } from '@capacitor-community/speech-recognition';
import { App } from '@capacitor/app';

let started = false;
let webRec = null;
let listenersAttached = false;
let appListenerAttached = false;

function attachListeners(onResult, onError, logger){
  if (listenersAttached) return;
  listenersAttached = true;
  try {
    CapSpeech.addListener?.('result', (r)=>{ try{ onResult?.(r?.matches?.[0]||''); }catch(_){} });
    CapSpeech.addListener?.('partialResults', (r)=>{ try{ onResult?.(r?.matches?.[0]||''); }catch(_){} });
    CapSpeech.addListener?.('error', (e)=>{ onError?.(e); logger?.('CapSpeech error '+JSON.stringify(e)); });
  } catch(e){ logger?.('attachListeners ERR '+(e?.message||e)); }
}
function attachAppAutoStop(logger){
  if (appListenerAttached) return; appListenerAttached = true;
  try {
    document.addEventListener('visibilitychange', async ()=>{
      if (document.visibilityState === 'visible' && started){
        try{ await CapSpeech.stop(); logger?.('voice: auto-stop (visibilitychange)'); }catch(e){ logger?.('voice: auto-stop(vis) ERR '+(e?.message||e)); }
      }
    });
  } catch {}
  try {
    App.addListener('appStateChange', async (state)=>{
      if (state?.isActive && started){
        setTimeout(async ()=>{
          try{ await CapSpeech.stop(); logger?.('voice: auto-stop (resume)'); }catch(e){ logger?.('voice: auto-stop(resume) ERR '+(e?.message||e)); }
        }, 250);
      }
    });
  } catch {}
}

async function ensurePermission(logger){
  try{
    if (typeof CapSpeech.requestPermissions === 'function'){
      const r = await CapSpeech.requestPermissions();
      logger?.('perm: '+JSON.stringify(r));
      const c = await CapSpeech.checkPermissions?.();
      return (c?.speechRecognition || c?.microphone || c?.status) === 'granted';
    } else if (typeof CapSpeech.requestPermission === 'function'){
      const r = await CapSpeech.requestPermission();
      logger?.('perm(legacy): '+JSON.stringify(r));
      return !!r?.permission;
    }
  }catch(e){ logger?.('perm ERR: '+(e?.message||e)); }
  return false;
}

export async function startSpeech({ lang='it-IT', popup=true, onResult, onError, logger } = {}){
  try{
    attachAppAutoStop(logger);
    const a = await CapSpeech.available();
    if (a?.available === false) throw new Error('Speech non disponibile');
    const ok = await ensurePermission(logger);
    if (!ok) throw new Error('Permesso microfono negato');

    attachListeners(onResult, onError, logger);

    started = true;
    await CapSpeech.start({
      language: lang,
      partialResults: !popup,
      popup: !!popup,
      maxResults: 5,
      continuous: !popup
    });
    logger?.('start OK');
    return { stop: () => stopSpeech(logger) };
  }catch(e){
    logger?.('start ERR: '+(e?.message||e)+' — provo WebSpeech');
    try{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) throw new Error('WebSpeech non disponibile');
      webRec = new SR();
      webRec.lang = lang;
      webRec.interimResults = true;
      webRec.continuous = true;
      webRec.onresult = (ev) => { try{ const i=ev.resultIndex; const txt=ev.results[i][0].transcript; onResult?.(txt); }catch(_){} };
      webRec.onerror  = (er) => onError?.(er);
      webRec.onend    = ()=>{ started = false; };
      webRec.start();
      started = true;
      logger?.('fallback WebSpeech avviato');
      return { stop: () => stopSpeech(logger) };
    }catch(fb){
      onError?.(e);
      throw e;
    }
  }
}

export async function stopSpeech(logger){
  try{
    if (webRec){ try{ webRec.stop(); }catch(_){} webRec=null; started=false; logger?.('stop WebSpeech OK'); return; }
    await CapSpeech.stop();
    started = false;
    logger?.('stop Capacitor OK');
  }catch(e){
    logger?.('stop ERR: '+(e?.message||e));
  }
}
