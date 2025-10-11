// Piccolo pannello impostazioni flottante (⚙️) con toggle "Sblocco biometrico"
(function () {
  const CSS = `
  .bio-gear { position: fixed; right: 14px; bottom: 18px; z-index: 2147483000; }
  .bio-gear button { width: 48px; height: 48px; border-radius: 9999px; border: none; background: #111827; color: #fff; box-shadow: 0 8px 20px rgba(0,0,0,.25); }
  .bio-gear button:active { transform: scale(.97); }
  .bio-modal-backdrop { position: fixed; inset: 0; background: rgba(2,6,23,.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 2147483001; }
  .bio-card { background: #fff; color:#0f172a; width: min(92vw, 440px); border-radius: 14px; box-shadow: 0 20px 40px rgba(0,0,0,.25); overflow: hidden; }
  .bio-card header { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; }
  .bio-card section { padding: 16px 18px; }
  .bio-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 0; }
  .bio-desc { font-size: .9rem; color:#475569 }
  .bio-actions { display:flex; justify-content:flex-end; gap:12px; padding: 12px 18px 18px; border-top:1px solid #e2e8f0;}
  .bio-btn { padding: 8px 12px; border-radius: 10px; border:1px solid #cbd5e1; background:#fff; color:#0f172a; }
  .bio-btn.p { border-color:#6366f1; background:#4f46e5; color:#fff; }
  .bio-switch { position: relative; width: 46px; height: 26px; background:#e5e7eb; border-radius: 9999px; transition:.18s; }
  .bio-switch.on { background: #4f46e5; }
  .bio-knob { position:absolute; top:3px; left:3px; width:20px; height:20px; background:#fff; border-radius:9999px; transition:.18s; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
  .bio-switch.on .bio-knob { left:23px; }
  `;

  function svgGear() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19.4 13.5a7.96 7.96 0 0 0 .06-1.5 7.96 7.96 0 0 0-.06-1.5l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.14 8.14 0 0 0-2.6-1.5l-.38-2.65A.5.5 0 0 0 12 0h-4a.5.5 0 0 0-.5.42L7.12 3.07a8.14 8.14 0 0 0-2.6 1.5l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L1.76 10.5c-.04.49-.06 1-.06 1.5s.02 1.01.06 1.5L-.45 15.15a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .6.22l2.49-1c.79.61 1.66 1.11 2.6 1.5l.38 2.65a.5.5 0 0 0 .5.42h4a.5.5 0 0 0 .5-.42l.38-2.65c.94-.39 1.81-.89 2.6-1.5l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13.5ZM10 12a2 2 0 1 1 4 0a2 2 0 0 1-4 0Z" fill="currentColor"/></svg>`;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function ensureStyle() {
    if (document.getElementById('bio-style')) return;
    const s = el('style'); s.id = 'bio-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function renderGear() {
    if (document.querySelector('.bio-gear')) return;
    const wrap = el('div', 'bio-gear');
    const btn = el('button', '', svgGear());
    btn.title = 'Impostazioni Walleet';
    btn.addEventListener('click', openModal, { passive: true });
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  async function openModal() {
    const api = (window).__bioShim;
    ensureStyle();
    const backdrop = el('div', 'bio-modal-backdrop');
    const card = el('div', 'bio-card');

    const head = el('header', '', 'Impostazioni');
    const sec = el('section');
    const row = el('div', 'bio-row');
    const left = el('div', '', `<div><strong>Sblocco biometrico</strong></div><div class="bio-desc">Usa impronta/volto o PIN di sistema</div>`);
    const sw = el('div', 'bio-switch');
    const knob = el('div', 'bio-knob'); sw.appendChild(knob);
    row.appendChild(left); row.appendChild(sw);
    sec.appendChild(row);

    const actions = el('div', 'bio-actions');
    const closeB = el('button', 'bio-btn', 'Chiudi');
    const testB = el('button', 'bio-btn p', 'Prova sblocco ora');
    actions.appendChild(closeB); actions.appendChild(testB);

    card.appendChild(head); card.appendChild(sec); card.appendChild(actions);
    backdrop.appendChild(card);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

    // stato iniziale
    try { if (await api.isEnabled()) sw.classList.add('on'); } catch {}

    // toggle
    sw.addEventListener('click', async () => {
      if (sw.classList.contains('on')) {
        // spegni
        try { await api.setEnabled(false); } catch {}
        sw.classList.remove('on');
      } else {
        // accendi → chiedi subito verifica
        const ok = await api.prompt('Abilita accesso veloce');
        if (ok) { try { await api.setEnabled(true); } catch {} sw.classList.add('on'); }
      }
    });

    testB.addEventListener('click', async () => { await api.prompt('Sblocca Walleet'); });
    closeB.addEventListener('click', () => backdrop.remove());

    document.body.appendChild(backdrop);
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyle();
    renderGear();
  });
})();
