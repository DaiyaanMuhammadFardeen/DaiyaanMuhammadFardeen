/**
 * main.js — Frontend.Systems Portfolio Orchestrator
 * Daiyaan Muhammad Fardeen
 *
 * Boot order:
 *   1. Console ASCII art greeting
 *   2. Init global state & reduced-motion detection
 *   3. Loading screen boot sequence
 *   4. Background canvas systems
 *   5. Hero section (visible on load) + lazy init all other sections
 *   6. Terminal dock & section IntersectionObserver
 *   7. GitHub API prefetch
 */

import { initTheme, toggleTheme } from './theme.js';
import { initLoading } from './loading.js';
import { initNeuralBg } from './canvas/neural-bg.js';
import { initCursorTrail } from './canvas/cursor-trail.js';
import { initHero } from './sections/hero.js';
import { initAbout } from './sections/about.js';
import { initSkills } from './sections/skills.js';
import { initProjects } from './sections/projects.js';
import { initTimeline } from './sections/timeline.js';
import { initContact } from './sections/contact.js';
import { initTerminalDock } from './terminal-dock.js';

/* ── Console ASCII Art ── */
console.log(
  '%c  ███╗   ██╗██╗   ██╗ ██████╗ ███╗   ██╗\n' +
  '%c  ████╗  ██║╚██╗ ██╔╝██╔═══██╗████╗  ██║\n' +
  '%c  ██╔██╗ ██║ ╚████╔╝ ██║   ██║██╔██╗ ██║\n' +
  '%c  ██║╚██╗██║  ╚██╔╝  ██║   ██║██║╚██╗██║\n' +
  '%c  ██║ ╚████║   ██║   ╚██████╔╝██║ ╚████║\n' +
  '%c  ╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝\n' +
  '%c\n' +
  '%c  Daiyaan Muhammad Fardeen — Full-Stack Web Developer · ML Engineer\n' +
  '%c  frontend.systems v3.0.0 — booting...\n',
  'color: #00e5ff', 'color: #00e5ff', 'color: #ff00aa', 'color: #00e5ff',
  'color: #ff00aa', 'color: #00e5ff', '',
  'color: #7878a8', 'color: #3a3a5c'
);

/* ── Global State ── */
window.portfolio = {
  mouse: { x: 0.5, y: 0.5 },
  scroll: { y: 0, direction: 0 },
  reducedMotion: false,
  sectionsInitialized: {},
};

/* ── Reduced Motion Detection ── */
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
window.portfolio.reducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', (e) => {
  window.portfolio.reducedMotion = e.matches;
});

/* ── Mouse Tracking ── */
const updateMouse = (e) => {
  window.portfolio.mouse.x = e.clientX / window.innerWidth;
  window.portfolio.mouse.y = e.clientY / window.innerHeight;
};
document.addEventListener('mousemove', updateMouse, { passive: true });
document.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (t) {
    window.portfolio.mouse.x = t.clientX / window.innerWidth;
    window.portfolio.mouse.y = t.clientY / window.innerHeight;
  }
}, { passive: true });

/* ── Scroll Tracking ── */
let lastScrollY = 0;
const updateScroll = () => {
  const y = window.scrollY;
  window.portfolio.scroll.y = y;
  window.portfolio.scroll.direction = y > lastScrollY ? 1 : -1;
  lastScrollY = y;
};
window.addEventListener('scroll', updateScroll, { passive: true });

/* ── Theme Toggle Keybinding ── */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    toggleTheme();
  }
});

/* ── Section Registry ── */
const SECTION_INIT = {
  about:    initAbout,
  skills:   initSkills,
  projects: () => initProjects().catch((err) => {
    console.warn('Projects init error:', err);
    const status = document.getElementById('projects-status');
    if (status) status.textContent = '⚠ failed to fetch projects';
  }),
  timeline: initTimeline,
  contact:  initContact,
};

/* ── Lazy Section IntersectionObserver ── */
const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      el.classList.toggle('section--visible', entry.isIntersecting);

      if (entry.isIntersecting) {
        // Dispatch section:visible custom event
        el.dispatchEvent(new CustomEvent('section:visible', { bubbles: true }));

        // Lazy init: initialize section once on first intersection
        const id = el.id;
        if (!window.portfolio.sectionsInitialized[id] && SECTION_INIT[id]) {
          window.portfolio.sectionsInitialized[id] = true;
          SECTION_INIT[id]();
        }
      }
    });
  },
  { threshold: 0.15 }
);

/* ── GitHub Repos Prefetch ── */
async function prefetchGitHub() {
  try {
    const cache = sessionStorage.getItem('gh-projects');
    if (cache) {
      // Already cached — sections can use it
      return;
    }
    const res = await fetch('https://api.github.com/users/DaiyaanMuhammadFardeen/repos?sort=updated&per_page=10');
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const repos = await res.json();
    sessionStorage.setItem('gh-projects', JSON.stringify(repos));
  } catch (err) {
    console.warn('GitHub prefetch failed (non-critical):', err);
  }
}

/* ── Boot ── */
async function boot() {
  // 0. Init theme
  initTheme();

  // 1. Loading screen
  await initLoading();

  // 2. Observe sections (lazy init)
  document.querySelectorAll('.section').forEach((el) => lazyObserver.observe(el));

  // 3. Background canvas systems (order matters — neural-bg first)
  initNeuralBg();
  initCursorTrail();

  // 4. Initialize hero immediately (it's visible on load)
  initHero();

  // 5. Terminal dock
  initTerminalDock();

  // 6. Prefetch GitHub repos in background
  prefetchGitHub();

  // 7. Mark ready
  document.documentElement.style.setProperty('--boot-complete', '1');
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.innerHTML = `<div class="boot-sequence" style="color:var(--accent-magenta);">
      <div class="boot-line" style="opacity:1;">[FATAL] boot sequence failed: ${err.message}</div>
      <div class="boot-line" style="opacity:1;">[HALT ] system halted — refresh to retry</div>
    </div>`;
  }
});
