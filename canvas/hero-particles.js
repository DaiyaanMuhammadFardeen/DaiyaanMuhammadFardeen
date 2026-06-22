/**
 * Hero Particles — canvas/hero-particles.js
 * Particle constellation that spells "DAIYAAN" using sampled text geometry.
 * Neural Terminal aesthetic: neon particles converge into readable text.
 *
 * Reads CSS custom properties (with hardcoded fallbacks):
 *   --accent-cyan  (#00e5ff)
 *   --accent-magenta (#ff00aa)
 *   --accent-green (#00ff41)
 *
 * Global context: window.portfolio = { mouse: {x, y}, reducedMotion }
 *
 * @param {HTMLCanvasElement} canvas - The hero particles canvas element.
 */

const TEXT = 'DAIYAAN';
const FONT_SIZE = 400;
const SAMPLE_STEP = 4;
const PARTICLE_COLORS = ['cyan', 'magenta', 'green'];

function parseCSSVar(name, fallback) {
  if (typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

const COLORS = {
  cyan:    () => parseCSSVar('--accent-cyan', '#00e5ff'),
  magenta: () => parseCSSVar('--accent-magenta', '#ff00aa'),
  green:   () => parseCSSVar('--accent-green', '#00ff41'),
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/* ---- Text sampling ---- */

function sampleTextPositions(text, fontSize, step) {
  // Offscreen canvas for text rendering
  const offscreen = document.createElement('canvas');
  // Give generous space; scale font size up for crisp sampling
  const scale = 2;
  const fs = fontSize * scale;
  offscreen.width = 800 * scale;
  offscreen.height = 200 * scale;
  const octx = offscreen.getContext('2d');
  if (!octx) return [];

  octx.fillStyle = '#000';
  octx.fillRect(0, 0, offscreen.width, offscreen.height);

  octx.textBaseline = 'middle';
  octx.textAlign = 'center';
  octx.font = `bold ${fs}px "Space Grotesk", "DM Sans", sans-serif`;
  octx.fillStyle = '#fff';
  octx.fillText(text, offscreen.width / 2, offscreen.height / 2);

  // Sample pixels
  const imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;
  const positions = [];

  const scaledStep = step * scale;
  for (let y = 0; y < offscreen.height; y += scaledStep) {
    for (let x = 0; x < offscreen.width; x += scaledStep) {
      const idx = (y * offscreen.width + x) * 4;
      // If pixel is lit (white text)
      if (data[idx] > 128) {
        positions.push({
          x: (x / scale) - (offscreen.width / scale / 2),
          y: (y / scale) - (offscreen.height / scale / 2),
        });
      }
    }
  }

  return positions;
}

/* ---- Particle ---- */

function createParticle(target, canvasW, canvasH) {
  const colorKey = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  const spread = Math.max(canvasW, canvasH) * 0.6;
  return {
    x: (Math.random() - 0.5) * spread + canvasW / 2,
    y: (Math.random() - 0.5) * spread + canvasH / 2,
    targetX: target.x + canvasW / 2,
    targetY: target.y + canvasH / 2,
    vx: 0,
    vy: 0,
    baseRadius: randomBetween(0.8, 2),
    radius: randomBetween(0.8, 2),
    pulsePhase: Math.random() * Math.PI * 2,
    color: colorKey,
    alpha: randomBetween(0.5, 1),
    arrived: false,
    arriveTime: 0,
  };
}

/* ---- Main init ---- */

export function initHeroParticles(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const portfolio = window.portfolio || { mouse: { x: 0, y: 0 }, reducedMotion: false };

  let w, h;
  let particles = [];
  let targetPositions = [];
  let lastTime = 0;
  let rafId = null;
  let assemblyFraction = 0; // 0 → 1 over ~2 seconds
  let initialised = false;

  /* ---- Resize ---- */

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

    if (!initialised) {
      initParticles();
      initialised = true;
    }
  }

  function initParticles() {
    // Sample text at a size proportional to canvas width
    const fontSize = Math.min(FONT_SIZE, w * 0.8);
    targetPositions = sampleTextPositions(TEXT, fontSize, SAMPLE_STEP);

    // Scale targets to canvas size if needed
    if (targetPositions.length === 0) {
      // Fallback: generate a grid if sampling fails
      for (let i = 0; i < 200; i++) {
        targetPositions.push({
          x: (Math.random() - 0.5) * w * 0.6,
          y: (Math.random() - 0.5) * h * 0.4,
        });
      }
    }

    particles = targetPositions.map((t) => createParticle(t, w, h));
    assemblyFraction = 0;
  }

  /* ---- Draw static text (reduced motion) ---- */

  function drawStaticText() {
    ctx.clearRect(0, 0, w, h);
    const fontSize = Math.min(FONT_SIZE, w * 0.8);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `bold ${fontSize}px "Space Grotesk", "DM Sans", sans-serif`;

    // Glow
    const cyanHex = COLORS.cyan();
    ctx.shadowColor = cyanHex;
    ctx.shadowBlur = 30;
    ctx.fillStyle = hexToRgba(cyanHex, 0.15);
    ctx.fillText(TEXT, w / 2, h / 2);

    ctx.shadowBlur = 0;
    ctx.fillStyle = hexToRgba(cyanHex, 0.6);
    ctx.fillText(TEXT, w / 2, h / 2);
  }

  /* ---- Animation loop ---- */

  function loop(timestamp) {
    if (portfolio.reducedMotion) {
      drawStaticText();
      return;
    }

    const dt = lastTime ? Math.min((timestamp - lastTime) / 16.667, 3) : 1;
    lastTime = timestamp;

    // Advance assembly over ~2 seconds (120 frames at 60fps)
    if (assemblyFraction < 1) {
      assemblyFraction = Math.min(1, assemblyFraction + dt / 120);
    }

    const mx = portfolio.mouse.x;
    const my = portfolio.mouse.y;
    const mouseActive = mx >= 0 && my >= 0;

    // Spring force: (target-pos)*0.05 - vel*0.85
    const springK = 0.05;
    const dampK = 0.85;
    const repelRange = 100;
    const repelForce = 0.8;

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Target position with assembly interpolation
      const easeT = assemblyFraction < 0.5
        ? 2 * assemblyFraction * assemblyFraction
        : 1 - Math.pow(-2 * assemblyFraction + 2, 2) / 2;

      // Drift toward target (spring physics)
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const ax = dx * springK - p.vx * dampK;
      const ay = dy * springK - p.vy * dampK;

      p.vx += ax * dt;
      p.vy += ay * dt;

      // Mouse repulsion
      if (mouseActive) {
        const mdx = p.x - mx;
        const mdy = p.y - my;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < repelRange && mDist > 0) {
          const repelStrength = (1 - mDist / repelRange) * repelForce;
          p.vx += (mdx / mDist) * repelStrength * dt * 2;
          p.vy += (mdy / mDist) * repelStrength * dt * 2;
        }
      }

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check arrival
      const distToTarget = Math.sqrt(
        (p.targetX - p.x) * (p.targetX - p.x) + (p.targetY - p.y) * (p.targetY - p.y)
      );
      if (distToTarget < 2 && !p.arrived) {
        p.arrived = true;
        p.arriveTime = timestamp;
      }

      // Pulse radius on arrival
      if (p.arrived) {
        const pulse = Math.sin(timestamp * 0.003 + p.pulsePhase) * 0.4 + 1;
        p.radius = p.baseRadius * pulse;
      } else {
        p.radius = p.baseRadius;
      }
    }

    // --- Render ---
    ctx.clearRect(0, 0, w, h);

    // Draw faint connections between nearby arrived particles
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      if (!a.arrived) continue;

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        if (!b.arrived) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 60;
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.12;
          const colorHex = COLORS[a.color]();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(colorHex, opacity);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    const time = timestamp || 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const colorHex = COLORS[p.color]();
      const r = p.radius;

      // Glow circle
      const alpha = p.arrived ? p.alpha : p.alpha * Math.min(1, assemblyFraction * 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, alpha * 0.1);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, alpha * 0.8);
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, alpha * 0.4);
      ctx.fill();
    }

    rafId = requestAnimationFrame(loop);
  }

  /* ---- Init ---- */

  resize();
  window.addEventListener('resize', resize);

  if (portfolio.reducedMotion) {
    drawStaticText();
  } else {
    rafId = requestAnimationFrame(loop);
  }

  /* ---- Cleanup ---- */

  return function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    particles = [];
    targetPositions = [];
    initialised = false;
  };
}
