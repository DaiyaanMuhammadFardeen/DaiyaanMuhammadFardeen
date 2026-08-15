/**
 * loading.js — Boot sequence for Frontend.Systems loading screen.
 * Shows a kernel-style boot log (matching spec), then reveals the portfolio
 * with a split wipe. The final [OK] lines blink once before the wipe.
 */

/* ── Boot sequence (spec) ── */
const bootLines = [
  { text: '[BOOT] frontend.systems v3.0.0 — initializing web stack...', class: '' },
  { text: '[ OK ] Memory controller: 0x0000-0xFFFF mapped', class: 'boot-ok' },
  { text: '[ OK ] /web-core mounted on cyberspace', class: 'boot-ok' },
  { text: '[ OK ] react/next runtime v15.2 loaded', class: 'boot-ok' },
  { text: '[ OK ] postgres-16 + redis-7 connection pool established', class: 'boot-ok' },
  { text: '[ OK ] node-22 worker threads armed (4 cores online)', class: 'boot-ok' },
  { text: '[WARN] Matrix overlay: signal unstable — deploying static fallback', class: 'boot-progress' },
  { text: '[ OK ] Cursor-trail subsystem armed', class: 'boot-ok' },
  { text: '[ OK ] Particle constellation home position locked', class: 'boot-ok' },
  { text: '         scanning neural topology for Daiyaan...', class: '' },
  { text: '[ OK ] Consciousness located — signal 98%', class: 'boot-ok' },
  { text: '', class: '' },
  { text: '╔═══════════════════════════════════════════╗', class: '' },
  { text: '║  frontend.systems ready — entering stack  ║', class: '' },
  { text: '╚═══════════════════════════════════════════╝', class: '' },
  { text: '', class: '' },
  { text: '[ OK ] system ready. type help for commands.', class: 'boot-ok' },
];

export function initLoading() {
  return new Promise((resolve) => {
    const screen = document.getElementById('loading-screen');
    const container = screen?.querySelector('.boot-sequence');
    if (!screen || !container) { resolve(); return; }

    let idx = 0;
    const lineEls = [];

    function appendLine() {
      if (idx >= bootLines.length) {
        finishBoot();
        return;
      }

      const line = bootLines[idx++];
      const el = document.createElement('div');
      el.className = 'boot-line' + (line.class ? ' ' + line.class : '');
      el.textContent = line.text;
      container.appendChild(el);
      lineEls.push(el);

      requestAnimationFrame(() => { el.style.opacity = '1'; });
      container.scrollTop = container.scrollHeight;

      // Delay logic
      let delay = 60 + Math.random() * 80;
      if (line.text.includes('[ OK ]')) delay = 70 + Math.random() * 50;
      if (line.text.includes('[WARN]')) delay = 180 + Math.random() * 80;
      if (line.text.includes('╔') || line.text.includes('╚')) delay = 120;
      if (line.text === '') delay = 250;
      if (line.text.includes('system ready')) delay = 400;

      setTimeout(appendLine, delay);
    }

    function finishBoot() {
      // Blink all [OK] lines simultaneously
      lineEls.forEach((el) => {
        if (el.textContent.includes('[ OK ]') || el.textContent.includes('[BOOT]')) {
          el.style.transition = 'opacity 100ms';
          el.style.opacity = '0';
          setTimeout(() => { el.style.opacity = '1'; }, 100);
          setTimeout(() => { el.style.opacity = '0'; }, 250);
          setTimeout(() => { el.style.opacity = '1'; }, 400);
        }
      });

      // Then wipe after blink sequence
      setTimeout(() => {
        screen.classList.add('loading-wipe-top');
        const bottom = document.createElement('div');
        bottom.className = 'loading-wipe-bottom';
        screen.appendChild(bottom);

        setTimeout(() => {
          screen.style.display = 'none';
          screen.remove();
          resolve();
        }, 700);
      }, 900);
    }

    setTimeout(appendLine, 200);
  });
}
