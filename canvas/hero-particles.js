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

const DESKTOP_STEP = 14; // ~3K particles for 719×1280 image
const MOBILE_STEP = 19;  // ~1.6K particles

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
  // Scale image to fit canvas with 85% padding, maintaining aspect ratio
  const scaleX = (canvasW * 0.85) / imgW;
  const scaleY = (canvasH * 0.85) / imgH;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (canvasW - imgW * scale) / 2;
  const offsetY = (canvasH - imgH * scale) / 2;

  const spread = Math.max(canvasW, canvasH) * 0.6;
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
  let img = null;
  let imgW = 0;
  let imgH = 0;
  let samples = [];
  let lastTime = 0;
  let rafId = null;
  let assemblyFraction = 0;
  let initialised = false;
  let frameCount = 0;
  let loaded = false;

  const waveSpeed = 0.002;

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
    window.portfolio.isMobile = w < 768;

    // Redraw static image on resize for reduced motion
    if (loaded && portfolio.reducedMotion) {
      drawStaticImage();
    }

    // Recalc particle targets on resize (scale/offset change with canvas size)
    if (loaded && particles.length > 0) {
      recalcTargets();
    }
  }

  /* ---- Particle initialisation ---- */

  function initParticles() {
    const step = w < 768 ? MOBILE_STEP : DESKTOP_STEP;
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
    const scaleX = (w * 0.85) / imgW;
    const scaleY = (h * 0.85) / imgH;
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

    const scaleX = (w * 0.85) / imgW;
    const scaleY = (h * 0.85) / imgH;
    const scale = Math.min(scaleX, scaleY);
    const dw = imgW * scale;
    const dh = imgH * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---- Animation loop ---- */

  function loop(timestamp) {
    if (portfolio.reducedMotion) {
      drawStaticImage();
      return;
    }

    // Pause rendering when hero section is not in viewport
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        rafId = requestAnimationFrame(loop);
        return;
      }
    }

    // If image not yet loaded, skip frame
    if (!loaded || particles.length === 0) {
      rafId = requestAnimationFrame(loop);
      return;
    }

    const dt = lastTime ? Math.min((timestamp - lastTime) / 16.667, 3) : 1;
    lastTime = timestamp;

    // Advance assembly over ~2 seconds (120 frames at 60fps)
    if (assemblyFraction < 1) {
      assemblyFraction = Math.min(1, assemblyFraction + dt / 120);
    }

    frameCount++;

    // Viewport-relative → canvas-relative pixel coordinates
    const rect = canvas.getBoundingClientRect();
    const mx = (portfolio.mouse.x * window.innerWidth) - rect.left;
    const my = (portfolio.mouse.y * window.innerHeight) - rect.top;
    const mouseActive = mx >= 0 && my >= 0 && mx <= rect.width && my <= rect.height;

    // Throttle mouse repulsion: only recalc every 3 frames
    const recalcRepulsion = frameCount % 3 === 0;

    // Spring force: (target-pos)*0.05 - vel*0.85
    const springK = 0.05;
    const dampK = 0.85;
    const repelRange = 100;
    const repelForce = 0.8;
    const time = timestamp || 0;

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Wave/flow offset — sinusoidal displacement from original target
      const waveOffsetX = Math.sin(time * waveSpeed + p.wavePhase) * p.waveAmplitude;
      const waveOffsetY = Math.cos(time * waveSpeed + p.wavePhase) * p.waveAmplitude;
      p.targetX = p.origTargetX + waveOffsetX;
      p.targetY = p.origTargetY + waveOffsetY;

      // Target position with assembly interpolation (ease-out quad)
      const easeT = assemblyFraction < 0.5
        ? 2 * assemblyFraction * assemblyFraction
        : 1 - Math.pow(-2 * assemblyFraction + 2, 2) / 2;

      // Spring physics: drift toward target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const ax = dx * springK - p.vx * dampK;
      const ay = dy * springK - p.vy * dampK;

      p.vx += ax * dt;
      p.vy += ay * dt;

      // Mouse repulsion (throttled to every 3 frames)
      if (mouseActive && recalcRepulsion) {
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

    // Draw faint connections between randomly selected arrived particles
    const arrivedParticles = [];
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].arrived) arrivedParticles.push(particles[i]);
    }
    const maxConnections = Math.min(arrivedParticles.length, 50);
    // Randomly sample for distributed connections (avoids first-N bias)
    const connected = [];
    if (arrivedParticles.length > 0) {
      const pool = [...arrivedParticles];
      for (let i = 0; i < maxConnections; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        connected.push(pool[idx]);
        pool.splice(idx, 1);
      }
    }
    for (let i = 0; i < connected.length; i++) {
      const a = arrivedParticles[i];
      for (let j = i + 1; j < connected.length; j++) {
        const b = connected[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 60;
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.12;
          // Blend colors between the two connected particles
          const avgR = Math.round((a.r + b.r) / 2);
          const avgG = Math.round((a.g + b.g) / 2);
          const avgB = Math.round((a.b + b.b) / 2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${avgR},${avgG},${avgB},${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const r = p.radius;
      const alpha = p.arrived ? p.alpha : p.alpha * Math.min(1, assemblyFraction * 2);

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

    rafId = requestAnimationFrame(loop);
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

      if (portfolio.reducedMotion) {
        drawStaticImage();
      } else {
        initParticles();
        initialised = true;
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
    initialised = false;
  };
}
