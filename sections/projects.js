/**
 * Projects Section — GitHub-backed project cards
 * Daiyaan Muhammad Fardeen Portfolio
 */
import { makeTiltable } from '../utils/tilt.js';

/* ── Featured projects (manually curated, merged with GitHub API) ── */
const featured = [
  {
    repoName: 'Domio',
    displayName: 'Domio',
    tagline: 'Figma/Canva-grade presentation platform — local-first, real-time, AI-assisted',
    description:
      'Polyglot full-stack deck platform with deck-as-code authoring + WYSIWYG editor. Control plane in TypeScript + Hono + Node 22, realtime gateway in Go, CPU workers in Go/Rust, AI workers in Python. Frontend: Next.js 15 (App Router) + React 19 + Vite. Storage: PostgreSQL 16 + ClickHouse + Redis 7 + NATS JetStream + S3-compatible. Programmable agents via MCP. Phase 17 / 18 in flight.',
    tech: ['Next.js 15', 'React 19', 'TypeScript', 'Hono', 'Node.js 22', 'Go', 'Rust', 'PostgreSQL 16', 'ClickHouse', 'Redis 7', 'NATS', 'Docker'],
    accent: '--accent-cyan',
    icon: '◆',
  },
  {
    repoName: 'KhojAI',
    displayName: 'KhojAI',
    tagline: 'Full-stack AI search + chat with RAG — web + mobile',
    description:
      'Multi-service AI platform. Java Spring Boot backend, Python FastAPI AI engine, Next.js web frontend, Flutter mobile app. Hybrid retrieval (spaCy NER, KeyBERT, YAKE, BM25, WordNet, Google Programmable Search). Async web scraping (3 strategies). SSE streaming with 9 event types for live pipeline visualization. JWT auth, PostgreSQL, circuit breakers, disk caching.',
    tech: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Next.js', 'Flutter', 'PostgreSQL', 'Redis', 'Ollama', 'SSE'],
    accent: '--accent-magenta',
    icon: '◈',
  },
  {
    repoName: 'CV-Tailor',
    displayName: 'CV-Tailor',
    tagline: 'AI-powered CV tailoring — every change transparent and reversible',
    description:
      'FastAPI core + Next.js 16 dashboard. Llama 3.1 via Ollama, NuExtract for CV normalization, pgvector similarity search over 14,000+ skill embeddings. Celery async job queue with SSE streaming. Multi-agent pipeline: JD parsing, skill resolution, bullet improvement, composite scoring (ATS, semantic, structural, readability), transparent diff generation. Docker Compose one-command deploy.',
    tech: ['Python', 'FastAPI', 'PyTorch', 'Ollama', 'PostgreSQL', 'pgvector', 'Redis', 'Celery', 'Next.js', 'Docker'],
    accent: '--accent-green',
    icon: '◉',
  },
  {
    repoName: 'my-html-project',
    displayName: 'FundMyIdea BD',
    tagline: 'Crowdfunding platform for student entrepreneurs — MFS-first',
    description:
      'Full-stack platform with Node.js + Express + MongoDB. Drag-and-drop campaign page builder, custom reward tiers, WebSocket real-time donation tracking, AI-powered campaign recommendations, analytics dashboard (funding trends, visitor metrics, conversion stats). bKash/Nagad integration, JWT auth, CSRF protection, dark mode, gamification, responsive design.',
    tech: ['Node.js', 'Express', 'MongoDB', 'WebSocket', 'EJS', 'JavaScript', 'JWT', 'Docker'],
    accent: '--accent-amber',
    icon: '◎',
  },
  {
    repoName: 'Web-Application-Validation-Engine',
    displayName: 'Weven (WAVE)',
    tagline: 'Universal end-to-end tester for web apps — Go runtime + markdown specs',
    description:
      'Black-box web-app validation framework. Specs written in a markdown-style domain-specific language, executed by a Go-built test runner. Async, parallel, rich diff reporting. Designed for CI/CD pipelines — run against any live deployment, get actionable pass/fail per scenario.',
    tech: ['Go', 'TypeScript', 'Markdown', 'E2E', 'CI/CD'],
    accent: '--accent-cyan',
    icon: '⬢',
  },
  {
    repoName: 'vibecost',
    displayName: 'vibecost',
    tagline: 'Prompt-based LLM cost simulator — know the bill before you call the API',
    description:
      'CLI tool that simulates AI agent behavior to predict token usage and costs before any API call. Prompt Prediction Engine estimates files/tools an AI would use from a natural language task. Supports 15 models across OpenAI, Anthropic, Google, DeepSeek, Meta. Tiktoken + HF AutoTokenizer. Reasoning token sim, prompt caching analysis, context pressure bars, multi-turn agent loops, CI/CD enforcement, JSON reporting.',
    tech: ['Python', 'CLI', 'Tiktoken', 'HuggingFace', 'API'],
    accent: '--accent-magenta',
    icon: '◉',
  },
  {
    repoName: 'Mini-Transfomer-From-Scratch',
    displayName: 'Diff2Commit',
    tagline: '36M-param Transformer from scratch — diffs in, commit messages out',
    description:
      'Encoder-decoder Transformer built from scratch for commit message generation. Custom DiffEmbedding with <ADD>/<REMOVE>/<MODIFY> tags, dual Unigram+BPE vocabs, RoPE, RMSNorm, SwiGLU. Trained on filtered CommitPack with bfloat16 mixed-precision, gradient checkpointing, curriculum learning, BucketBatchSampler. 13 decoding strategies benchmarked across 6 metrics.',
    tech: ['Python', 'PyTorch', 'Transformers', 'NLP', 'ROCm', 'CUDA'],
    accent: '--accent-green',
    icon: '◈',
  },
  {
    repoName: 'Nyon',
    displayName: 'Nyon Engine',
    tagline: 'C++17 ECS 2D engine — OpenGL 4.6 GPU-instanced rendering',
    description:
      'Custom 2D game engine with GPU-instanced OpenGL 4.6 rendering (persistent-mapped buffers, triple-buffering, GLsync fences). Pure ECS with SoA storage, O(1) access, entity recycling. Custom rigid-body physics (Dynamic AABB Tree, SAT, sequential impulses). Work-stealing thread pool, 4M-particle system, 4 playable demos.',
    tech: ['C++', 'OpenGL', 'ECS', 'Physics', 'GLFW', 'GPU'],
    accent: '--accent-amber',
    icon: '⬡',
  },
  {
    repoName: 'Auto-Git-Handler-Hub',
    displayName: 'AGHH',
    tagline: 'TUI Git management and automation hub',
    description:
      'Terminal-based Git management platform with Dialog TUI framework. Auto-scans repos, integrates GitHub CLI, provides repository insights and conflict resolution. Cross-platform installer (Linux/macOS) with auto-dependency detection. File management, backup/export, analytics, customizable settings.',
    tech: ['Bash', 'Python', 'Dialog', 'Git', 'Linux'],
    accent: '--accent-cyan',
    icon: '◇',
  },
];

/* ── Colour helpers ── */
const accentToVar = {
  '--accent-cyan': '#00e5ff',
  '--accent-magenta': '#ff00aa',
  '--accent-green': '#00ff41',
  '--accent-amber': '#ffb300',
};

const accentToGlow = {
  '--accent-cyan': '--glow-cyan',
  '--accent-magenta': '--glow-magenta',
  '--accent-green': '--glow-green',
  '--accent-amber': '--glow-cyan', /* amber uses cyan glow fallback */
};

/* ── GitHub language colour map ── */
const langColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Jupyter: '#DA5B0F',
};

/* ── Helpers ── */
function timeAgo(dateStr) {
  if (!dateStr) return 'unknown';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getGlowValue(accentVar) {
  const glowVar = accentToGlow[accentVar] || '--glow-cyan';
  // We need to use the computed style to set the glow
  return glowVar;
}

function getAccentColor(accentVar) {
  return accentToVar[accentVar] || '#00e5ff';
}

/* ── GitHub fetch ── */
async function fetchRepos() {
  const { portfolio } = window;
  if (portfolio.githubRepos) return portfolio.githubRepos;

  try {
    const res = await fetch(
      'https://api.github.com/users/DaiyaanMuhammadFardeen/repos?sort=pushed&per_page=60',
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const repos = await res.json();
    portfolio.githubRepos = repos;
    return repos;
  } catch (err) {
    console.warn('GitHub fetch failed, using hardcoded data:', err.message);
    return [];
  }
}

/* ── Merge API data onto featured ── */
function mergeApiData(apiRepos) {
  const map = new Map();
  for (const repo of apiRepos) {
    map.set(repo.name.toLowerCase(), repo);
  }

  return featured.map((item) => {
    const api = map.get(item.repoName.toLowerCase());
    if (!api) return item;
    return {
      ...item,
      stars: api.stargazers_count ?? 0,
      forks: api.forks_count ?? 0,
      updatedAt: api.updated_at ?? api.pushed_at ?? null,
      language: api.language || null,
      htmlUrl: api.html_url ?? `https://github.com/DaiyaanMuhammadFardeen/${item.repoName}`,
      description: item.description || api.description || '',
    };
  });
}

/* ── Card builder ── */
function buildCard(project) {
  const card = document.createElement('div');
  card.className = 'terminal-card project-card';
  card.dataset.cursorLabel = 'OPEN';

  const accentColor = getAccentColor(project.accent);
  const glowVar = getGlowValue(project.accent);

  /* ── Header ── */
  const header = document.createElement('div');
  header.className = 'terminal-card__header';

  const dots = document.createElement('div');
  dots.className = 'terminal-card__dots';
  dots.textContent = '\u25CF \u25CF \u25CF'; // ● ● ●

  const title = document.createElement('div');
  title.className = 'terminal-card__title';
  title.textContent = `${project.repoName}.md`;

  const icon = document.createElement('span');
  icon.className = 'terminal-card__icon';
  icon.textContent = project.icon;
  icon.style.color = `var(${project.accent})`;

  header.append(dots, title, icon);

  /* ── Body ── */
  const body = document.createElement('div');
  body.className = 'terminal-card__body';

  const tagline = document.createElement('div');
  tagline.style.cssText =
    'font-family: var(--font-display); font-size: var(--text-lg); color: var(--text-primary); margin-bottom: 8px; line-height: var(--leading-tight);';
  tagline.textContent = project.tagline;

  const desc = document.createElement('div');
  desc.style.cssText =
    'font-family: var(--font-body); font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: 12px; line-height: var(--leading-relaxed);';
  desc.textContent = project.description;

  const techRow = document.createElement('div');
  techRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap;';
  for (const t of project.tech) {
    const tag = document.createElement('span');
    tag.className = 'tech-tag';
    tag.textContent = t;
    techRow.append(tag);
  }

  body.append(tagline, desc, techRow);

  /* ── Footer ── */
  const footer = document.createElement('div');
  footer.className = 'terminal-card__footer';

  const stats = document.createElement('div');
  stats.className = 'project-card__stats';

  if (project.stars !== undefined) {
    const star = document.createElement('span');
    star.className = 'project-card__stat';
    star.textContent = `\u2605 ${project.stars}`;
    stats.append(star);
  }
  if (project.forks !== undefined) {
    const fork = document.createElement('span');
    fork.className = 'project-card__stat';
    fork.textContent = `⌥ ${project.forks}`;
    stats.append(fork);
  }
  if (project.updatedAt) {
    const upd = document.createElement('span');
    upd.className = 'project-card__stat';
    upd.textContent = `◷ ${timeAgo(project.updatedAt)}`;
    stats.append(upd);
  }

  const langEl = document.createElement('span');
  if (project.language) {
    const dot = document.createElement('span');
    dot.className = 'project-card__lang-dot';
    dot.style.background = langColors[project.language] || '#888';
    dot.style.marginRight = '4px';
    langEl.append(dot, project.language);
  }

  footer.append(stats, langEl);

  /* ── Assemble ── */
  card.append(header, body, footer);

  /* ── Hover glow ── */
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = accentColor;
    card.style.boxShadow = `0 0 8px ${accentColor}44, 0 0 20px ${accentColor}22`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = '';
    card.style.boxShadow = '';
  });

  /* ── Click: scale + open ── */
  const url =
    project.htmlUrl ||
    `https://github.com/DaiyaanMuhammadFardeen/${project.repoName}`;
  card.addEventListener('click', (e) => {
    if (window.portfolio.reducedMotion) {
      window.open(url, '_blank');
      return;
    }
    card.style.transition = 'transform 0.15s ease';
    card.style.transform = 'scale(0.96)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
    setTimeout(() => {
      window.open(url, '_blank');
    }, 200);
  });

  /* ── Tilt ── */
  makeTiltable(card, { maxDeg: 15 });

  return card;
}

/* ── Reveal observer ── */
function observeReveal(grid, section) {
  const cards = grid.querySelectorAll('.project-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Array.from(cards).indexOf(entry.target);
          const delay = idx * 80;
          setTimeout(() => {
            entry.target.classList.add('project-card--visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1 }
  );

  for (const card of cards) {
    observer.observe(card);
  }
}

/* ── Main init ── */
export async function initProjects() {
  const grid = document.getElementById('projects-grid');
  const status = document.getElementById('projects-status');
  if (!grid) return;

  status.textContent = 'fetching from api.github.com...';

  /* Fetch repos (or use cached) */
  const apiRepos = await fetchRepos();
  const merged = mergeApiData(apiRepos);

  /* Update status */
  const source =
    window.portfolio.githubRepos
      ? 'loaded from cache'
      : apiRepos.length > 0
        ? 'done'
        : 'loaded from hardcoded data';
  const count = merged.length;
  status.textContent = `${source} [${count} repos]`;

  /* Render cards */
  for (const project of merged) {
    const card = buildCard(project);
    grid.append(card);
  }

  /* Observe for reveal */
  const section = grid.closest('.section');
  observeReveal(grid, section);
}
