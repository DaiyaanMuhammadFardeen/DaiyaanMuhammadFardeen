/**
 * makeTiltable — 3D perspective tilt on mouse hover with optional
 * moving glare highlight.
 *
 * Design tokens referenced:
 *   --bg-card (inherited border-radius context)
 * Global state: window.portfolio.reducedMotion
 */

const EASE = 0.1;
const GLARE_TRANSITION = 'opacity 0.3s ease';
const RESET_ANIMATION_DURATION = 300; // ms for spring-back when reset=true

/**
 * Makes an element respond to mouse movement with a 3D tilt effect.
 *
 * @param {HTMLElement} element
 * @param {object}      options
 * @param {number}      [options.maxRotation=15]    Max tilt in degrees.
 * @param {number}      [options.perspective=800]   CSS perspective in px.
 * @param {boolean}     [options.glare=true]         Moving glare effect.
 * @param {number}      [options.glareOpacity=0.15]  Max glare opacity.
 * @param {number}      [options.scale=1.03]         Hover scale factor.
 * @param {boolean}     [options.reset=true]         Animate back on leave.
 * @returns {() => void} Cleanup function.
 */
export function makeTiltable(element, options = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    throw new TypeError('makeTiltable requires a valid HTMLElement');
  }

  const {
    maxRotation = 15,
    perspective = 800,
    glare = true,
    glareOpacity = 0.15,
    scale = 1.03,
    reset = true,
  } = options;

  // Skip on reduced motion
  if (window.portfolio?.reducedMotion) {
    return () => { /* noop */ };
  }

  /* ---- State ---- */

  let rafId = null;
  let curRX = 0; // current rotateX
  let curRY = 0; // current rotateY
  let curS = 1;  // current scale
  let tgtRX = 0;
  let tgtRY = 0;
  let tgtS = 1;

  let isHovering = false;
  let normX = 0; // cursor position normalized [-1, 1]
  let normY = 0;

  let glareEl = null;

  /* ---- Glare element ---- */

  if (glare) {
    glareEl = document.createElement('div');
    glareEl.className = 'tilt-glare';
    glareEl.setAttribute('aria-hidden', 'true');
    glareEl.style.cssText = [
      'position:absolute',
      'inset:0',
      'border-radius:inherit',
      'pointer-events:none',
      'z-index:1',
      'opacity:0',
      'transition:' + GLARE_TRANSITION,
      'will-change:transform,opacity',
    ].join(';');

    // Ensure element has position context
    const pos = getComputedStyle(element).position;
    if (pos === 'static') {
      element.style.position = 'relative';
    }
    element.insertAdjacentElement('afterbegin', glareEl);
  }

  /* ---- Event handlers ---- */

  function onMouseMove(e) {
    const rect = element.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0…1
    const y = (e.clientY - rect.top) / rect.height;    // 0…1

    normX = x * 2 - 1; // -1…1
    normY = y * 2 - 1;

    tgtRX = -normY * maxRotation;
    tgtRY = normX * maxRotation;
    tgtS = scale;
    isHovering = true;

    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function onMouseLeave() {
    isHovering = false;
    if (reset) {
      tgtRX = 0;
      tgtRY = 0;
      tgtS = 1;
    }
    if (glareEl) {
      glareEl.style.opacity = '0';
    }
  }

  /* ---- RAF loop ---- */

  function tick() {
    // Interpolate toward target
    curRX += (tgtRX - curRX) * EASE;
    curRY += (tgtRY - curRY) * EASE;
    curS += (tgtS - curS) * EASE;

    // Apply transform
    const transform = [
      `perspective(${perspective}px)`,
      `rotateX(${curRX.toFixed(2)}deg)`,
      `rotateY(${curRY.toFixed(2)}deg)`,
      `scale(${curS.toFixed(4)})`,
    ].join(' ');

    element.style.transform = transform;
    element.style.willChange = 'transform';

    // Update glare position — conic gradient sweep from cursor angle
    if (glareEl && isHovering) {
      const glareX = (normX * 0.5 + 0.5) * 100;
      const glareY = (normY * 0.5 + 0.5) * 100;
      const angle = Math.atan2(normY, normX) * (180 / Math.PI);

      glareEl.style.background = `
        conic-gradient(
          from ${angle.toFixed(1)}deg at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%,
          rgba(255,255,255,${glareOpacity}) 0deg,
          transparent 20deg,
          transparent 340deg,
          rgba(255,255,255,${glareOpacity}) 360deg
        )
      `;
      glareEl.style.opacity = '1';
    }

    // Halt RAF when settled and not hovering
    const settled =
      !isHovering &&
      Math.abs(curRX) < 0.05 &&
      Math.abs(curRY) < 0.05 &&
      Math.abs(curS - 1) < 0.001;

    if (settled) {
      element.style.transform = '';
      element.style.willChange = '';
      if (glareEl) {
        glareEl.style.background = '';
        glareEl.style.opacity = '0';
      }
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ---- Attach ---- */

  element.addEventListener('mousemove', onMouseMove, { passive: true });
  element.addEventListener('mouseleave', onMouseLeave, { passive: true });

  /* ---- Cleanup ---- */

  return function cleanup() {
    element.removeEventListener('mousemove', onMouseMove);
    element.removeEventListener('mouseleave', onMouseLeave);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    element.style.transform = '';
    element.style.willChange = '';

    if (glareEl) {
      glareEl.remove();
      glareEl = null;
    }
  };
}
