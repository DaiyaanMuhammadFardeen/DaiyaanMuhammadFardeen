/**
 * About Section — initAbout
 * Two-column layout: terminal auto-type (left) + fact panel (right).
 * After auto-type completes, terminal becomes interactive.
 */
import { Typewriter } from '../utils/typewriter.js';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Data ──────────────────────────────────────────────

const FACT_CARDS = [
  {
    label: 'Languages',
    tags: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'Bash', 'SQL', 'HTML', 'CSS'],
    borderColor: 'var(--accent-cyan)',
    glowVar: 'var(--glow-cyan)',
  },
  {
    label: 'Frontend',
    tags: ['Next.js 15', 'React 19', 'Tailwind', 'EJS', 'WebSocket Client', 'Canvas 2D', 'GSAP', 'Vite'],
    borderColor: 'var(--accent-magenta)',
    glowVar: 'var(--glow-magenta)',
  },
  {
    label: 'Backend & APIs',
    tags: ['Node.js', 'Express', 'FastAPI', 'Spring Boot', 'Hono', 'Celery', 'Ollama', 'HuggingFace'],
    borderColor: 'var(--accent-green)',
    glowVar: 'var(--glow-green)',
  },
  {
    label: 'Data & Infra',
    tags: ['PostgreSQL', 'MongoDB', 'Redis', 'ClickHouse', 'NATS', 'pgvector', 'Docker', 'Nginx', 'GitHub Actions', 'Vercel'],
    borderColor: 'var(--accent-amber)',
    glowVar: 'var(--glow-amber)',
  },
];

const TERMINAL_LINES = [
  { text: '$ whoami', cls: 'terminal-green' },
  { text: 'daiyaan_m_fardeen', cls: 'terminal-cyan' },
  { text: '', cls: '' },
  { text: '$ cat profile.json', cls: 'terminal-green' },
  { text: '{', cls: 'terminal-muted' },
  { text: '  "name": "Daiyaan Muhammad Fardeen",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "role": "Full-Stack Web Developer · ML Engineer",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "education": "Daffodil International University (CSE)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "gpa": "3.73/4.0",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "location": "Dhaka, Bangladesh",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "experience": "ex-Student Associate at DIU (2023\u20142024)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "status": "Open to web-dev roles (frontend, backend, full-stack)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "achievements": "2nd place AI Prompt Battle 2024",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "focus": [', cls: 'terminal-muted' },
  { text: '    "Full-stack web apps (Next.js, React, Node.js)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "Backend APIs (FastAPI, Spring Boot, Express)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "Data layer (PostgreSQL, MongoDB, Redis, pgvector)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "AI integration (Ollama, PyTorch, RAG, SSE streaming)"', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  ]', cls: 'terminal-muted' },
  { text: '}', cls: 'terminal-muted' },
  { text: '', cls: '' },
  { text: '$ cat bio.txt', cls: 'terminal-green' },
  { text: 'I ship full-stack web apps \u2014 frontend, backend, data, deploy.', cls: 'terminal-primary' },
  { text: 'Next.js / React on the client, Node.js / FastAPI / Spring Boot', cls: 'terminal-primary' },
  { text: 'on the server, PostgreSQL / MongoDB underneath, Docker all the way down.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Final-year CS student at Daffodil International University. GPA 3.73/4.0.', cls: 'terminal-primary' },
  { text: 'Ex-Student Associate at DIU (2023\u20142024).', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Currently shipping Domio \u2014 a Figma/Canva-grade presentation platform', cls: 'terminal-primary' },
  { text: '(Next.js + Go + Hono + React + PostgreSQL + ClickHouse + Redis + NATS).', cls: 'terminal-primary' },
  { text: 'Also active on KhojAI, CV-Tailor, and FundMyIdea BD.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Side projects: a 36M-param Transformer built from scratch in PyTorch', cls: 'terminal-primary' },
  { text: 'for commit-message generation (thesis work), and a C++17/OpenGL 4.6', cls: 'terminal-primary' },
  { text: 'ECS-based 2D game engine (Nyon) with custom physics.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Competitive programmer \u2014 2nd place at AI Prompt Battle 2024.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'I care about shipping. Working software > perfect design docs.', cls: 'terminal-primary' },
  { text: 'Frontend polish matters. Backend correctness matters more.', cls: 'terminal-primary' },
  { text: 'Type systems are a love language.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Open to frontend, backend, and full-stack web-dev roles \u2014', cls: 'terminal-primary' },
  { text: 'remote or hybrid. Happy to chat.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', cls: 'terminal-muted' },
  { text: '  type \'help\' and press Enter  \u25b8  interactive terminal', cls: 'terminal-amber' },
  { text: '', cls: '' },
  { text: '$ \u2588', cls: 'terminal-green', isCursor: true },
];

const ABOUT_COMMANDS = {
  'cat stack.txt': `── Technology Stack ──\n\nLanguages:\n  TypeScript · JavaScript · Python · Java · C++ · Go · Bash · SQL\n\nFrontend:\n  Next.js 15 · React 19 · Tailwind · EJS · HTML/CSS · Canvas/WebGL/WebSocket\n\nBackend:\n  Node.js · Express · FastAPI · Spring Boot · Hono · Celery · Ollama\n\nData:\n  PostgreSQL · MongoDB · Redis · ClickHouse · NATS · pgvector\n\nInfra:\n  Docker · GitHub Actions · Vercel · Nginx · Linux\n\nAI/ML:\n  PyTorch · HuggingFace · LangChain · Ollama\n\nRealtime:\n  WebSocket · SSE · Socket.io`,
  'cat thesis.txt': `── Thesis: Mini Transformer from Scratch for Commit Generation ──\n\nI built a 36.6M-parameter Transformer from scratch in PyTorch — no\npretrained weights, no HuggingFace models — a compact encoder-decoder\nthat reads git diffs and generates human-readable commit messages.\n\nKey design decisions:\n  • Custom DiffEmbedding with <ADD> / <REMOVE> / <MODIFY> tags\n  • Dual Unigram + BPE tokenizers (code + message)\n  • RoPE, RMSNorm, SwiGLU, residual + cross-attention\n  • Trained on filtered CommitPack, bf16 mixed precision\n  • Gradient checkpointing + curriculum learning\n  • 13 decoding strategies benchmarked across 6 metrics\n\nStatus: in progress — model training and thesis writing.`,
  'cat projects.txt': `── Projects ──\n\nDomio           \u2502 Figma/Canva-grade presentation platform\n                 \u2502 (Next.js 15, Go, Hono, React 19, PostgreSQL, ClickHouse)\nKhojAI          \u2502 AI search + chat with RAG\n                 \u2502 (Spring Boot, FastAPI, Next.js, Flutter)\nCV-Tailor       \u2502 AI CV tailoring engine\n                 \u2502 (FastAPI, Next.js 16, Ollama, pgvector)\nFundMyIdea BD   \u2502 Crowdfunding for student entrepreneurs\n                 \u2502 (Node.js, Express, MongoDB, WebSocket)\nvibecost        \u2502 LLM cost simulator (Python, CLI)\nMini-Transf.    \u2502 36M-param Transformer from scratch (PyTorch)\nNyon Engine     \u2502 Custom 2D game engine (C++17, OpenGL 4.6)\nRaycaster       \u2502 Wolfenstein-style GPU raycaster (C++, OpenGL)\nAuto-Git-Handler\u2502 TUI Git management (Bash, Python, Dialog)\nWeven (WAVE)    \u2502 Universal E2E web tester (Go, TypeScript)`,
  'uname -a': 'frontend.systems 6.2.0-web1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux | DaiyaanOS v3.0.0',
  date: () => new Date().toString(),
  uptime: 'up 2h 13m — sessions: 1337 active route handlers',
  'echo $MOTD': async () => {
    try {
      const res = await fetch('https://programming-quotes-api.herokuapp.com/quotes/random');
      if (!res.ok) throw new Error(`API: ${res.status}`);
      const data = await res.json();
      return `"${data.en}"\n  — ${data.author} (rating: ${data.rating ?? 'N/A'})`;
    } catch {
      return 'MOTD: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."\n  — Martin Fowler (offline fallback)';
    }
  },
  neofetch: `daiyaan@web-os\n--------------\nOS: Arch Linux x86_64\nKernel: 6.2.0-arch1-1\nShell: zsh 5.9\nTerminal: frontend.systems\nDE: Wayland\nCPU: AMD Ryzen 5 5600X\nGPU: AMD RX 6600\nMemory: 7956MiB / 15972MiB`,
  'skills --list': `Skills:\n\u251c\u2500\u2500 Languages\n\u2502  \u251c\u2500 TypeScript, JavaScript, Python, Java, C++\n\u2502  \u251c\u2500 Go, Bash, SQL, HTML, CSS\n\u251c\u2500 Frontend\n\u2502  \u251c\u2500 Next.js 15 (App Router), React 19, Tailwind\n\u2502  \u251c\u2500 EJS, GSAP, Canvas 2D, WebSocket client\n\u251c\u2500 Backend & APIs\n\u2502  \u251c\u2500 Node.js, Express, FastAPI, Spring Boot, Hono\n\u2502  \u251c\u2500 Celery, Ollama, HuggingFace\n\u251c\u2500 Data\n\u2502  \u251c\u2500 PostgreSQL, MongoDB, Redis, ClickHouse\n\u2502  \u251c\u2500 NATS, pgvector, S3-compatible\n\u251c\u2500 Realtime\n\u2502  \u251c\u2500 WebSocket, SSE, Socket.io\n\u251c\u2500 AI / ML\n\u2502  \u251c\u2500 PyTorch, Transformers, RAG, Embeddings\n\u251c\u2500 DevOps\n\u2502  \u251c\u2500 Docker, GitHub Actions, Vercel, Nginx\n\u2514\u2500 Tools\n    \u251c\u2500 Git, Neovim, Linux, Arch, Ollama`,
  pwd: '/home/daiyaan/web-stack',
  env: 'SHELL=/bin/zsh\nTERM=frontend.systems\nUSER=daiyaan\nPATH=/usr/local/bin:/usr/bin:/bin:/web/bin\nNODE_VERSION=22.11.0\nPNPM_VERSION=9.12.3\nMOTD="The stack is shipping."',
  help: `Available commands:\n  whoami            \u2014 display identity\n  cat profile.json  \u2014 view profile data\n  cat bio.txt       \u2014 read biography\n  cat stack.txt     \u2014 view technology stack\n  cat projects.txt  \u2014 list projects\n  cat thesis.txt    \u2014 read about my thesis\n  uname -a          \u2014 system info\n  date              \u2014 current timestamp\n  uptime            \u2014 system uptime\n  echo $MOTD        \u2014 message of the day\n  neofetch          \u2014 system info with ASCII\n  skills --list     \u2014 list skills tree\n  pwd               \u2014 print working directory\n  env               \u2014 environment variables\n  ls                \u2014 list directory\n  clear             \u2014 clear terminal\n  help              \u2014 show this message`,
  ls: `about/\n  profile.json\n  bio.txt\n  stack.txt\n  projects.txt\n  thesis.txt\n  projects/`,
  whoami: 'daiyaan_m_fardeen',
};

// ── Init ──────────────────────────────────────────────

export function initAbout() {
  const aboutSection = document.getElementById('about');
  if (!aboutSection) return;

  const isReduced = window.portfolio?.reducedMotion ?? false;

  // Build fact panel
  buildFactPanel();

  // Terminal auto-type
  const terminalBody = document.getElementById('about-terminal-body');
  if (!terminalBody) return;

  if (isReduced) {
    renderTerminalInstant(terminalBody);
    return;
  }

  // Observe when about section scrolls into view
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          startTerminalAutoType(terminalBody);
          break;
        }
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(aboutSection);
}

// ── Fact Panel ────────────────────────────────────────

function buildFactPanel() {
  const grid = document.getElementById('fact-grid');
  if (!grid) return;

  grid.innerHTML = '';

  for (const card of FACT_CARDS) {
    const cardEl = document.createElement('div');
    cardEl.className = 'fact-card';
    cardEl.style.borderLeftColor = card.borderColor;

    // Hover glow
    if (card.glowVar) {
      cardEl.addEventListener('mouseenter', () => {
        cardEl.style.boxShadow = card.glowVar;
      });
      cardEl.addEventListener('mouseleave', () => {
        cardEl.style.boxShadow = '';
      });
    }

    const label = document.createElement('div');
    label.className = 'fact-card__label';
    label.textContent = card.label;
    cardEl.appendChild(label);

    const content = document.createElement('div');
    content.className = 'fact-card__content';

    if (card.type === 'rotator') {
      // Currently Building — rotating items
      const rotatorSpan = document.createElement('span');
      rotatorSpan.className = 'fact-card__rotator';
      rotatorSpan.textContent = card.items[0];
      content.appendChild(rotatorSpan);

      let idx = 1;
      setInterval(() => {
        rotatorSpan.style.opacity = '0';
        rotatorSpan.style.transition = 'opacity 200ms';
        setTimeout(() => {
          rotatorSpan.textContent = card.items[idx % card.items.length];
          rotatorSpan.style.opacity = '1';
          idx++;
        }, 200);
      }, 3000);
    } else if (card.tags) {
      // Tech tags
      card.tags.forEach((tag, i) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tech-tag';
        tagEl.textContent = tag;
        tagEl.style.display = 'inline-block';
        tagEl.style.opacity = '0';
        tagEl.style.transform = 'translateY(10px)';
        tagEl.style.transition = 'opacity 400ms ease, transform 400ms ease';
        tagEl.style.transitionDelay = `${i * 80}ms`;

        // Animate on scroll into view
        const tagObserver = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                tagEl.style.opacity = '1';
                tagEl.style.transform = 'translateY(0)';
                tagObserver.unobserve(tagEl);
              }
            }
          },
          { threshold: 0.5 }
        );
        tagObserver.observe(tagEl);

        content.appendChild(tagEl);
        // Space between tags
        content.appendChild(document.createTextNode(' '));
      });
    }

    cardEl.appendChild(content);
    grid.appendChild(cardEl);
  }
}

// ── Terminal Auto-Type ────────────────────────────────

function startTerminalAutoType(terminalBody) {
  terminalBody.innerHTML = '';
  terminalBody.style.whiteSpace = 'pre-wrap';
  terminalBody.style.wordBreak = 'break-word';
  terminalBody.style.overflowY = 'auto';

  let lineIdx = 0;

  function typeNextLine() {
    if (lineIdx >= TERMINAL_LINES.length) {
      // Terminal is fully typed — make interactive
      makeTerminalInteractive(terminalBody);
      return;
    }

    const lineData = TERMINAL_LINES[lineIdx];
    const lineEl = document.createElement('div');
    lineEl.style.lineHeight = '1.6';

    if (lineData.cls) {
      lineEl.className = lineData.cls;
    }
    if (lineData.isCursor) {
      // Final cursor line — just show it
      lineEl.textContent = lineData.text;
      terminalBody.appendChild(lineEl);
      lineIdx++;
      typeNextLine();
      return;
    }

    // If it's a JSON line with string values, color them differently
    if (lineData.strCls && lineData.text.includes('"')) {
      // Parse manually for simplicity: wrap string values in colored spans
      const parts = lineData.text.match(/(".*?"|[^"]+)/g) || [];
      for (const part of parts) {
        if (part.startsWith('"') && part.endsWith('"')) {
          const strSpan = document.createElement('span');
          strSpan.className = lineData.strCls;
          strSpan.textContent = part;
          lineEl.appendChild(strSpan);
        } else {
          const txtSpan = document.createElement('span');
          txtSpan.className = lineData.cls || '';
          txtSpan.textContent = part;
          lineEl.appendChild(txtSpan);
        }
      }
    } else if (lineData.text === '') {
      lineEl.innerHTML = '&nbsp;';
    } else {
      lineEl.textContent = lineData.text;
    }

    terminalBody.appendChild(lineEl);

    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;

    // Calculate delay based on content
    const isPrompt = lineData.text.startsWith('$ ');
    let delay = isPrompt ? 200 : 20;

    // Wait longer for blank lines
    if (lineData.text === '') {
      delay = 100;
    }

    lineIdx++;
    setTimeout(typeNextLine, delay);
  }

  typeNextLine();
}

function renderTerminalInstant(terminalBody) {
  terminalBody.innerHTML = '';
  terminalBody.style.whiteSpace = 'pre-wrap';
  terminalBody.style.wordBreak = 'break-word';
  terminalBody.style.overflowY = 'auto';

  for (const lineData of TERMINAL_LINES) {
    const lineEl = document.createElement('div');
    lineEl.style.lineHeight = '1.6';
    lineEl.textContent = lineData.text;
    if (lineData.cls) lineEl.className = lineData.cls;
    terminalBody.appendChild(lineEl);
  }
}

// ── Interactive Terminal ──────────────────────────────

function makeTerminalInteractive(terminalBody) {
  // Remove the cursor line (last one with █)
  const lastChild = terminalBody.lastElementChild;
  if (lastChild && lastChild.textContent.includes('█')) {
    lastChild.remove();
  }

  // Create input line
  const inputLine = document.createElement('div');
  inputLine.className = 'terminal-green';
  inputLine.style.display = 'flex';
  inputLine.style.alignItems = 'center';
  inputLine.style.gap = '0';
  inputLine.style.lineHeight = '1.6';

  const promptSpan = document.createElement('span');
  promptSpan.textContent = '$ ';

  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.style.background = 'transparent';
  inputField.style.border = 'none';
  inputField.style.color = 'var(--text-primary)';
  inputField.style.fontFamily = 'var(--font-mono)';
  inputField.style.fontSize = 'inherit';
  inputField.style.outline = 'none';
  inputField.style.flex = '1';
  inputField.style.caretColor = 'var(--accent-cyan)';
  inputField.autofocus = true;

  // Blinking cursor via CSS caret
  inputLine.appendChild(promptSpan);
  inputLine.appendChild(inputField);
  terminalBody.appendChild(inputLine);

  // Scroll to bottom
  terminalBody.scrollTop = terminalBody.scrollHeight;

  // Focus input when clicking terminal body
  terminalBody.addEventListener('click', () => inputField.focus());

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputField.value.trim().toLowerCase();

      // Output line (the command typed)
      const cmdLine = document.createElement('div');
      cmdLine.className = 'terminal-green';
      cmdLine.textContent = `$ ${inputField.value}`;
      terminalBody.insertBefore(cmdLine, inputLine);

      if (cmd === 'clear') {
        // Clear all but input line
        while (terminalBody.firstChild && terminalBody.firstChild !== inputLine) {
          terminalBody.removeChild(terminalBody.firstChild);
        }
        inputField.value = '';
        return;
      }

      // Look up command output (support function values for dynamic commands)
      const cmdOutput = ABOUT_COMMANDS[cmd];
      let output;
      if (typeof cmdOutput === 'function') {
        output = cmdOutput();
      } else {
        output = cmdOutput || `zsh: command not found: ${cmd}`;
      }

      const outLines = output.split('\n');
      for (const line of outLines) {
        const outEl = document.createElement('div');
        outEl.style.lineHeight = '1.6';
        outEl.style.color = 'var(--text-primary)';
        outEl.style.whiteSpace = 'pre-wrap';
        outEl.textContent = line;
        terminalBody.insertBefore(outEl, inputLine);
      }

      inputField.value = '';
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });

  // Tiny delay before focusing to not interfere with scroll
  setTimeout(() => inputField.focus(), 100);
}
