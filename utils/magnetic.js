/**
 * makeMagnetic — cursor-attraction effect that displaces an element toward
 * the mouse pointer when it enters a configurable radius.
 *
 * Global state: window.portfolio.mouse {x, y}, window.portfolio.reducedMotion
 */

const DEFAULT_RADIUS = 80;
const DEFAULT_STRENGTH = 20;
const DEFAULT_SPRING = 0.08;
const EPSILON = 0.1;

/**
 * Makes an element follow the cursor within a magnetic radius.
 *
 * @param {HTMLElement} element
 * @param {object}      options
 * @param {number}      [options.radius=80]         Activation radius in px.
 * @param {number}      [options.strength=20]       Max displacement in px.
 * @param {number}      [options.springReturn=0.08] Return-to-rest speed.
 * @returns {() => void} Cleanup function.
 */
export function makeMagnetic(element, options = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    throw new TypeError('makeMagnetic requires a valid HTMLElement');
  }

  const radius = options.radius ?? DEFAULT_RADIUS;
  const strength = options.strength ?? DEFAULT_STRENGTH;
  const spring = options.springReturn ?? DEFAULT_SPRING;

  // Skip on reduced motion
  if (window.portfolio?.reducedMotion) {
    return () => { /* noop */ };
  }

  let rafId = null;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let wasInside = false;
  let isDisplaced = false;

  /** Get element center in viewport coords. */
  function getCenter() {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function tick() {
    const mouse = window.portfolio?.mouse;
    if (!mouse || typeof mouse.x !== 'number') {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const center = getCenter();
    const dx = mouse.x - center.x;
    const dy = mouse.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius && dist > 0.01) {
      // Inside magnetic field
      const factor = 1 - dist / radius;                // 0 at edge → 1 at center
      const normX = dx / dist;
      const normY = dy / dist;

      targetX = normX * factor * strength;
      targetY = normY * factor * strength;
      wasInside = true;
    } else {
      // Outside — spring back to origin
      targetX = 0;
      targetY = 0;
    }

    // Interpolate toward target
    currentX += (targetX - currentX) * spring;
    currentY += (targetY - currentY) * spring;

    const moving = Math.abs(currentX) > EPSILON || Math.abs(currentY) > EPSILON;
    // Continue a brief spring even after crossing the threshold for smooth exit
    const needsCleanup =
      moving || wasInside;

    if (moving) {
      element.style.transform =
        `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      element.style.willChange = 'transform';
      isDisplaced = true;
      wasInside = false;
    } else if (isDisplaced) {
      // Fully returned
      element.style.transform = '';
      element.style.willChange = '';
      isDisplaced = false;
      wasInside = false;
    }

    if (needsCleanup) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  // Kick off RAF if mouse data already available (otherwise wait for first move)
  if (window.portfolio?.mouse && typeof window.portfolio.mouse.x === 'number') {
    rafId = requestAnimationFrame(tick);
  } else {
    // Listen for the first mouse move to bootstrap
    const bootstrapper = () => {
      window.removeEventListener('mousemove', bootstrapper);
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };
    window.addEventListener('mousemove', bootstrapper, { passive: true, once: true });
  }

  /** Cleanup: cancel RAF, reset transforms, remove listeners. */
  return function cleanup() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    element.style.transform = '';
    element.style.willChange = '';
    isDisplaced = false;
    wasInside = false;
    currentX = 0;
    currentY = 0;
  };
}
