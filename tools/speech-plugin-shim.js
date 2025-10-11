// tools/speech-plugin-shim.js
// Obiettivo: bloccare SEMPRE il flusso legacy (getUserMedia in WebView) e usare il popup nativo
// del plugin @capacitor-community/speech-recognition anche quando il bottone è nel FAB.
//
// Tattiche:
// 1) Intercetta globalmente (in CAPTURE phase) click/touch/pointer/mouse sul FAB "Aggiungi con Voce"
// 2) Se il modal legacy "Aggiungi con Voce" compare, lo chiudiamo e lanciamo il popup nativo
// 3) Permessi gestiti via plugin; riempimento form automatico (descrizione + importo)

(function () {
  const VOICE_REGEX = /aggiungi\s*con\s*voce/i;
  const STATE = { cooldown: false, killing: false };

  function cap() { return (window).Capacitor || null; }
  function plugins() { const c = cap(); return c ? (c.Plugins || {}) : {}; }
  function speech() { return plugins().SpeechRecognition || null; }

  function textBagFor(el) {
    const attrs = ['aria-label','title','data-tooltip','data-title','data-action','data-testid'];
    const parts = [(el && el.textContent) || ''];
    for (const a of attrs) parts.push((el && el.getAttribute && el.getAttribute(a)) || '');
    return parts.join(' ').toLowerCase();
  }

  function isVoiceButton(el) {
    if (!el) return false;
    const bag = textBagFor(el);
    if (VOICE_REGEX.test(bag) || /\bvoice\b/.test(bag)) return true;
    // controlla anche il container più vicino (alcuni FAB hanno testo in un wrapper)
    const parent = el.closest ? el.closest('[role="menuitem"],li,div,button,[role="button"]') : null;
    if (parent && VOICE_REGEX.test(textBagFor(parent))) return true;
    return false;
  }

  async function ensurePermission() {
    const S = speech();
    if (!S) return false;
    try {
      const has = await S.hasPermission();
      if (!has || !has.permission) {
        const r = await S.requestPermission();
        return !!(r && (r.permission || r.status === 'granted'));
      }
      return true;
    } catch { return false; }
  }

  function parseAmount(text) {
    if (!text) return null;
    const m = text.match(/(\d+[.,]\d+|\d+)/);
    if (!m) return null;
    const v = m[1].replace(',', '.');
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : null;
  }

  function normalize(s) { return (s || '').trim(); }

  function hasFormInputs() {
    return !!document.querySelector('input#amount') || !!document.querySelector('input#description');
  }

  async function openFormIfNeeded() {
    if (hasFormInputs()) return true;

    // prova a cliccare "Aggiungi Spesa" dal FAB legacy
    const candidates = document.querySelectorAll('button,[role="button"],[data-action]');
    for (const el of candidates) {
      const bag = textBagFor(el);
      if (/aggiungi\s*spesa/i.test(bag)) { el.click(); break; }
    }
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 120));
      if (hasFormInputs()) return true;
    }
    return hasFormInputs();
  }

  function fillForm(desc, amount) {
    const descInput = document.querySelector('input#description');
    const amountInput = document.querySelector('input#amount');
    if (descInput) {
      descInput.focus();
      descInput.value = desc;
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
      descInput.blur();
    }
    if (amount && amountInput) {
      amountInput.focus();
      amountInput.value = amount;
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      amountInput.blur();
    }
  }

  async function startNativeVoice() {
    const S = speech();
    if (!S) { alert('Riconoscimento vocale non disponibile sul dispositivo.'); return; }

    if (STATE.cooldown) return;
    STATE.cooldown = true;
    setTimeout(() => (STATE.cooldown = false), 1200);

    const okPerm = await ensurePermission();
    if (!okPerm) { alert('Microfono non consentito. Abilitalo nelle autorizzazioni dell’app.'); return; }

    try {
      const res = await S.start({ popup: true, language: 'it-IT', partialResults: false });
      const txt = normalize((res && (res.matches?.[0] || res.text || res.result)) || '');
      if (!txt) return;
      const amt = parseAmount(txt);
      const opened = await openFormIfNeeded();
      if (opened) fillForm(txt, amt);
      else alert(`Riconosciuto: ${txt}\n(Impossibile aprire automaticamente il form)`);
    } catch (e) {
      console.warn('[speech-shim] start error', e);
      alert('Errore durante il riconoscimento vocale.');
    }
  }

  // 1) Intercetta TUTTI gli eventi in CAPTURE phase
  const EVENTS = ['click','pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'];
  function captureHandler(ev) {
    const target = ev.target;
    const candidate = target && (target.closest ? target.closest('button,[role="button"],[data-action],.btn') : null);
    if (!candidate) return;
    if (!isVoiceButton(candidate)) return;

    // blocca il flusso legacy
    try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
    // avvia nativo
    setTimeout(startNativeVoice, 0);
  }
  EVENTS.forEach(type => document.addEventListener(type, captureHandler, true));

  // 2) Killer del modal legacy "Aggiungi con Voce"
  function closeLegacyVoiceModalIfAny() {
    if (STATE.killing) return false;
    const nodes = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], .fixed, .inset-0');
    for (const el of nodes) {
      const txt = (el.textContent || '').toLowerCase();
      if (VOICE_REGEX.test(txt)) {
        STATE.killing = true;
        // prova a premere un bottone di chiusura
        const btnClose = el.querySelector('[aria-label="Chiudi"], [data-dismiss], .close, button');
        if (btnClose) { try { btnClose.click(); } catch {} }
        // nascondi forzatamente
        el.style.display = 'none';
        setTimeout(() => (STATE.killing = false), 800);
        // lancia nativo
        setTimeout(startNativeVoice, 0);
        return true;
      }
    }
    return false;
  }

  // Observer per modali e menu dinamici
  const mo = new MutationObserver(() => {
    // hook ricorrente dei pulsanti creati dinamicamente (per sicurezza)
    hookButtonsOnce();
    // se il modal legacy compare, chiudilo e parti nativo
    closeLegacyVoiceModalIfAny();
  });
  mo.observe(document.documentElement, { subtree: true, childList: true });

  // Hook puntuale dei pulsanti già presenti
  function hookButtonsOnce() {
    const nodes = document.querySelectorAll('button,[role="button"],[data-action],.btn');
    for (const el of nodes) {
      if (el.__voiceCapHook) continue;
      if (!isVoiceButton(el)) continue;
      el.__voiceCapHook = true;
      // attaccalo comunque (backup) in capture
      EVENTS.forEach(type => el.addEventListener(type, (ev) => {
        try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
        setTimeout(startNativeVoice, 0);
      }, true));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    hookButtonsOnce();
    // se il modal è già aperto (edge case), uccidilo
    closeLegacyVoiceModalIfAny();
  });

  // Safety net: ogni secondo, controlla se compare il modal legacy
  setInterval(closeLegacyVoiceModalIfAny, 1000);
})();
