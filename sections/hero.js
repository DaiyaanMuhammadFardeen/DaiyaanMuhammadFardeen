/**
 * Hero Section — initHero
 * Sequence: eyebrow fade → typewriter → subtitle tokens → CTA buttons → scroll indicator → particles
 */
import { Typewriter } from '../utils/typewriter.js';
import { initHeroParticles } from '../canvas/hero-particles.js';
import { makeMagnetic } from '../utils/magnetic.js';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const isReduced = window.portfolio?.reducedMotion ?? false;

  // Grab elements
  const eyebrow = document.getElementById('hero-eyebrow');
  const display = document.getElementById('hero-display');
  const subtitle = document.getElementById('hero-subtitle');
  const cta = document.getElementById('hero-cta');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const particlesCanvas = document.getElementById('hero-particles');
  const typewriterSpans = $$('.typewriter-text', display);

  // CTA buttons
  const btns = $$('.btn-ghost', cta);
  const viewWorkBtn = btns.find((b) => b.dataset.scrollTo === 'projects');
  const readThesisBtn = btns.find((b) => b.dataset.href);

  if (isReduced) {
    // Show everything instantly
    if (eyebrow) {
      eyebrow.style.opacity = '1';
      eyebrow.style.transform = 'translateY(0)';
    }
    if (typewriterSpans.length) {
      typewriterSpans.forEach((span) => {
        span.textContent = span.dataset.text || '';
      });
    }
    if (subtitle) {
      subtitle.style.opacity = '1';
      $$('span', subtitle).forEach((s) => { s.style.opacity = '1'; });
    }
    if (cta) {
      cta.style.opacity = '1';
      cta.style.transform = 'translateY(0)';
    }
    if (scrollIndicator) {
      scrollIndicator.classList.add('hero__scroll-indicator--visible');
    }
    // Init particles anyway (visual)
    initHeroParticles(particlesCanvas);
    // Magnetic
    btns.forEach((btn) => makeMagnetic(btn));
    // Parallax + click handlers
    attachParallax(hero);
    attachClickHandlers(viewWorkBtn, readThesisBtn);
    return;
  }

  // --- Sequence ---

  // 1. Fade in eyebrow
  if (eyebrow) {
    requestAnimationFrame(() => {
      eyebrow.style.transition = 'opacity 300ms ease, transform 300ms ease';
      eyebrow.style.opacity = '1';
      eyebrow.style.transform = 'translateY(0)';
    });
  }

  // 2. Typewriter sequence (after 200ms delay)
  setTimeout(() => {
    runTypewriterSequence(typewriterSpans).then(() => {
      // 3. After typewriter finishes, wait 500ms then subtitle
      setTimeout(() => {
        animateSubtitle(subtitle).then(() => {
          // 4. Fade in CTA buttons
          setTimeout(() => {
            animateCTA(cta).then(() => {
              // 5. Show scroll indicator
              if (scrollIndicator) {
                scrollIndicator.classList.add('hero__scroll-indicator--visible');
              }
            });
          }, 200);
        });
      }, 500);
    });
  }, 200);

  // 6. Init particles
  initHeroParticles(particlesCanvas);

  // 7. Magnetic buttons
  btns.forEach((btn) => makeMagnetic(btn));

  // 8. Parallax on scroll
  attachParallax(hero);

  // 9. Click handlers
  attachClickHandlers(viewWorkBtn, readThesisBtn);
}

/* ---- Sub-routines ---- */

function runTypewriterSequence(spans) {
  if (!spans.length) return Promise.resolve();

  // Clear any existing content and show spans
  spans.forEach((span) => {
    span.textContent = '';
    span.style.display = 'block';
  });

  // Build a chain: type each span's data-text with a pause on the period of the last one
  const first = spans[0];
  const tw = new Typewriter(first, { speed: 40 });

  // We chain across spans by running them sequentially
  return new Promise(async (resolve) => {
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const text = span.dataset.text || '';
      const isLast = i === spans.length - 1;

      // Create a temp Typewriter for this span
      const t = new Typewriter(span, { speed: 40 });
      for (let c = 0; c < text.length; c++) {
        const char = text[c];
        t.type(char);
        if (isLast && char === '.') {
          t.pause(150);
        }
      }
      await new Promise((resolveType) => {
        // We need to implement type per-character manually for pause support
        // Simpler approach: direct implementation
        resolveType();
      });

      // Actually, let's do a simpler implementation inline
      await typeTextInSpan(span, text, isLast);
    }
    resolve();
  });
}

function typeTextInSpan(span, text, isLast) {
  return new Promise((resolve) => {
    span.textContent = '';
    let idx = 0;
    function tick() {
      if (idx >= text.length) {
        resolve();
        return;
      }
      span.textContent += text[idx];
      const isPeriod = text[idx] === '.';
      idx++;
      const delay = isLast && isPeriod ? 150 : 40;
      setTimeout(tick, delay);
    }
    tick();
  });
}

function animateSubtitle(subtitleEl) {
  if (!subtitleEl) return Promise.resolve();

  // Collect text from child spans or use direct text
  let tokens = [];
  const childSpans = $$('span', subtitleEl);
  if (childSpans.length) {
    childSpans.forEach((s) => {
      const words = s.textContent.split(/(\s+)/).filter((t) => t.length > 0);
      words.forEach((w) => {
        tokens.push({ text: w, style: s.getAttribute('style') || '' });
      });
      s.textContent = ''; // clear original
    });
  } else {
    tokens = subtitleEl.textContent.split(/(\s+)/).filter((t) => t.length > 0);
  }

  if (!tokens.length) {
    subtitleEl.style.opacity = '1';
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // Clear subtitle and build token containers
    subtitleEl.innerHTML = '';
    const tokenEls = tokens.map((t, i) => {
      const span = document.createElement('span');
      span.textContent = t.text;
      span.style.opacity = '0';
      span.style.transition = 'opacity 150ms ease';
      if (t.style) span.setAttribute('style', t.style + '; opacity: 0');
      subtitleEl.appendChild(span);
      return span;
    });

    let i = 0;
    function showNext() {
      if (i >= tokenEls.length) {
        resolve();
        return;
      }
      tokenEls[i].style.opacity = '1';
      i++;
      setTimeout(showNext, 100);
    }
    showNext();
  });
}

function animateCTA(ctaEl) {
  if (!ctaEl) return Promise.resolve();
  const buttons = $$('.btn-ghost', ctaEl);
  if (!buttons.length) {
    ctaEl.style.transition = 'opacity 500ms ease, transform 500ms ease';
    ctaEl.style.opacity = '1';
    ctaEl.style.transform = 'translateY(0)';
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    buttons.forEach((btn) => {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      btn.style.transition = 'opacity 400ms ease, transform 400ms ease';
    });

    let i = 0;
    function showNext() {
      if (i >= buttons.length) {
        resolve();
        return;
      }
      buttons[i].style.opacity = '1';
      buttons[i].style.transform = 'translateY(0)';
      i++;
      setTimeout(showNext, 200);
    }
    setTimeout(showNext, 200); // initial delay before first button
  });
}

function attachParallax(hero) {
  const content = hero?.querySelector('.hero__content');
  if (!content) return;

  function onScroll() {
    const scrollY = window.portfolio?.scroll ?? window.scrollY;
    content.style.transform = `translateY(${scrollY * 0.4}px)`;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

function attachClickHandlers(viewWorkBtn, readThesisBtn) {
  if (viewWorkBtn) {
    viewWorkBtn.addEventListener('click', () => {
      const target = document.getElementById('projects');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (readThesisBtn) {
    readThesisBtn.addEventListener('click', () => {
      const href = readThesisBtn.dataset.href;
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    });
  }
}
