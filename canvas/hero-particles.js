/**
 * Hero Particles — canvas/hero-particles.js
 * Combined text + image particle system.
 *
 * One full-viewport canvas with two zones:
 *   Desktop: text particles (LEFT half), image particles (RIGHT half)
 *   Mobile:  text particles (TOP half),  image particles (BOTTOM half)
 *
 * Lifecycle: assembly (spring convergence) → settle (gradual slowdown)
 *            → mouse interaction (repulsion only, no spring recovery).
 *
 * Text lines: BUILDING (cyan), THINKING (magenta), VIBING (green)
 * Image:      assets/profile.jpg pixel-sampled particles
 *
 * Global: window.portfolio = { mouse: {x, y}, reducedMotion }
 *
 * @param {HTMLCanvasElement} canvas
 */

// ---- Text lines ----
const TEXT_LINES = [
  { text: 'BUILDING', color: 'cyan',    fontSize: 160 },
  { text: 'THINKING', color: 'magenta', fontSize: 160 },
  { text: 'VIBING',   color: 'green',   fontSize: 160 },
];

// ---- Sampling ----
const DESKTOP_TEXT_STEP  = 12;
const MOBILE_TEXT_STEP   = 12;
const DESKTOP_IMAGE_STEP = 15;
const MOBILE_IMAGE_STEP  = 20;
const MOBILE_BREAKPOINT  = 768;
const IMAGE_SCALE        = 0.85;
const IMAGE_PATH         = 'assets/profile.jpg';

// Assembly
const SPREAD_FACTOR    = 1.8;
const ASSEMBLY_FRAMES  = 120;   // frames at 60 fps → ~2 s
const SPRING_K         = 0.05;  // spring stiffness (position-error multiplier)
const SPRING_DAMP      = 0.85;  // velocity damping per 16 ms frame (NOT scaled by dt)

// Settle phase
const SETTLE_DAMP      = 0.93;  // velocity bleed per 16 ms frame
const REPEL_FORCE      = 80;    // mouse repulsion impulse magnitude (px/s²)
const VELOCITY_EPSILON = 0.01;

// Mouse
const REPEL_RANGE          = 40;  // px
const REPULSION_EVERY_N    = 2;    // apply mouse repulsion every N frames

// Visual
const CONNECTION_MAX_DIST  = 50;
const CONNECTION_OPACITY   = 0.12;
const CONNECTION_LINE_WIDTH = 0.5;
const CONNECTION_MAX_COUNT = 50;
const ARRIVAL_THRESHOLD    = 2;
const PULSE_SPEED          = 0.003;
const PULSE_AMPLITUDE      = 0.4;
const DISPLACED_THRESHOLD  = 3;

// Particle rendering
const BASE_RADIUS_MIN    = 1;
const BASE_RADIUS_MAX    = 2.5;
const GLOW_RING_OFFSET   = 2;
const GLOW_ALPHA         = 0.1;
const CORE_ALPHA         = 0.8;
const CENTER_ALPHA       = 0.4;
const CENTER_RADIUS_RATIO = 0.4;
const STAGGER_DELAY_MAX  = 1000;

// ---- Color helpers ----
const COLORS = {
  cyan:    () => getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim()    || '#00e5ff',
  magenta: () => getComputedStyle(document.documentElement).getPropertyValue('--accent-magenta').trim() || '#ff00aa',
  green:   () => getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim()   || '#00ff41',
};

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,229,255,${alpha})`;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// ---- Image loading ----
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load: ' + src));
    img.src = src;
  });
}

// ---- Text pixel sampling ----
// FIX: measure actual rendered line heights per-browser using measureText metrics,
//      then centre the whole text block vertically.
function sampleTextLines(textRegionW, textRegionH, isMobile) {
  const step  = isMobile ? MOBILE_TEXT_STEP : DESKTOP_TEXT_STEP;
  const scale = 2;   // supersample for sharper edges
  const cW    = Math.round(textRegionW * scale);
  const cH    = Math.round(textRegionH * scale);

  const offCanvas = document.createElement('canvas');
  offCanvas.width  = cW;
  offCanvas.height = cH;
  const octx = offCanvas.getContext('2d');
  if (!octx) return [];

  octx.fillStyle = '#000';
  octx.fillRect(0, 0, cW, cH);

  // --- Pass 1: measure each line's actual font size after clamping to maxW ---
  const maxW   = cW * 0.9;
  const lineMeta = TEXT_LINES.map((line) => {
    let size = line.fontSize * scale;
    octx.font = `bold ${size}px "Space Grotesk", "DM Sans", sans-serif`;
    const mw = octx.measureText(line.text).width;
    if (mw > maxW) size = size * (maxW / mw);
    octx.font = `bold ${size}px "Space Grotesk", "DM Sans", sans-serif`;
    const m   = octx.measureText(line.text);
    // Use ascent + descent for the true rendered height
    const lineH = (m.actualBoundingBoxAscent  ?? size * 0.8) +
                  (m.actualBoundingBoxDescent ?? size * 0.2);
    return { size, lineH };
  });

  // --- Total block height + equal gaps ---
  const totalH    = lineMeta.reduce((s, l) => s + l.lineH, 0);
  const GAP_RATIO = 0.25;                               // gap as fraction of line height
  const gaps      = lineMeta.reduce((s, l) => s + l.lineH * GAP_RATIO, 0);
  const blockH    = totalH + gaps;
  // Centre the block vertically
  let currentY    = (cH - blockH) / 2;

  // --- Pass 2: draw ---
  octx.textBaseline = 'top';
  octx.textAlign    = 'center';

  TEXT_LINES.forEach((line, li) => {
    const { size, lineH } = lineMeta[li];
    octx.font      = `bold ${size}px "Space Grotesk", "DM Sans", sans-serif`;
    octx.fillStyle = '#fff';
    octx.fillText(line.text, cW / 2, currentY);
    currentY += lineH + lineH * GAP_RATIO;
  });

  // --- Pass 3: sample bright pixels ---
  const imageData = octx.getImageData(0, 0, cW, cH);
  const data      = imageData.data;
  const samples   = [];

  // Rebuild line Y-ranges at same scale for colour attribution
  const lineRanges = [];
  {
    let cy = (cH - blockH) / 2;
    lineMeta.forEach((lm, li) => {
      lineRanges.push({ y0: cy, y1: cy + lm.lineH, colorName: TEXT_LINES[li].color });
      cy += lm.lineH + lm.lineH * GAP_RATIO;
    });
  }

  for (let y = 0; y < cH; y += step * scale) {
    for (let x = 0; x < cW; x += step * scale) {
      const idx = (y * cW + x) * 4;
      if (data[idx] > 128) {
        // Which line does this y belong to?
        let colorName = TEXT_LINES[0].color;
        for (let li = 0; li < lineRanges.length; li++) {
          if (y >= lineRanges[li].y0 && y < lineRanges[li].y1) {
            colorName = lineRanges[li].colorName;
            break;
          }
          // If between lines, attribute to nearest
          colorName = lineRanges[li].colorName;
        }
        samples.push({
          relX: x / scale,
          relY: y / scale,
          colorName,
        });
      }
    }
  }

  return samples;
}

// ---- Image pixel sampling ----
function sampleImagePixels(img, step) {
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  const offCanvas = document.createElement('canvas');
  offCanvas.width  = imgW;
  offCanvas.height = imgH;
  const octx = offCanvas.getContext('2d');
  octx.drawImage(img, 0, 0);

  let data;
  try {
    const imageData = octx.getImageData(0, 0, imgW, imgH);
    data = imageData.data;
  } catch {
    // Chrome blocks getImageData on canvas with file:// images (CORS taint).
    return { samples: [], imgW, imgH };
  }

  const samples = [];
  for (let y = 0; y < imgH; y += step) {
    for (let x = 0; x < imgW; x += step) {
      const idx = (y * imgW + x) * 4;
      if (data[idx + 3] > 128) {
        samples.push({
          relX: x,
          relY: y,
          r:    data[idx],
          g:    data[idx + 1],
          b:    data[idx + 2],
        });
      }
    }
  }
  return { samples, imgW, imgH };
}

// ---- Layout helpers ----
function calcImageLayout(regionW, regionH, imgW, imgH) {
  const imgAspect    = imgW / imgH;
  const regionAspect = regionW / regionH;
  let displayW, displayH;
  if (imgAspect > regionAspect) {
    displayW = regionW * IMAGE_SCALE;
    displayH = displayW / imgAspect;
  } else {
    displayH = regionH * IMAGE_SCALE;
    displayW = displayH * imgAspect;
  }
  return {
    displayW,
    displayH,
    offsetX: (regionW - displayW) / 2,
    offsetY: (regionH - displayH) / 2,
  };
}

function getRegions(w, h) {
  const isMobile = w < MOBILE_BREAKPOINT;
  if (isMobile) {
    return {
      textRegion:  { x: 0,     y: 0,     w, h: h / 2 },
      imageRegion: { x: 0,     y: h / 2, w, h: h / 2 },
      isMobile:    true,
    };
  }
  return {
    textRegion:  { x: 0,     y: 0, w: w / 2, h },
    imageRegion: { x: w / 2, y: 0, w: w / 2, h },
    isMobile:    false,
  };
}

// ---- Particle factories ----
function createTextParticle(sample, region) {
  const spread  = Math.max(region.w, region.h) * SPREAD_FACTOR;
  const centerX = region.x + region.w / 2;
  const centerY = region.y + region.h / 2;
  return {
    type:         'text',
    x:            (Math.random() - 0.5) * spread + centerX,
    y:            (Math.random() - 0.5) * spread + centerY,
    targetX:      region.x + sample.relX,
    targetY:      region.y + sample.relY,
    origTargetX:  region.x + sample.relX,
    origTargetY:  region.y + sample.relY,
    vx:           0,
    vy:           0,
    colorName:    sample.colorName,
    r: 0, g: 0, b: 0,
    baseRadius:   randomBetween(BASE_RADIUS_MIN, BASE_RADIUS_MAX),
    radius:       randomBetween(BASE_RADIUS_MIN, BASE_RADIUS_MAX),
    alpha:        randomBetween(0.5, 1),
    pulsePhase:   Math.random() * Math.PI * 2,
    arrived:      false,
    arriveTime:   0,
    staggerDelay: Math.random() * STAGGER_DELAY_MAX,
  };
}

function createImageParticle(sample, region, layout, imgW, imgH) {
  const spread  = Math.max(region.w, region.h) * SPREAD_FACTOR;
  const centerX = region.x + region.w / 2;
  const centerY = region.y + region.h / 2;
  const tx = region.x + layout.offsetX + (sample.relX / imgW) * layout.displayW;
  const ty = region.y + layout.offsetY + (sample.relY / imgH) * layout.displayH;
  return {
    type:         'image',
    x:            (Math.random() - 0.5) * spread + centerX,
    y:            (Math.random() - 0.5) * spread + centerY,
    targetX:      tx,
    targetY:      ty,
    origTargetX:  tx,
    origTargetY:  ty,
    vx:           0,
    vy:           0,
    r:            sample.r,
    g:            sample.g,
    b:            sample.b,
    colorName:    '',
    baseRadius:   randomBetween(BASE_RADIUS_MIN, BASE_RADIUS_MAX),
    radius:       randomBetween(BASE_RADIUS_MIN, BASE_RADIUS_MAX),
    alpha:        randomBetween(0.5, 1),
    pulsePhase:   Math.random() * Math.PI * 2,
    arrived:      false,
    arriveTime:   0,
    staggerDelay: Math.random() * STAGGER_DELAY_MAX,
  };
}

// ---- Main export ----
export function initHeroParticles(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h;
  let particles     = [];
  let textSamples   = [];
  let imageSamples  = [];
  let imgRef        = null;
  let imgW          = 0;
  let imgH          = 0;
  let lastTime      = 0;
  let rafId         = null;
  let assemblyFraction = 0;
  let frameCount    = 0;
  let loaded        = false;
  let startTime     = 0;          // ms timestamp when animation actually began
  let imageLoaded   = false;

  // Mouse tracking — canvas-local CSS pixel coordinates.
  // We own this entirely; no dependency on window.portfolio.mouse format.
  let mouseX = -9999;
  let mouseY = -9999;
  let mouseInside = false;

  function onMouseMove(e) {
    const r  = canvas.getBoundingClientRect();
    mouseX   = e.clientX - r.left;
    mouseY   = e.clientY - r.top;
    mouseInside = true;
  }
  function onMouseLeave() {
    mouseInside = false;
  }
  function onTouchMove(e) {
    if (e.touches.length === 0) return;
    const r  = canvas.getBoundingClientRect();
    mouseX   = e.touches[0].clientX - r.left;
    mouseY   = e.touches[0].clientY - r.top;
    mouseInside = true;
  }
  function onTouchEnd() {
    // Let the last touch position linger briefly so particles don't snap back instantly
    setTimeout(() => { mouseInside = false; }, 300);
  }

  window.addEventListener('mousemove',  onMouseMove,  { passive: true });
  canvas.addEventListener('mouseleave', onMouseLeave, { passive: true });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: true });
  canvas.addEventListener('touchend',   onTouchEnd,   { passive: true });

  // Reusable per-frame arrays (avoids GC churn)
  const textArrived  = [];
  const imageArrived = [];

  // ---- Resize ----
  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    w = rect.width;
    h = rect.height;

    // FIX: clamp DPR to 2 to avoid extreme canvas sizes on high-density screens.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width        = Math.round(w * dpr);
    canvas.height       = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!window.portfolio) window.portfolio = {};
    const nowMobile = w < MOBILE_BREAKPOINT;
    const wasMobile = window.portfolio.isMobile;
    window.portfolio.isMobile = nowMobile;

    if (window.portfolio?.reducedMotion) {
      drawStaticContent();
      return;
    }

    // Re-init on breakpoint crossing only
    if (loaded && wasMobile !== undefined && wasMobile !== nowMobile) {
      initParticles();
      return;
    }

    // Otherwise just recalc target positions
    if (loaded && particles.length > 0) {
      recalcTargets();
    }
  }

  // ---- Init particles ----
  function initParticles() {
    const regions = getRegions(w, h);

    // Text
    textSamples = sampleTextLines(regions.textRegion.w, regions.textRegion.h, regions.isMobile);
    const textParticles = textSamples.map((s) => createTextParticle(s, regions.textRegion));

    // Image
    let allParticles = textParticles;
    if (imageLoaded && imgRef) {
      const imgStep = regions.isMobile ? MOBILE_IMAGE_STEP : DESKTOP_IMAGE_STEP;
      const result  = sampleImagePixels(imgRef, imgStep);
      if (result.samples.length > 0) {
        imageSamples = result.samples;
        imgW = result.imgW;
        imgH = result.imgH;
        const layout        = calcImageLayout(regions.imageRegion.w, regions.imageRegion.h, imgW, imgH);
        const imageParticles = imageSamples.map((s) =>
          createImageParticle(s, regions.imageRegion, layout, imgW, imgH)
        );
        allParticles = textParticles.concat(imageParticles);
      } else {
        // CORS taint — text only
        imageLoaded = false;
      }
    }

    particles        = allParticles;
    assemblyFraction = 0;
    startTime        = 0;   // will be set on first loop tick
    loaded           = true;
  }

  // ---- Recalc targets on resize ----
  function recalcTargets() {
    if (!loaded) return;
    const regions = getRegions(w, h);

    // Text particles
    for (let i = 0; i < textSamples.length && i < particles.length; i++) {
      const p = particles[i];
      const s = textSamples[i];
      if (!p || !s) continue;
      p.targetX     = regions.textRegion.x + s.relX;
      p.targetY     = regions.textRegion.y + s.relY;
      p.origTargetX = p.targetX;
      p.origTargetY = p.targetY;
    }

    // Image particles
    if (imageLoaded && imgRef) {
      const layout = calcImageLayout(regions.imageRegion.w, regions.imageRegion.h, imgW, imgH);
      const offset = textSamples.length;
      for (let i = 0; i < imageSamples.length; i++) {
        const p = particles[offset + i];
        const s = imageSamples[i];
        if (!p || !s) continue;
        const tx = regions.imageRegion.x + layout.offsetX + (s.relX / imgW) * layout.displayW;
        const ty = regions.imageRegion.y + layout.offsetY + (s.relY / imgH) * layout.displayH;
        p.targetX     = tx;
        p.targetY     = ty;
        p.origTargetX = tx;
        p.origTargetY = ty;
      }
    }
  }

  // ---- Static / reduced-motion render ----
  function drawStaticContent() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const regions = getRegions(w, h);

    // Re-use the same vertical-centring logic as the particle sampler
    const scale = 2;
    const cW    = Math.round(regions.textRegion.w * scale);
    const cH    = Math.round(regions.textRegion.h * scale);

    const offCanvas = document.createElement('canvas');
    offCanvas.width  = cW;
    offCanvas.height = cH;
    const octx = offCanvas.getContext('2d');
    octx.textBaseline = 'top';
    octx.textAlign    = 'center';

    const maxW = cW * 0.9;
    const lineMeta = TEXT_LINES.map((line) => {
      let size = line.fontSize * scale;
      octx.font = `bold ${size}px "Space Grotesk", "DM Sans", sans-serif`;
      const mw  = octx.measureText(line.text).width;
      if (mw > maxW) size = size * (maxW / mw);
      octx.font = `bold ${size}px "Space Grotesk", "DM Sans", sans-serif`;
      const m   = octx.measureText(line.text);
      const lineH = (m.actualBoundingBoxAscent  ?? size * 0.8) +
                    (m.actualBoundingBoxDescent ?? size * 0.2);
      return { size, lineH, color: line.color, text: line.text };
    });

    const totalH = lineMeta.reduce((s, l) => s + l.lineH, 0);
    const gaps   = lineMeta.reduce((s, l) => s + l.lineH * 0.25, 0);
    let cy       = (cH - totalH - gaps) / 2;

    lineMeta.forEach((lm) => {
      const hex = COLORS[lm.color]();
      octx.font        = `bold ${lm.size}px "Space Grotesk", "DM Sans", sans-serif`;
      octx.shadowColor = hex;
      octx.shadowBlur  = 30;
      octx.fillStyle   = hexToRgba(hex, 0.15);
      octx.fillText(lm.text, cW / 2, cy);
      octx.shadowBlur  = 0;
      octx.fillStyle   = hexToRgba(hex, 0.6);
      octx.fillText(lm.text, cW / 2, cy);
      cy += lm.lineH + lm.lineH * 0.25;
    });

    ctx.drawImage(offCanvas, regions.textRegion.x, regions.textRegion.y,
                             regions.textRegion.w,  regions.textRegion.h);

    if (imgRef) {
      const layout = calcImageLayout(regions.imageRegion.w, regions.imageRegion.h, imgW, imgH);
      ctx.drawImage(imgRef,
        regions.imageRegion.x + layout.offsetX,
        regions.imageRegion.y + layout.offsetY,
        layout.displayW, layout.displayH
      );
    }
  }

  // ---- Connection drawing (called per-frame) ----
  // FIX: stopped shuffling every frame — flickered wildly.
  // Instead, choose a stable MAX_COUNT window per-type at init/arrive time
  // and redraw from that stable set. Here we iterate sequentially (first N).
  function drawConnections(arr, settled) {
    const len = Math.min(arr.length, CONNECTION_MAX_COUNT);
    for (let i = 0; i < len; i++) {
      const a = arr[i];
      for (let j = i + 1; j < len; j++) {
        const b = arr[j];

        // Only draw when at least one particle is displaced
        if (settled) {
          const aDisp = Math.abs(a.x - a.origTargetX) > DISPLACED_THRESHOLD ||
                        Math.abs(a.y - a.origTargetY) > DISPLACED_THRESHOLD;
          const bDisp = Math.abs(b.x - b.origTargetX) > DISPLACED_THRESHOLD ||
                        Math.abs(b.y - b.origTargetY) > DISPLACED_THRESHOLD;
          if (!aDisp && !bDisp) continue;
        }

        const dx   = a.x - b.x;
        const dy   = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= CONNECTION_MAX_DIST) continue;

        const opacity = (1 - dist / CONNECTION_MAX_DIST) * CONNECTION_OPACITY;
        let strokeColor;
        if (a.type === 'text') {
          const hex = a.colorName ? COLORS[a.colorName]?.() : '#00e5ff';
          strokeColor = hexToRgba(hex, opacity);
        } else {
          const avgR = (a.r + b.r) >> 1;
          const avgG = (a.g + b.g) >> 1;
          const avgB = (a.b + b.b) >> 1;
          strokeColor = `rgba(${avgR},${avgG},${avgB},${opacity})`;
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle  = strokeColor;
        ctx.lineWidth    = CONNECTION_LINE_WIDTH;
        ctx.stroke();
      }
    }
  }

  // ---- Animation loop ----
  function loop(timestamp) {
    rafId = requestAnimationFrame(loop);

    if (window.portfolio?.reducedMotion ?? false) {
      drawStaticContent();
      return;
    }

    // Pause when hero is off-screen
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    }

    if (!loaded || particles.length === 0) return;

    // FIX: cap dt to a maximum of 2 normalised frames to prevent explosion
    // after tab-switch, DevTools open, or slow first paint.
    // Using 1 on the very first tick (lastTime === 0) is correct —
    // but we also reset lastTime when startTime resets so the cap applies cleanly.
    const rawDt = lastTime ? (timestamp - lastTime) / 16.667 : 1;
    const dt    = Math.min(rawDt, 2);          // hard cap: never more than 2× speed
    lastTime    = timestamp;

    // Latch start time
    if (startTime === 0) startTime = timestamp;

    // Advance assembly counter frame-by-frame (dt-scaled for fair timing)
    if (assemblyFraction < 1) {
      assemblyFraction = Math.min(1, assemblyFraction + dt / ASSEMBLY_FRAMES);
    }
    const settled = assemblyFraction >= 1;

    // Mouse — use canvas-local coordinates captured by our own listeners.
    frameCount++;
    const doMouseRepel      = (frameCount % REPULSION_EVERY_N) === 0;
    const mx                = mouseX;
    const my                = mouseY;
    const mouseInsideCanvas = mouseInside;

    // Ease curve for assembly alpha
    const easeT = assemblyFraction < 0.5
      ? 2 * assemblyFraction * assemblyFraction
      : 1 - Math.pow(-2 * assemblyFraction + 2, 2) / 2;

    // ---- Update ----
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Stagger: skip until particle's personal delay has elapsed
      const elapsed = timestamp - startTime;
      if (elapsed < p.staggerDelay) continue;

      if (settled) {
        // ---- Settle phase — damping-only, no spring recovery ----

        // FIX: mouse repulsion now actually works.
        // Previous code had REPULSION_THROTTLE = 0.3 and checked
        // `frameCount === 0` after `frameCount % 0.3`, which is always a float,
        // so repulsion was NEVER applied.
        if (mouseInsideCanvas && doMouseRepel) {
          const mdx  = p.x - mx;
          const mdy  = p.y - my;
          const mDist2 = mdx * mdx + mdy * mdy;
          if (mDist2 < REPEL_RANGE * REPEL_RANGE && mDist2 > 0) {
            const mDist = Math.sqrt(mDist2);
            const strength = (1 - mDist / REPEL_RANGE) * REPEL_FORCE;
            p.vx += (mdx / mDist) * strength * dt;
            p.vy += (mdy / mDist) * strength * dt;
          }
        }

        // FIX: apply damping correctly as a per-frame exponent so it's
        // frame-rate independent without accumulating non-linearly.
        const dampFactor = Math.pow(SETTLE_DAMP, dt);
        p.vx *= dampFactor;
        p.vy *= dampFactor;
        if (Math.abs(p.vx) < VELOCITY_EPSILON) p.vx = 0;
        if (Math.abs(p.vy) < VELOCITY_EPSILON) p.vy = 0;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

      } else {
        // ---- Assembly phase — spring convergence ----
        // FIX: separate the spring force (position-only) from the damping
        // (velocity-only).  Original code baked DAMP_K_FAST into the acceleration
        // *and* multiplied both by dt, causing explosive growth when dt > 1.
        //
        // Correct semi-implicit Euler for a damped spring:
        //   accel  = k * (target - pos)          [spring; no dt multiply here]
        //   vel   += accel * dt                  [integrate velocity]
        //   vel   *= damp^dt                     [apply damping after integration]
        //   pos   += vel * dt                    [integrate position]
        const dx    = p.targetX - p.x;
        const dy    = p.targetY - p.y;
        p.vx += dx * SPRING_K * dt;
        p.vy += dy * SPRING_K * dt;
        const dampF = Math.pow(SPRING_DAMP, dt);
        p.vx *= dampF;
        p.vy *= dampF;
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;
      }

      // Arrival detection
      const ddx = p.origTargetX - p.x;
      const ddy = p.origTargetY - p.y;
      if (!p.arrived && ddx * ddx + ddy * ddy < ARRIVAL_THRESHOLD * ARRIVAL_THRESHOLD) {
        p.arrived    = true;
        p.arriveTime = timestamp;
      }

      // Pulse radius when settled at target
      if (p.arrived) {
        const pulse = Math.sin(timestamp * PULSE_SPEED + p.pulsePhase) * PULSE_AMPLITUDE + 1;
        p.radius = p.baseRadius * pulse;
      } else {
        p.radius = p.baseRadius;
      }
    }

    // ---- Render ----
    ctx.clearRect(0, 0, w, h);

    // Collect arrived particles by type
    textArrived.length  = 0;
    imageArrived.length = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.arrived) {
        if (p.type === 'text') textArrived.push(p);
        else                   imageArrived.push(p);
      }
    }

    drawConnections(textArrived,  settled);
    drawConnections(imageArrived, settled);

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p     = particles[i];
      const r     = p.radius;
      const alpha = p.arrived ? p.alpha : p.alpha * Math.min(1, easeT);

      // Build rgba factory for this particle
      let rgba;
      if (p.type === 'text') {
        const hex = p.colorName ? (COLORS[p.colorName]?.() ?? '#00e5ff') : '#00e5ff';
        rgba = (a) => hexToRgba(hex, a);
      } else {
        const col = `rgba(${p.r},${p.g},${p.b},`;
        rgba = (a) => col + a + ')';
      }

      // Glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + GLOW_RING_OFFSET, 0, Math.PI * 2);
      ctx.fillStyle = rgba(alpha * GLOW_ALPHA);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(alpha * CORE_ALPHA);
      ctx.fill();

      // Bright centre
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * CENTER_RADIUS_RATIO, 0, Math.PI * 2);
      ctx.fillStyle = rgba(alpha * CENTER_ALPHA);
      ctx.fill();
    }
  }

  // ---- Bootstrap ----
  resize();
  window.addEventListener('resize', resize);

  if (window.portfolio?.reducedMotion ?? false) {
    drawStaticContent();
  } else {
    // Start RAF immediately; particles are added once image resolves
    rafId = requestAnimationFrame(loop);

    loadImage(IMAGE_PATH)
      .then((img) => {
        imgRef      = img;
        imgW        = img.naturalWidth;
        imgH        = img.naturalHeight;
        imageLoaded = true;
        initParticles();
        if (window.portfolio?.reducedMotion) drawStaticContent();
      })
      .catch(() => {
        // Image failed — render text particles only
        imageLoaded = false;
        initParticles();
      });

    // If image hasn't resolved within 500 ms, start text particles immediately.
    // initParticles() will be called again (harmlessly) when the image loads.
    setTimeout(() => { if (!loaded) initParticles(); }, 500);
  }

  // ---- Teardown ----
  return function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    canvas.removeEventListener('touchmove',  onTouchMove);
    canvas.removeEventListener('touchend',   onTouchEnd);
    particles    = [];
    textSamples  = [];
    imageSamples = [];
    imgRef       = null;
    loaded       = false;
  };
}
