// Shim biometria: AuthGate + prompt + wiring su "Abilita Impronta"
// - Salva il flag in Capacitor Preferences (fallback localStorage)
// - Prompt automatico all'apertura se abilitato
(function () {
  const KEY = 'biometricsEnabled';
  let cooldown = false;

  function getCapacitor() {
    return (window).Capacitor || null;
  }
  function getPlugins() {
    const cap = getCapacitor();
    return cap ? (cap.Plugins || {}) : {};
  }
  function getNB() {
    const P = getPlugins();
    return (window).NativeBiometric || P.NativeBiometric || P.CapacitorNativeBiometric || P.CapgoNativeBiometric || null;
  }
  function getPrefs() {
    const P = getPlugins();
    return P.Preferences || null;
  }

  async function setEnabled(v) {
    try {
      const Prefs = getPrefs();
      if (Prefs) {
        await Prefs.set({ key: KEY, value: String(!!v) });
      } else {
        localStorage.setItem(KEY, String(!!v));
      }
    } catch { try { localStorage.setItem(KEY, String(!!v)); } catch {} }
  }

  async function isEnabled() {
    try {
      const Prefs = getPrefs();
      if (Prefs) {
        const { value } = await Prefs.get({ key: KEY });
        return value === 'true';
      }
      return localStorage.getItem(KEY) === 'true';
    } catch { return localStorage.getItem(KEY) === 'true'; }
  }

  async function prompt(reason) {
    const NB = getNB();
    if (!NB) return false;
    if (cooldown) return false;
    cooldown = true;
    setTimeout(() => (cooldown = false), 1200);
    try {
      await NB.verifyIdentity({
        reason: reason || 'Conferma identità',
        title: 'Autenticazione',
        subtitle: 'Conferma identità',
        description: 'Usa impronta/volto o PIN',
        useFallback: true,
        android: { deviceCredentialAllowed: true, confirmationRequired: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  function hookButtons() {
    // aggancia il bottone "Abilita Impronta" dell’onboarding legacy
    const candidates = document.querySelectorAll('button, [role="button"]');
    candidates.forEach((el) => {
      const txt = (el.textContent || '').trim().toLowerCase();
      if (!el.__bioHooked && /abilita\s+impronta/.test(txt)) {
        el.__bioHooked = true;
        el.addEventListener('click', async () => {
          // lascia la navigazione UI com’è, ma in parallelo chiedi conferma
          setTimeout(async () => {
            const ok = await prompt('Abilita accesso veloce');
            if (ok) await setEnabled(true);
          }, 0);
        }, { passive: true });
      }
    });
  }

  async function autoPromptIfEnabled() {
    try {
      if (await isEnabled()) {
        await prompt('Sblocca Walleet');
      }
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    hookButtons();
    autoPromptIfEnabled();
  });

  // Se la UI cambia dinamicamente (React minificato), ri-aggancia
  const mo = new MutationObserver(hookButtons);
  mo.observe(document.documentElement, { subtree: true, childList: true });
  setInterval(hookButtons, 1000);

  // Quando torni in foreground, riprova prompt se abilitato
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autoPromptIfEnabled();
  });

  // Esporta helpers per lo settings-shim
  (window).__bioShim = { setEnabled, isEnabled, prompt };
})();
