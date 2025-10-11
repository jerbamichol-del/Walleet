// tools/shim-biometric.js — PROD + SKIP-PIN
// - intercetta "Abilita Impronta" e sblocchi automatici
// - se la biometria va a buon fine, nasconde il gate PIN legacy (niente doppio step)

(function () {
  // === CONFIG ===
  const LS_ENABLED = 'biometricsEnabled';        // chiave: biometria abilitata dall'utente
  const LS_UNLOCKED_AT = 'bio.unlockedAt';       // timestamp ultimo sblocco biometrico
  const UNLOCK_WINDOW_MS = 45 * 1000;            // tempo entro cui "skippare" PIN dopo sblocco

  // testi che identificano schermate/overlay PIN
  const PIN_MATCHERS = [
    /crea un pin/i, /inserisci.*pin/i, /conferma.*pin/i, /\bpin\b/i, /accesso veloce/i,
    /benvenuto!/i, /proteggiamo le tue spese/i
  ];

  function now(){ return Date.now(); }
  function setLS(k, v){ try{ localStorage.setItem(k, String(v)); }catch{} }
  function getLS(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
  function enabled(){ return getLS(LS_ENABLED) === 'true'; }
  function markUnlocked(){ setLS(LS_UNLOCKED_AT, String(now())); }
  function recentlyUnlocked(){
    const t = Number(getLS(LS_UNLOCKED_AT) || '0');
    return Number.isFinite(t) && (now() - t) < UNLOCK_WINDOW_MS;
  }

  function getPlugin(){
    const cap = (window).Capacitor || {};
    const P = cap.Plugins || {};
    return (window).NativeBiometric || P.NativeBiometric || P.CapacitorNativeBiometric || P.CapgoNativeBiometric || null;
  }

  async function promptBiometric(reason){
    const NB = getPlugin();
    if(!NB) return false;
    try{
      await NB.verifyIdentity({
        reason: reason || 'Sblocca Walleet',
        title: 'Autenticazione',
        subtitle: 'Conferma identità',
        description: 'Usa impronta/volto o PIN dispositivo',
        useFallback: true,
        android: { deviceCredentialAllowed: true, confirmationRequired: false }
      });
      markUnlocked();
      // prova subito a chiudere eventuali overlay
      killPinOverlays();
      return true;
    }catch(e){
      return false;
    }
  }

  // Nasconde/chiude schermate PIN/Onboarding quando la biometria è ok
  let killing = false;
  function killPinOverlays(){
    if(!recentlyUnlocked() || killing) return false;
    const roots = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], .fixed, .inset-0, body > div');
    let killed = false;
    roots.forEach(el=>{
      const txt = (el.textContent || '').toLowerCase();
      if(PIN_MATCHERS.some(re => re.test(txt))){
        // prova prima a cliccare eventuale chiudi/salta
        const btn = el.querySelector('button, [role="button"]');
        if(btn){
          killing = true;
          try { btn.click(); } catch {}
          setTimeout(()=> killing = false, 500);
        }
        // nascondi forzatamente
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.setAttribute('aria-hidden','true');
        killed = true;
      }
    });
    return killed;
  }

  // Hook dei bottoni "Abilita Impronta"
  function hookEnableButtons(){
    const nodes = document.querySelectorAll('button,[role="button"],.btn');
    nodes.forEach(el=>{
      if(el.__bioHook) return;
      const txt = ((el.textContent||'') + ' ' + (el.getAttribute?.('aria-label')||'')).toLowerCase();
      if(/abilita\s+impronta/.test(txt)){
        el.__bioHook = true;
        el.addEventListener('click', ()=> {
          setTimeout(()=> promptBiometric('Abilita accesso veloce'), 0);
          setLS(LS_ENABLED, 'true');
        }, {passive:true});
      }
    });
  }

  // Auto-prompt se l’utente ha abilitato biometria
  function autoPromptOnResume(){
    if(!enabled()) return;
    // all’avvio / ritorno in foreground
    promptBiometric('Sblocca Walleet');
  }

  // Observer: appena compaiono schermate PIN → rimuovile se sbloccato
  const mo = new MutationObserver(()=>{
    hookEnableButtons();
    if(recentlyUnlocked()) killPinOverlays();
  });
  mo.observe(document.documentElement, {subtree:true, childList:true});

  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden) autoPromptOnResume();
  });
  document.addEventListener('DOMContentLoaded', ()=>{
    hookEnableButtons();
    if(enabled()) promptBiometric('Sblocca Walleet');
  });

})();
