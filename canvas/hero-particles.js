/**
 * Hero Particles — canvas/hero-particles.js
 * Particle constellation that forms a portrait image from sampled pixels.
 * Neural Terminal aesthetic: colored particles converge into a photographic image.
 *
 * Loads assets/profile.jpg (719×1280), samples pixels, and renders them
 * as glowing particles that converge from scattered positions into the image.
 * Gentle wave/flow animation after assembly. Mouse repulsion within 100px.
 *
 * Global context: window.portfolio = { mouse: {x, y}, reducedMotion }
 *
 * @param {HTMLCanvasElement} canvas - The hero particles canvas element.
 */

const DESKTOP_STEP = 14;
const MOBILE_STEP = 19;
const MOBILE_BREAKPOINT = 768;

/* Assembly phase */
const SPREAD_FACTOR = 1.8;     // particles start way outside viewport
const ASSEMBLY_FRAMES = 120;   // ~2 seconds convergence
const SPRING_K_FAST = 0.05;    // assembly: fast convergence
const DAMP_K_FAST = 0.85;

/* Stable phase (after assembly) */
const SPRING_K_STABLE = 0.01;  // stable: slow gentle return
const DAMP_K_STABLE = 0.97;    // overdamped — no oscillation
const REPEL_FORCE_STABLE = 0.3;
const WAVE_AMP_MAX = 0.3;      // subtle breathing only

/* Mouse */
const REPEL_RANGE = 100;
const REPULSION_THROTTLE = 3;

/* Visual */
const CONNECTION_MAX_DIST = 60;
const CONNECTION_OPACITY = 0.12;
const CONNECTION_LINE_WIDTH = 0.5;
const CONNECTION_MAX_COUNT = 50;
const ARRIVAL_THRESHOLD = 2;
const PULSE_SPEED = 0.003;
const PULSE_AMPLITUDE = 0.4;
const WAVE_SPEED = 0.002;
const IMAGE_SCALE = 0.85;
const DISPLACED_THRESHOLD = 3; // min px from target to draw connections

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/* ---- Image loading ---- */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/* ---- Pixel sampling ---- */

function sampleImagePixels(img, step) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  const offscreen = document.createElement('canvas');
  offscreen.width = imgW;
  offscreen.height = imgH;
  const octx = offscreen.getContext('2d');
  if (!octx) return [];

  octx.drawImage(img, 0, 0);

  const imageData = octx.getImageData(0, 0, imgW, imgH);
  const data = imageData.data;
  const pixels = [];

  for (let y = 0; y < imgH; y += step) {
    for (let x = 0; x < imgW; x += step) {
      const idx = (y * imgW + x) * 4;
      pixels.push({
        x,
        y,
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      });
    }
  }

  return pixels;
}

/* ---- Particle ---- */

function createParticle(sample, canvasW, canvasH, imgW, imgH) {
  // Scale image to fit canvas with IMAGE_SCALE padding, maintaining aspect ratio
  const scaleX = (canvasW * IMAGE_SCALE) / imgW;
  const scaleY = (canvasH * IMAGE_SCALE) / imgH;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (canvasW - imgW * scale) / 2;
  const offsetY = (canvasH - imgH * scale) / 2;

  const spread = Math.max(canvasW, canvasH) * SPREAD_FACTOR;
  const tx = sample.x * scale + offsetX;
  const ty = sample.y * scale + offsetY;

  return {
    // Current position — scattered across canvas
    x: (Math.random() - 0.5) * spread + canvasW / 2,
    y: (Math.random() - 0.5) * spread + canvasH / 2,
    // Target position — forms the image (modified by wave offset each frame)
    targetX: tx,
    targetY: ty,
    // Original unmodified target (wave offset is applied to this)
    origTargetX: tx,
    origTargetY: ty,
    // Velocity for spring physics
    vx: 0,
    vy: 0,
    // Visual
    baseRadius: randomBetween(1, 2.5),
    radius: randomBetween(1, 2.5),
    // Actual pixel color from image
    r: sample.r,
    g: sample.g,
    b: sample.b,
    // Glow alpha
    alpha: randomBetween(0.5, 1),
    pulsePhase: Math.random() * Math.PI * 2,
    arrived: false,
    arriveTime: 0,
    // Wave animation parameters
    wavePhase: Math.random() * Math.PI * 2,
    waveAmplitude: randomBetween(0.5, 2),
    // Staggered start delay (ms) — creates dramatic wave arrival
    staggerDelay: Math.random() * 1000,
  };
}

/* ---- Main init ---- */

export function initHeroParticles(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h;
  let particles = [];
  let img = null;
  let imgW = 0;
  let imgH = 0;
  let samples = [];
  let lastTime = 0;
  let rafId = null;
  let assemblyFraction = 0;
  let frameCount = 0;
  let loaded = false;
  let assembled = false;
  let startTime = 0;

  // Reusable arrays for connection drawing (avoids per-frame allocation)
  const arrivedParticles = [];
  const connected = [];

  /* ---- Resize ---- */

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Set device info on portfolio
    if (!window.portfolio) window.portfolio = {};
    const nowMobile = w < MOBILE_BREAKPOINT;
    const wasMobile = window.portfolio.isMobile;
    window.portfolio.isMobile = nowMobile;

    // Redraw static image on resize for reduced motion
    if (loaded && (window.portfolio?.reducedMotion ?? false)) {
      drawStaticImage();
    }

    // If breakpoint was crossed, re-sample particles
    if (loaded && particles.length > 0 && wasMobile !== nowMobile) {
      initParticles();
      return;
    }

    // Recalc particle targets on resize (scale/offset change with canvas size)
    if (loaded && particles.length > 0) {
      recalcTargets();
    }
  }

  /* ---- Particle initialisation ---- */

  function initParticles() {
    const step = w < MOBILE_BREAKPOINT ? MOBILE_STEP : DESKTOP_STEP;
    samples = sampleImagePixels(img, step);

    // Fallback if sampling yields nothing
    if (samples.length === 0) {
      for (let i = 0; i < 200; i++) {
        samples.push({
          x: Math.random() * imgW,
          y: Math.random() * imgH,
          r: 255,
          g: 255,
          b: 255,
        });
      }
    }

    particles = samples.map((s) => createParticle(s, w, h, imgW, imgH));
    assemblyFraction = 0;
  }

  /* ---- Recalculate targets on resize ---- */

  function recalcTargets() {
    if (!loaded || samples.length === 0) return;
    const scaleX = (w * IMAGE_SCALE) / imgW;
    const scaleY = (h * IMAGE_SCALE) / imgH;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (w - imgW * scale) / 2;
    const offsetY = (h - imgH * scale) / 2;
    for (let i = 0; i < particles.length; i++) {
      const s = samples[i];
      if (!s) continue;
      const tx = s.x * scale + offsetX;
      const ty = s.y * scale + offsetY;
      particles[i].origTargetX = tx;
      particles[i].origTargetY = ty;
    }
  }

  /* ---- Draw static image (reduced motion) ---- */

  function drawStaticImage() {
    if (!img || !w || !h) return;
    ctx.clearRect(0, 0, w, h);

    const scaleX = (w * IMAGE_SCALE) / imgW;
    const scaleY = (h * IMAGE_SCALE) / imgH;
    const scale = Math.min(scaleX, scaleY);
    const dw = imgW * scale;
    const dh = imgH * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---- Animation loop ---- */

  function loop(timestamp) {
    // Always schedule next frame so toggling reducedMotion can restart
    rafId = requestAnimationFrame(loop);

    if (window.portfolio?.reducedMotion ?? false) {
      drawStaticImage();
      return;
    }

    // Pause rendering when hero section is not in viewport
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }
    }

    // If image not yet loaded, skip frame
    if (!loaded || particles.length === 0) {
      return;
    }

    const dt = lastTime ? Math.min((timestamp - lastTime) / 16.667, 3) : 1;
    lastTime = timestamp;

    // Track start time for staggered particle activation
    if (startTime === 0) startTime = timestamp;

    // Advance assembly over ~2 seconds (ASSEMBLY_FRAMES frames at 60fps)
    if (assemblyFraction < 1) {
      assemblyFraction = Math.min(1, assemblyFraction + dt / ASSEMBLY_FRAMES);
    }
    if (assemblyFraction >= 1 && !assembled) {
      assembled = true;
    }

    // Cyclic counter (0 to REPULSION_THROTTLE-1) to throttle repulsion calc
    frameCount = (frameCount + 1) % REPULSION_THROTTLE;

    // portfolio.mouse.x/y are normalized 0-1 fractions of viewport,
    // convert to canvas-relative pixels via getBoundingClientRect
    const rect = canvas.getBoundingClientRect();
    const mx = ((window.portfolio?.mouse?.x ?? 0.5) * window.innerWidth) - rect.left;
    const my = ((window.portfolio?.mouse?.y ?? 0.5) * window.innerHeight) - rect.top;
    const mouseActive = mx >= 0 && my >= 0 && mx <= rect.width && my <= rect.height;

    // Throttle mouse repulsion: only recalc every REPULSION_THROTTLE frames
    const recalcRepulsion = frameCount === 0;

    const time = timestamp || 0;

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Staggered start: skip particles that haven't been activated yet
      const elapsed = timestamp - startTime;
      if (elapsed < p.staggerDelay) continue;

      // Wave/flow offset — sinusoidal displacement from original target
      const waveAmp = assembled ? Math.min(p.waveAmplitude, WAVE_AMP_MAX) : p.waveAmplitude;
      const waveOffsetX = Math.sin(time * WAVE_SPEED + p.wavePhase) * waveAmp;
      const waveOffsetY = Math.cos(time * WAVE_SPEED + p.wavePhase) * waveAmp;
      p.targetX = p.origTargetX + waveOffsetX;
      p.targetY = p.origTargetY + waveOffsetY;

      // Eased assembly fraction (ease-out quad) — used for alpha fade
      const easeT = assemblyFraction < 0.5
        ? 2 * assemblyFraction * assemblyFraction
        : 1 - Math.pow(-2 * assemblyFraction + 2, 2) / 2;

      // Spring physics: drift toward target (fast for assembly, overdamped for stable)
      const springK = assembled ? SPRING_K_STABLE : SPRING_K_FAST;
      const dampK = assembled ? DAMP_K_STABLE : DAMP_K_FAST;
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const ax = dx * springK - p.vx * dampK;
      const ay = dy * springK - p.vy * dampK;

      p.vx += ax * dt;
      p.vy += ay * dt;

      // Mouse repulsion (throttled to every REPULSION_THROTTLE frames)
      if (mouseActive && recalcRepulsion) {
        const mdx = p.x - mx;
        const mdy = p.y - my;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < REPEL_RANGE && mDist > 0) {
          const repelStrength = (1 - mDist / REPEL_RANGE) * (assembled ? REPEL_FORCE_STABLE : 0.8);
          p.vx += (mdx / mDist) * repelStrength * dt * 2;
          p.vy += (mdy / mDist) * repelStrength * dt * 2;
        }
      }

      // (No separate multiplicative damping — spring viscous damping handles it)

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check arrival (against original target — wave offset is cosmetic only)
      const distToTarget = Math.sqrt(
        (p.origTargetX - p.x) * (p.origTargetX - p.x) + (p.origTargetY - p.y) * (p.origTargetY - p.y)
      );
      if (distToTarget < ARRIVAL_THRESHOLD && !p.arrived) {
        p.arrived = true;
        p.arriveTime = timestamp;
      }

      // Pulse radius on arrival
      if (p.arrived) {
        const pulse = Math.sin(timestamp * PULSE_SPEED + p.pulsePhase) * PULSE_AMPLITUDE + 1;
        p.radius = p.baseRadius * pulse;
      } else {
        p.radius = p.baseRadius;
      }
    }

    // --- Render ---
    ctx.clearRect(0, 0, w, h);

    // Collect arrived particles (reuse array — clear then fill)
    arrivedParticles.length = 0;
    connected.length = 0;
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].arrived) arrivedParticles.push(particles[i]);
    }
    const maxConnections = Math.min(arrivedParticles.length, CONNECTION_MAX_COUNT);
    // Randomly sample via partial Fisher-Yates shuffle (avoids O(n×k) splice)
    if (arrivedParticles.length > 0) {
      const k = Math.min(maxConnections, arrivedParticles.length);
      for (let i = 0; i < k; i++) {
        const j = i + Math.floor(Math.random() * (arrivedParticles.length - i));
        [arrivedParticles[i], arrivedParticles[j]] = [arrivedParticles[j], arrivedParticles[i]];
      }
      for (let i = 0; i < k; i++) connected.push(arrivedParticles[i]);
    }
    for (let i = 0; i < connected.length; i++) {
      const a = connected[i];
      for (let j = i + 1; j < connected.length; j++) {
        const b = connected[j];

        // In stable phase, only draw connections when at least one particle is displaced
        if (assembled) {
          const aDisplaced = Math.abs(a.x - a.origTargetX) > DISPLACED_THRESHOLD || Math.abs(a.y - a.origTargetY) > DISPLACED_THRESHOLD;
          const bDisplaced = Math.abs(b.x - b.origTargetX) > DISPLACED_THRESHOLD || Math.abs(b.y - b.origTargetY) > DISPLACED_THRESHOLD;
          if (!aDisplaced && !bDisplaced) continue;
        }

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_MAX_DIST) {
          const opacity = (1 - dist / CONNECTION_MAX_DIST) * CONNECTION_OPACITY;
          // Blend colors between the two connected particles
          const avgR = Math.round((a.r + b.r) / 2);
          const avgG = Math.round((a.g + b.g) / 2);
          const avgB = Math.round((a.b + b.b) / 2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${avgR},${avgG},${avgB},${opacity})`;
          ctx.lineWidth = CONNECTION_LINE_WIDTH;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const r = p.radius;
      // Use eased assembly fraction (easeT) for smoother fade-in
      const alpha = p.arrived ? p.alpha : p.alpha * Math.min(1, easeT);

      // Glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.1})`;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.8})`;
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.4})`;
      ctx.fill();
    }
  }

  /* ---- Start ---- */

  resize();
  window.addEventListener('resize', resize);

  // Load image asynchronously — start immediately, only animate once loaded
  loadImage('assets/profile.jpg')
    .then((loadedImg) => {
      img = loadedImg;
      imgW = img.naturalWidth || img.width;
      imgH = img.naturalHeight || img.height;
      loaded = true;

      if (window.portfolio?.reducedMotion ?? false) {
        drawStaticImage();
      } else {
        initParticles();
        rafId = requestAnimationFrame(loop);
      }
    })
    .catch((err) => {
      console.error('Hero particles: failed to load image', err);
    });

  /* ---- Cleanup ---- */

  return function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    particles = [];
    img = null;
    loaded = false;
  };
}
