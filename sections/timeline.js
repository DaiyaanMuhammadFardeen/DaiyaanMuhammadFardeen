/**
 * Timeline Section — Vertical timeline with progressive drawing
 * Daiyaan Muhammad Fardeen Portfolio
 */

/* ── Timeline events data ── */
const events = [
  {
    year: '2026',
    period: 'Jul 2026 — Present',
    title: 'Domio — Figma/Canva-grade Presentation Platform',
    description:
      'Polyglot full-stack deck platform. Next.js 15 + React 19 frontend, TypeScript/Hono/Node 22 control plane, Go realtime gateway, Rust hot paths, Python AI workers. Storage: PostgreSQL 16 + ClickHouse + Redis 7 + NATS JetStream. Programmable agents via MCP. Currently on Phase 17/18.',
    tags: ['Next.js', 'React', 'TypeScript', 'Hono', 'Go', 'PostgreSQL', 'ClickHouse', 'Redis', 'NATS'],
    color: '--accent-cyan',
    status: 'active',
  },
  {
    year: '2026',
    period: 'May 2026 — Jul 2026',
    title: 'CVTailor — AI-Powered CV Tailoring Platform',
    description:
      'Self-hosted AI CV tailoring engine. FastAPI core, Next.js 16 dashboard. Llama 3.1 via Ollama, NuExtract, pgvector similarity search over 14k+ skill embeddings. Celery async queue with SSE streaming. Multi-agent pipeline: JD parsing, skill resolution, bullet improvement, composite ATS scoring.',
    tags: ['FastAPI', 'Next.js', 'Ollama', 'pgvector', 'Celery', 'SSE'],
    color: '--accent-green',
    status: 'shipped',
  },
  {
    year: '2026',
    period: 'Jun 2026',
    title: 'vibecost — LLM Cost Simulator',
    description:
      'CLI tool simulating AI coding-agent token consumption and costs. Prompt Prediction Engine, 15 model support across OpenAI/Anthropic/Google/DeepSeek/Meta. Reasoning tokens, prompt caching analysis, context pressure bars, multi-turn agent loops, CI/CD enforcement.',
    tags: ['Python', 'CLI', 'Tiktoken', 'LLM'],
    color: '--accent-magenta',
    status: 'shipped',
  },
  {
    year: '2026',
    period: 'Mar 2026 — May 2026',
    title: 'FundMyIdea BD — Crowdfunding for Student Entrepreneurs',
    description:
      'Full-stack crowdfunding platform with Node.js/Express/MongoDB. Drag-and-drop campaign page builder, WebSocket real-time donation tracking, AI-powered campaign recommendations, analytics dashboard. bKash/Nagad integration, JWT auth, CSRF protection.',
    tags: ['Node.js', 'Express', 'MongoDB', 'WebSocket', 'JWT'],
    color: '--accent-amber',
    status: 'shipped',
  },
  {
    year: '2026',
    period: 'Jan 2026 — Mar 2026',
    title: 'Nyon Engine — Custom 2D Game Engine',
    description:
      'C++17 ECS-based 2D game engine with OpenGL 4.6 GPU-instanced rendering (persistent-mapped buffers, GLsync fences). Custom rigid-body physics (AABB tree, SAT, sequential impulses). Work-stealing thread pool, 4M-particle system, four playable demos.',
    tags: ['C++', 'OpenGL', 'ECS', 'Physics', 'GPU'],
    color: '--accent-green',
    status: 'shipped',
  },
  {
    year: '2025',
    period: 'Oct 2025 — Apr 2026',
    title: 'Diff2Commit — Transformer for Commit Messages (Thesis)',
    description:
      '36.6M-param encoder-decoder Transformer built from scratch. Custom DiffEmbedding with <ADD>/<REMOVE>/<MODIFY> tags, dual Unigram+BPE vocabs, RoPE, RMSNorm, SwiGLU. Trained on filtered CommitPack with bfloat16. Benchmarked 13 decoding strategies across 6 metrics.',
    tags: ['PyTorch', 'Transformers', 'NLP', 'ROCm', 'Thesis'],
    color: '--accent-magenta',
    status: 'shipped',
  },
  {
    year: '2025',
    period: 'Oct 2025 — Dec 2025',
    title: 'KhojAI — AI Search & Conversational Intelligence',
    description:
      'Multi-service AI platform: Java Spring Boot backend, Python FastAPI AI engine, Next.js web, Flutter mobile. Hybrid RAG (spaCy, KeyBERT, BM25, Google Search). SSE streaming with 9 event types for live pipeline visualization.',
    tags: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Next.js', 'SSE'],
    color: '--accent-cyan',
    status: 'shipped',
  },
  {
    year: '2025',
    period: 'Mar 2026 — Apr 2026',
    title: 'Raycaster-OpenGL Engine',
    description:
      'Wolfenstein-style GPU-accelerated DDA raycasting in C++/OpenGL 3.3 with GLSL fragment-shader rendering. Textured walls/floors/sky, distance fog, weapon system, minimap, visual map editor with undo/redo.',
    tags: ['C++', 'OpenGL', 'GLSL', 'GLFW'],
    color: '--accent-amber',
    status: 'shipped',
  },
  {
    year: '2025',
    period: 'Aug 2025',
    title: 'Auto-Git-Handler-Hub (AGHH)',
    description:
      'Terminal-based Git management TUI with Dialog framework. Auto-repo discovery, GitHub CLI integration, cross-platform installer (Linux/macOS). Conflict resolution, analytics, backup/export.',
    tags: ['Bash', 'Python', 'Dialog', 'Git'],
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
