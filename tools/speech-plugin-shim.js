// tools/speech-plugin-shim.js
// Intercetta il FAB "Aggiungi con Voce" e forza il popup nativo del plugin.
// Aggiunge un overlay di debug e NON blocca più se hasPermission() ritorna false in modo anomalo.

(function () {
  const VOICE_REGEX = /aggiungi\s*con\s*voce/i;
  const STATE = { cooldown: false, killing: false, debugEl: null };

  function cap() { return (window).Capacitor || null; }
  function plugins() { const c = cap(); return c ? (c.Plugins || {}) : {}; }
  function speech() { return plugins().SpeechRecognition || null; }

  // --- Overlay debug minimal (in alto a destra) ---
  function ensureDebug() {
    if (STATE.debugEl) return STATE.debugEl;
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; top: 10px; right: 10px; z-index: 99999;
      background: rgba(17,24,39,.9); color:#fff; font: 12px/1.2 system-ui, sans-serif;
      padding: 8px 10px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      max-width: 70vw; word-break: break-word;
    `;
    el.innerHTML = 'Voice DBG…';
    document.body.appendChild(el);
    STATE.debugEl = el;
    return el;
  }
  function dbg(msg) {
    try {
      const el = ensureDebug();
      const time = new Date().toLocaleTimeString();
      el.innerHTML = `<b>VoiceDBG</b> ${time}<br>${msg}`;
      console.log('[voice-shim]', msg);
    } catch {}
  }

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
    const parent = el.closest ? el.closest('[role="menuitem"],li,div,button,[role="button"]') : null;
    if (parent && VOICE_REGEX.test(textBagFor(parent))) return true;
    return false;
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

  async function checkServiceAvailability(S) {
    try {
      if (!S.available) return { ok: true, note: 'no-available-method' }; // vecchie versioni
      const res = await S.available();
      return { ok: !!(res && (res.available ?? res.result ?? res.value ?? false)), note: JSON.stringify(res) };
    } catch(e) {
      return { ok: false, note: String(e && e.message || e) };
    }
  }

  async function ensurePermission(S) {
    try {
      const has = await S.hasPermission();
      if (!has || !(has.permission || has.granted || has.status === 'granted')) {
        const r = await S.requestPermission();
        const granted = !!(r && (r.permission || r.granted || r.status === 'granted'));
        return granted;
      }
      return true;
    } catch (e) {
      // Alcuni device/plugin qui sono buggati: non blocchiamo l'esecuzione.
      dbg('hasPermission/requestPermission exception → tenterò comunque lo start()');
      return true;
    }
  }

  async function startNativeVoice() {
    const S = speech();
    if (!S) { alert('Riconoscimento vocale non disponibile (plugin mancante).'); dbg('Plugin assente'); return; }

    if (STATE.cooldown) return;
    STATE.cooldown = true;
    setTimeout(() => (STATE.cooldown = false), 1200);

    const avail = await checkServiceAvailability(S);
    dbg(`available(): ${avail.ok} (${avail.note})`);

    const okPerm = await ensurePermission(S);
    dbg(`permission: ${okPerm ? 'granted/assumed' : 'denied'}`);

    try {
      const res = await S.start({ popup: true, language: 'it-IT', partialResults: false });
      const txt = normalize((res && (res.matches?.[0] || res.text || res.result)) || '');
      dbg(`start() ok, text="${txt}"`);
      if (!txt) return;
      const amt = parseAmount(txt);
      const opened = await openFormIfNeeded();
      if (opened) fillForm(txt, amt);
      else alert(`Riconosciuto: ${txt}\n(Impossibile aprire automaticamente il form)`);
    } catch (e) {
      const msg = String(e && e.message || e || '');
      dbg(`start() error: ${msg}`);
      // Messaggi tipici se manca servizio Google / speech service
      if (/recognizer|activitynotfound|service|google/i.test(msg)) {
        alert('Sembra mancare il servizio di riconoscimento vocale di Google.\nVerifica: Impostazioni → App predefinite → Assistente e input vocale → "Servizi di riconoscimento vocale di Google".\nAggiorna/abilita l’app Google e i "Servizi vocali di Google".');
      } else if (/denied|not allowed|permission/i.test(msg)) {
        alert('Il microfono risulta negato.\nVai in Impostazioni → App → Walleet → Permessi → Microfono → Consenti.');
      } else {
        alert('Errore durante il riconoscimento vocale: ' + msg);
      }
    }
  }

  // Intercetta CAPTURE tutti gli eventi sul FAB
  const EVENTS = ['click','pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'];
  function captureHandler(ev) {
    const target = ev.target;
    const candidate = target && (target.closest ? target.closest('button,[role="button"],[data-action],.btn') : null);
    if (!candidate) return;
    if (!isVoiceButton(candidate)) return;
    try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
    setTimeout(startNativeVoice, 0);
  }
  EVENTS.forEach(type => document.addEventListener(type, captureHandler, true));

  // Killer del modal legacy "Aggiungi con Voce"
  function closeLegacyVoiceModalIfAny() {
    if (STATE.killing) return false;
    const nodes = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], .fixed, .inset-0');
    for (const el of nodes) {
      const txt = (el.textContent || '').toLowerCase();
      if (VOICE_REGEX.test(txt)) {
        STATE.killing = true;
        const btnClose = el.querySelector('[aria-label="Chiudi"], [data-dismiss], .close, button');
        if (btnClose) { try { btnClose.click(); } catch {} }
        el.style.display = 'none';
        setTimeout(() => (STATE.killing = false), 800);
        setTimeout(startNativeVoice, 0);
        return true;
      }
    }
    return false;
  }

  const mo = new MutationObserver(() => {
    hookButtonsOnce();
    closeLegacyVoiceModalIfAny();
  });
  mo.observe(document.documentElement, { subtree: true, childList: true });

  function hookButtonsOnce() {
    const nodes = document.querySelectorAll('button,[role="button"],[data-action],.btn');
    for (const el of nodes) {
      if (el.__voiceCapHook) continue;
      if (!isVoiceButton(el)) continue;
      el.__voiceCapHook = true;
      EVENTS.forEach(type => el.addEventListener(type, (ev) => {
        try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
        setTimeout(startNativeVoice, 0);
      }, true));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    hookButtonsOnce();
    closeLegacyVoiceModalIfAny();
    dbg('init…');
  });

  setInterval(closeLegacyVoiceModalIfAny, 1000);
})();
