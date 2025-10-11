// Shim biometria per UI legacy: intercetta "Abilita Impronta" e usa il plugin nativo
(function () {
  const S = { enabledKey: 'biometricsEnabled', cooldown: false };

  function getPlugin() {
    const cap = (window).Capacitor || {};
    const P = (cap.Plugins || {});
    return (window).NativeBiometric || P.NativeBiometric || P.CapacitorNativeBiometric || P.CapgoNativeBiometric || null;
  }

  async function prompt(reason) {
    const NB = getPlugin();
    if (!NB) return;
    if (S.cooldown) return;
    S.cooldown = true;
    setTimeout(() => (S.cooldown = false), 1500);
    try {
      await NB.verifyIdentity({
        reason: reason || 'Conferma identità',
        title: 'Autenticazione',
        subtitle: 'Conferma identità',
        description: 'Usa impronta/volto o PIN',
        useFallback: true,
        android: { deviceCredentialAllowed: true, confirmationRequired: true },
      });
      try { localStorage.setItem(S.enabledKey, 'true'); } catch {}
    } catch (e) { /* annullata/non riuscita */ }
  }

  function hookButtons() {
    const candidates = document.querySelectorAll('button, [role="button"]');
    candidates.forEach((el) => {
      const txt = (el.textContent || '').trim().toLowerCase();
      if (!el.__bioHooked && /abilita\s+impronta/.test(txt)) {
        el.__bioHooked = true;
        el.addEventListener('click', () => {
          setTimeout(() => prompt('Abilita accesso veloce'), 0);
        }, { passive: true });
      }
    });
  }

  function autoPromptIfEnabled() {
    try {
      if (localStorage.getItem(S.enabledKey) === 'true') {
        prompt('Sblocca Walleet');
      }
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    hookButtons();
    autoPromptIfEnabled();
  });

  const mo = new MutationObserver(hookButtons);
  mo.observe(document.documentElement, { subtree: true, childList: true });
  setInterval(hookButtons, 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autoPromptIfEnabled();
  });
})();
