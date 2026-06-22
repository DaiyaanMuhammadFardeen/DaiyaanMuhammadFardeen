/**
 * Cursor Trail — canvas/cursor-trail.js
 * Custom cursor system with core dot, outer ring, particle trail, and connection lines.
 * Neural Terminal aesthetic: neon cursor feedback with hover-state labels.
 *
 * Reads CSS custom properties (with hardcoded fallbacks):
 *   --accent-cyan    (#00e5ff)
 *   --accent-magenta (#ff00aa)
 *   --accent-green   (#00ff41)
 *
 * Global context: window.portfolio = { mouse: {x, y}, reducedMotion }
 */

const TRAIL_LENGTH = 6;
const RING_LAG_FRAMES = 8;
const RING_INTERPOLATION = 0.15;
const PARTICLE_LIFETIME = 40;
const PARTICLE_MAX_SPEED_FACTOR = 0.3;
const PARTICLE_GRAVITY = 0.05;
const PARTICLE_MAX_COUNT = 40;
const PARTICLE_SPAWN_DISTANCE = 2;
const CONNECTION_INTERVAL = 8;
const MOUSE_IDLE_TIMEOUT = 500; // ms before stopping particle spawn
const CONNECTION_OPACITY = 0.4;

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

/* ---- Particle ---- */

function createTrailParticle(x, y, vx, vy, colorIdx) {
  return {
    x,
    y,
    vx,
    vy,
    radius: 3,
    life: PARTICLE_LIFETIME,
    maxLife: PARTICLE_LIFETIME,
    color: colorIdx % 2 === 0 ? 'cyan' : 'magenta',
    alpha: 0.8,
  };
}

/* ---- Main init ---- */

export function initCursorTrail() {
  const canvas = document.getElementById('cursor-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const portfolio = window.portfolio || { mouse: { x: 0, y: 0 }, reducedMotion: false };

  let w, h;
  let rafId = null;

  // Mouse state
  let mouseX = -1000;
  let mouseY = -1000;
  let prevMouseX = -1000;
  let prevMouseY = -1000;
  let mouseVelX = 0;
  let mouseVelY = 0;
  let mouseSpeed = 0;

  // Ring state (lags behind)
  let ringX = -1000;
  let ringY = -1000;

  // Position history for connection lines
  const positionHistory = [];

  // Trail particles
  const particles = [];
  let spawnCounter = 0;
  let particleColorToggle = 0;
  let lastSpawnX = -1000;
  let lastSpawnY = -1000;
  let frameCount = 0;
  let lastMoveTime = 0;

  // Hover state
  let hoverLabel = '';
  let isHovering = false;

  // Device pixel ratio
  let dpr = 1;

  /* ---- Resize ---- */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Set device info on portfolio
    if (!window.portfolio) window.portfolio = {};
    window.portfolio.isMobile = w < 768;
  }

  /* ---- Mouse tracking ---- */

  function onMouseMove(e) {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseVelX = mouseX - prevMouseX;
    mouseVelY = mouseY - prevMouseY;
    mouseSpeed = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);

    // Check idle before updating timestamp
    const now = performance.now();
    const wasIdle = (now - lastMoveTime) > MOUSE_IDLE_TIMEOUT;
    lastMoveTime = now;

    // Update portfolio global
    if (portfolio.mouse) {
      portfolio.mouse.x = mouseX;
      portfolio.mouse.y = mouseY;
    }

    // Track position history
    positionHistory.push({ x: mouseX, y: mouseY });
    if (positionHistory.length > TRAIL_LENGTH) {
      positionHistory.shift();
    }

    // If mouse was idle for 500ms+, skip particle spawn (avoid burst) but still update position
    if (wasIdle) {
      lastSpawnX = mouseX;
      lastSpawnY = mouseY;
      return;
    }

    // Spawn particles based on movement distance
    if (lastSpawnX < 0 || lastSpawnY < 0) {
      lastSpawnX = mouseX;
      lastSpawnY = mouseY;
    }

    const dx = mouseX - lastSpawnX;
    const dy = mouseY - lastSpawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= PARTICLE_SPAWN_DISTANCE) {
      const numParticles = Math.min(Math.floor(dist / PARTICLE_SPAWN_DISTANCE), 3);
      for (let i = 0; i < numParticles; i++) {
        if (particles.length >= PARTICLE_MAX_COUNT) break;

        const t = dist > 0 ? (i + 1) / numParticles : 0;
        const sx = lastSpawnX + dx * t;
        const sy = lastSpawnY + dy * t;

        const pvx = mouseVelX * PARTICLE_MAX_SPEED_FACTOR + (Math.random() - 0.5) * 1.5;
        const pvy = mouseVelY * PARTICLE_MAX_SPEED_FACTOR + (Math.random() - 0.5) * 1.5;

        particles.push(createTrailParticle(sx, sy, pvx, pvy, particleColorToggle));
        particleColorToggle++;
      }

      lastSpawnX = mouseX;
      lastSpawnY = mouseY;
    }
  }

  function onMouseLeave() {
    mouseX = -1000;
    mouseY = -1000;
    if (portfolio.mouse) {
      portfolio.mouse.x = -1000;
      portfolio.mouse.y = -1000;
    }
  }

  /* ---- Hover detection ---- */

  function onHoverChange(e) {
    const target = e.target;
    if (target && target.hasAttribute) {
      if (target.hasAttribute('data-cursor-label')) {
        hoverLabel = target.getAttribute('data-cursor-label') || '';
        isHovering = true;
      } else {
        // Check parents
        let el = target;
        while (el && el !== document.body) {
          if (el.hasAttribute && el.hasAttribute('data-cursor-label')) {
            hoverLabel = el.getAttribute('data-cursor-label') || '';
            isHovering = true;
            return;
          }
          el = el.parentElement;
        }
        hoverLabel = '';
        isHovering = false;
      }
    } else {
      hoverLabel = '';
      isHovering = false;
    }
  }

  /* ---- Reduced motion ---- */

  function applyReducedMotion() {
    document.body.style.cursor = 'auto';
  }

  /* ---- Render loop ---- */

  function loop(timestamp) {
    if (portfolio.reducedMotion) {
      applyReducedMotion();
      return;
    }

    const dt = 1; // Fixed timestep for consistent interpolation

    // --- Update ring position (lag behind mouse) ---
    if (ringX < -500 || ringY < -500) {
      ringX = mouseX;
      ringY = mouseY;
    } else {
      const targetX = mouseX;
      const targetY = mouseY;
      // Only interpolate if mouse has moved recently
      if (Math.abs(targetX - ringX) > 0.1 || Math.abs(targetY - ringY) > 0.1) {
        ringX += (targetX - ringX) * RING_INTERPOLATION * dt;
        ringY += (targetY - ringY) * RING_INTERPOLATION * dt;
      }
    }

    // --- Update particles ---
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += PARTICLE_GRAVITY * dt;
      p.life--;
      p.alpha = (p.life / p.maxLife) * 0.8;
      p.radius = 3 * (p.life / p.maxLife);

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // --- Clear canvas ---
    ctx.clearRect(0, 0, w, h);

    // --- Layer 4: Connection lines (every 5 frames) ---
    frameCount++;
    if (frameCount % CONNECTION_INTERVAL === 0 && positionHistory.length >= 2) {
      for (let i = 0; i < positionHistory.length - 1; i++) {
        const a = positionHistory[i];
        const b = positionHistory[i + 1];
        const t = i / (positionHistory.length - 1);
        const opacity = (1 - t) * CONNECTION_OPACITY;
        const colorHex = COLORS.green();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(colorHex, opacity);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // --- Layer 3: Particle trail ---
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const colorHex = COLORS[p.color]();

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 1, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, p.alpha * 0.15);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, p.alpha * 0.6);
      ctx.fill();
    }

    // --- Layer 2: Outer ring ---
    const ringBaseRadius = isHovering ? 48 : 24;
    const ringColorHex = isHovering ? COLORS.magenta() : COLORS.cyan();
    const ringAlpha = isHovering ? 0.8 : 0.6;

    // Deformation based on movement direction
    if (mouseSpeed > 1) {
      const angle = Math.atan2(mouseVelY, mouseVelX);
      const stretch = Math.min(1 + mouseSpeed * 0.02, 1.4);
      const squash = 1 / stretch;

      ctx.save();
      ctx.translate(ringX, ringY);
      ctx.rotate(angle);
      ctx.scale(stretch, squash);
      ctx.beginPath();
      ctx.arc(0, 0, ringBaseRadius, 0, Math.PI * 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(ringX, ringY, ringBaseRadius, 0, Math.PI * 2);
    }

    ctx.strokeStyle = hexToRgba(ringColorHex, ringAlpha);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hover label
    if (isHovering && hoverLabel) {
      ctx.save();
      ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Label background
      const labelWidth = ctx.measureText(hoverLabel).width;
      const labelX = ringX;
      const labelY = ringY - ringBaseRadius - 12;

      ctx.fillStyle = 'rgba(5,5,15,0.8)';
      ctx.fillRect(labelX - labelWidth / 2 - 8, labelY - 14, labelWidth + 16, 22);

      ctx.strokeStyle = hexToRgba(ringColorHex, 0.3);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(labelX - labelWidth / 2 - 8, labelY - 14, labelWidth + 16, 22);

      ctx.fillStyle = ringColorHex;
      ctx.fillText(hoverLabel, labelX, labelY);

      ctx.restore();
    }

    // --- Layer 1: Core dot ---
    const coreColorHex = COLORS.cyan();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(coreColorHex, 0.9);
    ctx.fill();

    // Core glow
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(coreColorHex, 0.08);
    ctx.fill();

    rafId = requestAnimationFrame(loop);
  }

  /* ---- Init ---- */

  resize();
  window.addEventListener('resize', resize);

  if (portfolio.reducedMotion) {
    applyReducedMotion();
    return;
  }

  // Skip custom cursor on mobile — use default instead
  if (window.innerWidth < 768) {
    document.body.style.cursor = 'auto';
    return;
  }

  // Mouse events on document (cursor canvas has pointer-events: none)
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);

  // Hover detection via mouseover
  document.addEventListener('mouseover', onHoverChange);

  // Set initial mouse position if available
  if (portfolio.mouse && portfolio.mouse.x >= 0) {
    mouseX = portfolio.mouse.x;
    mouseY = portfolio.mouse.y;
    ringX = mouseX;
    ringY = mouseY;
    lastSpawnX = mouseX;
    lastSpawnY = mouseY;
  }

  rafId = requestAnimationFrame(loop);

  /* ---- Cleanup ---- */

  return function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
    document.removeEventListener('mouseover', onHoverChange);
    particles.length = 0;
    positionHistory.length = 0;
  };
}
