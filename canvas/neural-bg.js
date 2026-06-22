/**
 * Neural Network Background — canvas/neural-bg.js
 * Fixed-position background animation with spatial-hash optimized node connections.
 * Neural Terminal aesthetic: dark void, neon cyan/magenta/green accents.
 *
 * Reads CSS custom properties (with hardcoded fallbacks):
 *   --accent-cyan  (#00e5ff)
 *   --accent-magenta (#ff00aa)
 *   --accent-green (#00ff41)
 *   --accent-amber (#ffb300)
 *   --bg-void      (#05050f)
 *
 * Global context: window.portfolio = { mouse: {x, y}, scroll, reducedMotion }
 */

const CONFIG = {
  nodeCount: { min: 90, max: 120 },
  maxSpeed: 0.3,
  radius: { min: 1.5, max: 3.5 },
  pulseAmplitude: 0.8,
  pulseSpeed: 0.002,
  connectionRange: 180,
  connectionOpacity: 0.18,
  connectionWidth: 0.5,
  mouseAttractionMax: 0.02,
  mouseRepelRange: 120,
  mouseRepelForce: 0.15,
  edgeDamping: 0.92,
  scrollRepelThreshold: 0.1,
  scrollParallaxFactor: 0.05,
  spatialCellSize: 150,
  colorDistribution: [
    /* 60% cyan */    'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan',
    /* 25% magenta */ 'magenta', 'magenta', 'magenta',
    /* 15% green */   'green', 'green', 'green',
  ],
};

/* ---- Color helpers ---- */

function parseCSSVar(name, fallback) {
  if (typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

const COLORS = {
  cyan:    () => parseCSSVar('--accent-cyan', '#00e5ff'),
  magenta: () => parseCSSVar('--accent-magenta', '#ff00aa'),
  green:   () => parseCSSVar('--accent-green', '#00ff41'),
  amber:   () => parseCSSVar('--accent-amber', '#ffb300'),
  void:    () => parseCSSVar('--bg-void', '#05050f'),
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---- Spatial Hash Grid ---- */

class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  _key(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(node) {
    const key = this._key(node.x, node.y);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(node);
  }

  getNearby(x, y, range) {
    const found = [];
    const minCX = Math.floor((x - range) / this.cellSize);
    const maxCX = Math.floor((x + range) / this.cellSize);
    const minCY = Math.floor((y - range) / this.cellSize);
    const maxCY = Math.floor((y + range) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = `${cx},${cy}`;
        const bucket = this.grid.get(key);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            found.push(bucket[i]);
          }
        }
      }
    }
    return found;
  }
}

/* ---- Node ---- */

function createNode(w, h) {
  const baseRadius = CONFIG.radius.min + Math.random() * (CONFIG.radius.max - CONFIG.radius.min);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
    vy: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
    baseRadius,
    pulsePhase: Math.random() * Math.PI * 2,
    color: CONFIG.colorDistribution[Math.floor(Math.random() * CONFIG.colorDistribution.length)],
  };
}

/* ---- Radial gradient cache ---- */

const gradientCache = new Map();

function getGradient(ctx, colorHex, radius) {
  const key = `${colorHex}_${radius.toFixed(1)}`;
  if (gradientCache.has(key)) return gradientCache.get(key);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0, hexToRgba(colorHex, 0.9));
  grad.addColorStop(0.5, hexToRgba(colorHex, 0.4));
  grad.addColorStop(1, hexToRgba(colorHex, 0));
  gradientCache.set(key, grad);
  return grad;
}

function clearGradientCache() {
  gradientCache.clear();
}

/* ---- Main init ---- */

export function initNeuralBg() {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const portfolio = window.portfolio || { mouse: { x: 0, y: 0 }, scroll: 0, reducedMotion: false };

  let w, h;
  let nodes = [];
  let lastTime = 0;
  let rafId = null;
  let initialised = false;

  /* ---- Resize ---- */

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    clearGradientCache();

    if (!initialised) {
      const count = CONFIG.nodeCount.min + Math.floor(Math.random() * (CONFIG.nodeCount.max - CONFIG.nodeCount.min + 1));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push(createNode(w, h));
      }
      initialised = true;
    }
  }

  /* ---- Draw static frame (reduced motion) ---- */

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    const voidColor = COLORS.void();
    ctx.fillStyle = voidColor;
    ctx.fillRect(0, 0, w, h);

    const spatial = new SpatialHash(CONFIG.spatialCellSize);
    for (let i = 0; i < nodes.length; i++) {
      spatial.insert(nodes[i]);
    }

    // Draw connections (static positions)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const nearby = spatial.getNearby(a.x, a.y, CONFIG.connectionRange);
      for (let j = 0; j < nearby.length; j++) {
        const b = nearby[j];
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionRange) {
          const opacity = (1 - dist / CONFIG.connectionRange) * CONFIG.connectionOpacity;
          const colorHex = COLORS[a.color]();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(colorHex, opacity);
          ctx.lineWidth = CONFIG.connectionWidth;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const colorHex = COLORS[n.color]();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.baseRadius, 0, Math.PI * 2);
      const grad = getGradient(ctx, colorHex, n.baseRadius);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  /* ---- Animation loop ---- */

  function loop(timestamp) {
    if (portfolio.reducedMotion) {
      drawStatic();
      return;
    }

    const dt = lastTime ? Math.min((timestamp - lastTime) / 16.667, 3) : 1;
    lastTime = timestamp;

    const scrollFraction = document.body.scrollHeight > window.innerHeight
      ? portfolio.scroll / (document.body.scrollHeight - window.innerHeight)
      : 0;

    const scrollDelta = portfolio.scroll - (loop._prevScroll || portfolio.scroll);
    loop._prevScroll = portfolio.scroll;

    // Update positions
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      // Move
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // Scroll parallax
      n.vy += scrollDelta * CONFIG.scrollParallaxFactor;

      // Attraction toward mouse (1/d²)
      if (portfolio.mouse.x >= 0 && portfolio.mouse.y >= 0) {
        const mdx = portfolio.mouse.x - n.x;
        const mdy = portfolio.mouse.y - n.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq > 0) {
          const attractForce = Math.min(1 / mDistSq, CONFIG.mouseAttractionMax);
          n.vx += mdx * attractForce * 0.001 * dt;
          n.vy += mdy * attractForce * 0.001 * dt;
        }

        // Mouse repulsion (close nodes pushed away)
        if (mDistSq < CONFIG.mouseRepelRange * CONFIG.mouseRepelRange && mDistSq > 0) {
          const repelDist = Math.sqrt(mDistSq);
          const repelStrength = (1 - repelDist / CONFIG.mouseRepelRange) * CONFIG.mouseRepelForce;
          n.vx -= (mdx / repelDist) * repelStrength * dt;
          n.vy -= (mdy / repelDist) * repelStrength * dt;
        }
      }

      // Scroll repulsion from top
      if (scrollFraction > CONFIG.scrollRepelThreshold) {
        const topFactor = (scrollFraction - CONFIG.scrollRepelThreshold) / (1 - CONFIG.scrollRepelThreshold);
        n.vy += topFactor * 0.3 * dt;
      }

      // Damping
      n.vx *= CONFIG.edgeDamping;
      n.vy *= CONFIG.edgeDamping;

      // Clamp speed
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > CONFIG.maxSpeed) {
        n.vx = (n.vx / speed) * CONFIG.maxSpeed;
        n.vy = (n.vy / speed) * CONFIG.maxSpeed;
      }

      // Bounce off edges with damping
      if (n.x < 0) { n.x = 0; n.vx *= -CONFIG.edgeDamping; }
      if (n.x > w) { n.x = w; n.vx *= -CONFIG.edgeDamping; }
      if (n.y < 0) { n.y = 0; n.vy *= -CONFIG.edgeDamping; }
      if (n.y > h) { n.y = h; n.vy *= -CONFIG.edgeDamping; }
    }

    // --- Render ---
    ctx.clearRect(0, 0, w, h);

    const spatial = new SpatialHash(CONFIG.spatialCellSize);
    for (let i = 0; i < nodes.length; i++) {
      spatial.insert(nodes[i]);
    }

    // Connections via spatial hash
    const drawn = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const nearby = spatial.getNearby(a.x, a.y, CONFIG.connectionRange);
      for (let j = 0; j < nearby.length; j++) {
        const b = nearby[j];
        if (a === b) continue;
        const idA = i, idB = nodes.indexOf(b);
        const pairKey = idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
        if (drawn.has(pairKey)) continue;
        drawn.add(pairKey);

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionRange) {
          const opacity = (1 - dist / CONFIG.connectionRange) * CONFIG.connectionOpacity;
          const colorHex = COLORS[a.color]();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(colorHex, opacity);
          ctx.lineWidth = CONFIG.connectionWidth;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    const time = timestamp || 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const pulseRadius = n.baseRadius + Math.sin(time * CONFIG.pulseSpeed + n.pulsePhase) * CONFIG.pulseAmplitude;
      const r = Math.max(0.5, pulseRadius);
      const colorHex = COLORS[n.color]();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colorHex, 0.15);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      const grad = getGradient(ctx, colorHex, r);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    rafId = requestAnimationFrame(loop);
  }

  /* ---- Init ---- */

  resize();
  window.addEventListener('resize', resize);

  if (portfolio.reducedMotion) {
    drawStatic();
  } else {
    loop._prevScroll = portfolio.scroll;
    rafId = requestAnimationFrame(loop);
  }

  /* ---- Cleanup on reduced-motion change (optional) ---- */

  return function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    clearGradientCache();
    nodes = [];
    initialised = false;
  };
}
