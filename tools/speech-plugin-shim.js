// speech-plugin-shim.js
// Intercetta il click su "Aggiungi con Voce" (anche via aria-label/title) IN CAPTURE PHASE,
// blocca il flusso legacy (getUserMedia) e usa il popup nativo del plugin.

(function () {
  function cap() { return (window).Capacitor || null; }
  function plugins() { const c = cap(); return c ? (c.Plugins || {}) : {}; }
  function speech() { return plugins().SpeechRecognition || null; }

  const VOICE_REGEX = /aggiungi\s+con\s+voce/i;

  function matchVoiceButton(btn) {
    if (!btn) return false;
    const t = (btn.textContent || '').trim();
    const label = (btn.getAttribute('aria-label') || '').trim();
    const title = (btn.getAttribute('title') || '').trim();
    const dsTip = (btn.getAttribute('data-tooltip') || '').trim();
    const dsTitle = (btn.getAttribute('data-title') || '').trim();

    return VOICE_REGEX.test(t)
      || VOICE_REGEX.test(label)
      || VOICE_REGEX.test(title)
      || VOICE_REGEX.test(dsTip)
      || VOICE_REGEX.test(dsTitle);
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
    return !!document.querySelector('input#amount');
  }

  async function openFormIfNeeded() {
    if (hasFormInputs()) return true;
    // Prova a cliccare "Aggiungi Spesa"
    // (la legacy UI ha un'azione nel FAB; cerchiamo per label)
    const buttons = document.querySelectorAll('button,[role="button"]');
    for (const el of buttons) {
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().toLowerCase();
      if (/aggiungi\s+spesa/.test(label)) { el.click(); break; }
    }
    for (let i = 0; i < 12; i++) {
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

  async function startVoice() {
    const S = speech();
    if (!S) { alert('Riconoscimento vocale non disponibile sul dispositivo.'); return; }

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
      console.warn('[speech-plugin-shim] start error', e);
      alert('Errore durante il riconoscimento vocale.');
    }
  }

  // 🔒 Blocca il click legacy: usiamo un listener globale in CAPTURE phase.
  function globalCaptureHandler(ev) {
    const btn = ev.target && (ev.target.closest ? ev.target.closest('button,[role="button"]') : null);
    if (!btn) return;
    if (!matchVoiceButton(btn)) return;

    try {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      ev.stopPropagation();
    } catch {}

    // Avvia il popup nativo
    setTimeout(startVoice, 0);
  }

  // Attiva intercettazione globale
  document.addEventListener('click', globalCaptureHandler, true);

  // Per sicurezza, hookiamo comunque i pulsanti (se il menù crea nodi nuovi)
  function hook() {
    const nodes = document.querySelectorAll('button,[role="button"]');
    for (const el of nodes) {
      if (el.__voiceCapHook) continue;
      if (!matchVoiceButton(el)) continue;
      el.__voiceCapHook = true;
      // backup: anche qui blocchiamo in capture per quel bottone specifico
      el.addEventListener('click', (ev) => {
        try { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } catch {}
        setTimeout(startVoice, 0);
      }, true);
    }
  }

  document.addEventListener('DOMContentLoaded', hook);
  const mo = new MutationObserver(hook);
  mo.observe(document.documentElement, { subtree: true, childList: true });

})();
