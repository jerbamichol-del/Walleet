// Richiede i permessi microfono (plugin + WebView) e pre-riscalda getUserMedia
(function () {
  async function requestPluginPermission() {
    try {
      const cap = (window).Capacitor || {};
      const P = (cap.Plugins || {});
      const Speech = P.SpeechRecognition || null;
      if (!Speech) return;
      const has = Speech.hasPermission ? await Speech.hasPermission() : { permission: false };
      if (!has || !has.permission) {
        await Speech.requestPermission();
      }
    } catch (e) { /* ignore */ }
  }

  async function warmUpGetUserMedia() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
      }
    } catch (e) { /* ignore */ }
  }

  async function ensureMic() {
    await requestPluginPermission();
    await warmUpGetUserMedia();
  }

  // Chiede i permessi all’avvio (silenzioso)
  document.addEventListener('DOMContentLoaded', ensureMic);

  // Aggancia il bottone "Aggiungi con Voce" per garantire i permessi prima di aprire il modal
  function hook() {
    document.querySelectorAll('button,[role="button"]').forEach(el => {
      const txt = (el.textContent || '').trim().toLowerCase();
      if (!el.__voiceHooked && /aggiungi\s+con\s+voce/.test(txt)) {
        el.__voiceHooked = true;
        el.addEventListener('click', () => {
          // prima di aprire il flusso vocale prova a garantire i permessi
          setTimeout(() => { ensureMic(); }, 0);
        }, { passive: true });
      }
    });
  }

  hook();
  const mo = new MutationObserver(hook);
  mo.observe(document.documentElement, { subtree: true, childList: true });
})();
