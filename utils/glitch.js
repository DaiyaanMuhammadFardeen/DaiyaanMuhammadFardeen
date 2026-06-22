/**
 * glitchText — temporary text corruption effect with split-displacement
 * and accent-colored character replacement.
 *
 * Design tokens referenced:
 *   --accent-cyan, --accent-magenta
 * Global state: window.portfolio.reducedMotion
 */

const GLITCH_INTERVAL_MS = 50;
const CHARSET_DEFAULT =
  '!<>-_\\/[]{}—=+*^?#________' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  '0123456789';

const COLORS = ['var(--accent-cyan, #00e5ff)', 'var(--accent-magenta, #ff00aa)'];
const COLORIZE_CHANCE = 0.3;

/**
 * Apply a temporary glitch effect to an element's text.
 *
 * @param {HTMLElement} element
 * @param {object}      options
 * @param {number}      [options.intensity=5]      1–10 scale
 * @param {number}      [options.duration=800]     Total ms the effect runs
 * @param {string}      [options.chars]            Character pool to draw from
 * @param {boolean}     [options.preserveSpaces=true]
 * @returns {Promise<void>} Resolves when glitch completes
 */
export function glitchText(element, options = {}) {
  const {
    intensity = 5,
    duration = 800,
    chars = CHARSET_DEFAULT,
    preserveSpaces = true,
  } = options;

  if (!element || !(element instanceof HTMLElement)) {
    return Promise.reject(new TypeError('glitchText requires a valid HTMLElement'));
  }

  // Respect reduced motion
  if (window.portfolio?.reducedMotion) {
    return Promise.resolve();
  }

  const originalText = element.textContent || '';
  if (originalText.length === 0) {
    return Promise.resolve();
  }

  const charset = chars;
  const intensityFactor = Math.max(1, Math.min(10, intensity)) / 5; // 0.2–2.0
  // replacement ratio per tick: 20%–40%, scaled by intensity
  const baseRatio = 0.2 * intensityFactor;
  const ratioRange = 0.2 * intensityFactor;

  // Pre-compute skew range based on intensity
  const skewMax = 1 + intensityFactor * 1.5; // ~1.3°–4.0°

  return new Promise((resolve) => {
    const startTime = performance.now();
    let intervalId;

    function tick() {
      const elapsed = performance.now() - startTime;

      if (elapsed >= duration) {
        clearInterval(intervalId);
        // Restore
        element.textContent = originalText;
        element.style.transform = '';
        element.style.clipPath = '';
        element.style.willChange = '';
        resolve();
        return;
      }

      // Proportion of chars to replace this tick
      const ratio = baseRatio + Math.random() * ratioRange;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      const parts = [];

      for (let i = 0; i < originalText.length; i++) {
        const ch = originalText[i];

        if (ch === ' ' && preserveSpaces) {
          parts.push(' ');
          continue;
        }

        if (Math.random() < ratio) {
          const replacement = charset[Math.floor(Math.random() * charset.length)];
          if (Math.random() < COLORIZE_CHANCE) {
            parts.push(`<span style="color:${color}">${replacement}</span>`);
          } else {
            parts.push(replacement);
          }
        } else {
          parts.push(ch);
        }
      }

      element.innerHTML = parts.join('');

      // ---- Visual distortion ----

      // Skew with random flick
      const skewDeg = (Math.random() - 0.5) * 2 * skewMax;
      element.style.transform = `skewX(${skewDeg.toFixed(2)}deg)`;

      // Clip-path split: randomly shift clip region to simulate
      // top/bottom separation
      const splitPos = 20 + Math.random() * 30; // 20%–50%
      const offset = (Math.random() - 0.5) * 6; // ±3px
      element.style.clipPath =
        `polygon(0 0, 100% 0, 100% ${splitPos}%, ` +
        `calc(100% + ${offset.toFixed(1)}px) ${splitPos}%, ` +
        `calc(100% + ${offset.toFixed(1)}px) 100%, 0 100%)`;

      // Toggle will-change during animation for GPU acceleration
      element.style.willChange = 'transform';
    }

    intervalId = setInterval(tick, GLITCH_INTERVAL_MS);
    tick(); // first frame immediately
  });
}
