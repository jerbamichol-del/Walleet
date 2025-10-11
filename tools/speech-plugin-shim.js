// tools/speech-plugin-shim.js (PROD)
// Intercetta "Aggiungi con Voce" e forza il popup nativo del plugin.
// Niente overlay, niente alert rumorosi. Toggle: localStorage.voiceShimEnabled !== 'false'

(function () {
  const VOICE_REGEX = /aggiungi\s*con\s*voce/i;
  const EVENTS = ['click','touchend']; // più leggero ma sufficiente

  function enabled() {
    try { return localStorage.getItem('voiceShimEnabled') !== 'false'; } catch { return true; }
  }
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
    const parent = el.closest ? el.closest('[role="menuitem"],li,div,button,[role="button"]') : null;
    if (parent && VOICE_REGEX.test(textBagFor(parent))) return true;
    return false;
  }

  function normalize(s) { return (s || '').trim(); }
  function parseAmount(text) {
    if (!text) return null;
    const m = text.match(/(\d+[.,]\d+|\d+)/);
    if (!m) return null;
    const v = m[1].replace(',', '.');
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : null;
  }
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
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 100));
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
    if (!S) return; // niente plugin → non forzare nulla

    // Non blocchiamo su hasPermission: alcuni device rispondono in modo non standard
    try { await S.requestPermission(); } catch {}

    try {
      const res = await S.start({ popup: true, language: 'it-IT', partialResults: false });
      const txt = normalize((res && (res.matches?.[0] || res.text || res.result)) || '');
      if (!txt) return;
      const amt = parseAmount(txt);
      const opened = await openFormIfNeeded();
      if (opened) fillForm(txt, amt);
    } catch {
      // Quiet: se utente annulla/non parla, non disturbiamo
    }
  }

  function captureHandler(ev) {
    if (!enabled()) return;
    const target = ev.target;
    const candidate = target && (target.closest ? target.closest('button,[role="button"],[data-action],.btn') : null);
    if (!candidate) return;
    if (!isVoiceButton(candidate)) return;

    try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
    setTimeout(startNativeVoice, 0);
  }

  EVENTS.forEach(type => document.addEventListener(type, captureHandler, true));
})();
