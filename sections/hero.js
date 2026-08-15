/**
 * Hero Section — initHero
 * Sequence: eyebrow fade → typewriter → subtitle tokens → CTA buttons → scroll indicator → particles
 * Right column: image-based particle portrait
 */
import { initHeroParticles } from '../canvas/hero-particles.js';
import { makeMagnetic } from '../utils/magnetic.js';

const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const isReduced = window.portfolio?.reducedMotion ?? false;

  // Grab elements
  const eyebrow = document.getElementById('hero-eyebrow');
  const title = document.getElementById('hero-title');
  const subtitle = document.getElementById('hero-subtitle');
  const cta = document.getElementById('hero-cta');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const particlesCanvas = document.getElementById('hero-particles');

  // CTA buttons
  const btns = $$('.btn-ghost', cta);
  const viewWorkBtn = btns.find((b) => b.dataset.scrollTo === 'projects');
  const readThesisBtn = btns.find((b) => b.dataset.href);

  if (isReduced) {
    if (eyebrow) {
      eyebrow.style.opacity = '1';
      eyebrow.style.transform = 'translateY(0)';
    }
    if (title) {
      title.style.opacity = '1';
      title.style.transform = 'translateY(0)';
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
    initHeroParticles(particlesCanvas);
    btns.forEach((btn) => makeMagnetic(btn));
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

  // 1b. Fade in title after eyebrow
  if (title) {
    setTimeout(() => {
      title.style.transition = 'opacity 600ms ease, transform 600ms ease';
      title.style.opacity = '1';
      title.style.transform = 'translateY(0)';
    }, 200);
  }

  // 2. Show subtitle (after 200ms delay)
  setTimeout(() => {
    animateSubtitle(subtitle).then(() => {
      // 3. CTA buttons
      setTimeout(() => {
        animateCTA(cta).then(() => {
          // 4. Scroll indicator
          if (scrollIndicator) {
            scrollIndicator.classList.add('hero__scroll-indicator--visible');
          }
        });
      }, 200);
    });
  }, 200);

  // 5. Init particles
  initHeroParticles(particlesCanvas);

  // 6. Magnetic buttons
  btns.forEach((btn) => makeMagnetic(btn));

  // 7. Parallax on scroll
  attachParallax(hero);

  // 8. Click handlers
  attachClickHandlers(viewWorkBtn, readThesisBtn);
}

/* ---- Sub-routines ---- */



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
