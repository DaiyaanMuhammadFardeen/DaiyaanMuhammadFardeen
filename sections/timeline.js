/**
 * Timeline Section — Vertical timeline with progressive drawing
 * Daiyaan Muhammad Fardeen Portfolio
 */

/* ── Timeline events data ── */
const events = [
  {
    year: '2024',
    period: 'Q4 2024 \u2014 Present',
    title: 'Thesis Research: Commit Message Transformer',
    description:
      'Building a compact Transformer from scratch in PyTorch for commit message generation. RoPE, RMSNorm, SwiGLU, DiffEmbedding, dual BPE vocabs, ROCm on AMD RX 6600.',
    tags: ['Thesis', 'PyTorch', 'NLP', 'ROCm'],
    color: '--accent-magenta',
    status: 'active',
  },
  {
    year: '2024',
    period: 'Q3 2024 \u2014 Present',
    title: 'CVTailor \u2014 Local-First AI CV Tailoring',
    description:
      'FastAPI + Ollama + pgvector system for intelligent CV tailoring against job descriptions.',
    tags: ['FastAPI', 'Python', 'vLLM', 'PostgreSQL'],
    color: '--accent-cyan',
    status: 'active',
  },
  {
    year: '2024',
    period: 'Q2 2024',
    title: 'GPU Cluster Intelligence \u2014 Hackathon',
    description:
      'Built intelligent GPU cluster orchestration with predictive failure detection, smart scheduling, cost optimization.',
    tags: ['Go', 'Rust', 'ML', 'Systems'],
    color: '--accent-amber',
    status: 'shipped',
  },
  {
    year: '2023',
    period: 'Q3\u2013Q4 2023',
    title: 'Nyon Engine \u2014 Custom 2D Game Engine',
    description:
      'Zero-to-game-engine in C++/OpenGL. Pure ECS with SoA storage, SAT+AABB+CCD physics, batch rendering.',
    tags: ['C++', 'OpenGL', 'ECS', 'Physics'],
    color: '--accent-green',
    status: 'shipped',
  },
  {
    year: '2023',
    period: 'Q1 2023',
    title: 'Raycasting Engine',
    description:
      'Wolfenstein-style raycasting engine from scratch in OpenGL/GLFW with texture database and level editor.',
    tags: ['C++', 'OpenGL', 'GLFW', 'Graphics'],
    color: '--accent-cyan',
    status: 'shipped',
  },
];

/* ── Colour helpers ── */
const accentColors = {
  '--accent-cyan': '#00e5ff',
  '--accent-magenta': '#ff00aa',
  '--accent-green': '#00ff41',
  '--accent-amber': '#ffb300',
};

/* ── Build a single timeline event element ── */
function buildEvent(evt, index) {
  const el = document.createElement('div');
  el.className = 'timeline__event';
  el.dataset.year = evt.year;

  /* Node circle */
  const node = document.createElement('div');
  node.className = 'timeline__event-node';
  const colorVal = accentColors[evt.color] || accentColors['--accent-cyan'];
  node.style.background = colorVal;
  node.style.boxShadow = `0 0 0 4px ${colorVal}22, 0 0 12px ${colorVal}44`;

  /* Content card */
  const content = document.createElement('div');
  content.className = 'timeline__event-content';

  const period = document.createElement('div');
  period.className = 'timeline__event-period';
  period.textContent = evt.period;

  const title = document.createElement('div');
  title.className = 'timeline__event-title';
  title.textContent = evt.title;

  const desc = document.createElement('div');
  desc.className = 'timeline__event-desc';
  desc.textContent = evt.description;

  const tagsRow = document.createElement('div');
  tagsRow.className = 'timeline__event-tags';
  for (const tag of evt.tags) {
    const tagEl = document.createElement('span');
    tagEl.className = 'tech-tag';
    tagEl.textContent = tag;
    tagsRow.append(tagEl);
  }

  /* Status badge */
  const statusEl = document.createElement('span');
  statusEl.className = `timeline__event-status timeline__event-status--${evt.status}`;
  statusEl.textContent =
    evt.status === 'active' ? '● active' : '◆ shipped';

  content.append(period, title, desc, tagsRow, statusEl);
  el.append(node, content);

  /* Set colour accent on content left border via style */
  content.style.borderLeft = `3px solid ${colorVal}`;

  return el;
}

/* ── Draw connection lines on canvas ── */
function drawConnectionLines(canvas, nodes, lineEl) {
  if (!canvas || !nodes.length) return;

  const section = canvas.closest('.section');
  if (!section) return;

  const rect = section.getBoundingClientRect();

  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const lineRect = lineEl.getBoundingClientRect();
  const lineLeft = lineRect.left - rect.left + lineRect.width / 2;

  /* Clear */
  ctx.clearRect(0, 0, rect.width, rect.height);

  /* Draw lines between consecutive node centres */
  const points = [];
  for (const node of nodes) {
    const nodeRect = node.getBoundingClientRect();
    const cx = lineLeft;
    const cy = nodeRect.top - rect.top + nodeRect.height / 2;
    points.push({ x: cx, y: cy });
  }

  if (points.length < 2) return;

  ctx.strokeStyle = '#00e5ff44';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

/* ── Progressive line drawing ── */
function updateTimelineLine(lineEl, section) {
  if (!lineEl || !section) return;

  const sectionRect = section.getBoundingClientRect();
  const viewportH = window.innerHeight;

  /* How far the section has scrolled through the viewport */
  const sectionTop = sectionRect.top;
  const sectionHeight = sectionRect.height;
  const scrollable = sectionHeight + viewportH;
  const scrolled = viewportH - sectionTop;

  let progress = Math.min(Math.max(scrolled / scrollable, 0), 1);
  /* Start drawing a bit earlier */
  progress = Math.min(Math.max((scrolled - 80) / scrollable, 0), 1);

  lineEl.style.transform = `scaleY(${progress})`;
}

/* ── Main init ── */
export function initTimeline() {
  const container = document.getElementById('timeline-events');
  const lineEl = document.getElementById('timeline-line');
  const canvas = document.getElementById('timeline-canvas');
  const section = document.getElementById('timeline');

  if (!container || !lineEl || !section) return;

  /* Render events */
  const frag = document.createDocumentFragment();
  for (let i = 0; i < events.length; i++) {
    frag.append(buildEvent(events[i], i));
  }
  container.append(frag);

  /* Re-query event elements */
  const eventEls = container.querySelectorAll('.timeline__event');
  const nodeEls = [];

  for (const evt of eventEls) {
    nodeEls.push(evt.querySelector('.timeline__event-node'));
  }

  /* ── Scroll-driven line drawing ── */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateTimelineLine(lineEl, section);
        drawConnectionLines(canvas, nodeEls, lineEl);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  /* Run once on init */
  onScroll();

  /* ── IntersectionObserver for event reveal ── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          /* Find the index among timeline events */
          const idx = Array.from(eventEls).indexOf(entry.target);
          /* Animate line first (400ms), then card (500ms) */
          const lineDelay = 100;
          const cardDelay = lineDelay + 400;

          setTimeout(() => {
            lineEl.classList.add('timeline__line--drawn');
          }, lineDelay);

          setTimeout(() => {
            entry.target.classList.add('timeline__event--visible');
          }, cardDelay);

          revealObserver.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -30% 0px' }
  );

  for (const evt of eventEls) {
    revealObserver.observe(evt);
  }

  /* ── Resize handler for canvas ── */
  const resizeObserver = new ResizeObserver(() => {
    drawConnectionLines(canvas, nodeEls, lineEl);
    updateTimelineLine(lineEl, section);
  });
  resizeObserver.observe(section);

  return () => {
    window.removeEventListener('scroll', onScroll);
    revealObserver.disconnect();
    resizeObserver.disconnect();
  };
}
