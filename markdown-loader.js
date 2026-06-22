/**
 * markdown-loader.js — Neural Terminal Markdown Viewer
 * Loads and renders project documentation token-by-token
 * in a terminal-styled modal overlay.
 *
 * Design tokens: --bg-void, --bg-card, --font-mono, --font-body,
 *                --accent-cyan, --accent-magenta, --accent-green,
 *                --border-subtle, --text-primary, --text-secondary, --text-muted
 *
 * Daiyaan Muhammad Fardeen — neural-terminal v2.4.1
 */

/* ── Cache ── */
const MARKDOWN_CACHE = {};

/* ── Embedded markdown (first ~30 lines of each doc for instant preview) ── */
const EMBEDDED = {
  'CV-Tailor-readme.md': `# CVTailor

**AI-powered CV tailoring engine.** Paste a job description, upload your CV, and get a semantically tailored version optimized for ATS systems — with every change transparent and reversible.

## Quick Start

### Docker (Recommended)

\`\`\`bash
# 1. Pull AI models on your host (only needed once)
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull nomic-embed-text

# 2. Set up NuExtract custom model
curl -L -o NuExtract-2.0-2B-Q8_0.gguf "https://huggingface.co/mradermacher/NuExtract-2.0-2B-GGUF/resolve/main/NuExtract-2.0-2B.Q8_0.gguf"
ollama create nuextract2b -f ./Modelfile

# 3. Configure auth secret
echo 'AUTH__SECRET_KEY=your-strong-secret-here' >> .env

# 4. Start everything
docker compose up --build
\`\`\`

That's it. The API, database, Redis, Celery worker, and migrations all start automatically.`,

  'vibecost-readme.md': `# vibecost

**Prompt-Based Token Estimation & LLM Cost Simulator**

Simulate how an AI agent would interact with your codebase — predicting which files it would read, what tools it would call, and exactly how much it would cost — all **without making a single API call**.

Budget AI coding sessions, compare model pricing, and understand token costs before you commit to a workflow.

## Features

- **Prompt Prediction Engine** — Describe a task in natural language; vibecost predicts which files and tools an AI coding agent would access
- **Multi-Model Support** — 15 models across OpenAI, Anthropic, Google, DeepSeek, Meta
- **Token Estimation** — Uses Tiktoken and HuggingFace AutoTokenizer for accurate counts
- **Cost Simulation** — Estimates API costs based on prompt/completion tokens per model
- **Multi-Turn Agent Loops** — Simulate iterative coding sessions with context pressure bars`,

  'Nyon-readme.md': `# Nyon — 2D Game Engine

**Nyon** is a C++17 ECS-based 2D game engine with OpenGL 4.6 GPU-instanced rendering, a custom rigid-body physics pipeline, and a particle system. It ships with four playable demos.

## Build

### Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| OpenGL | 4.6 Core profile | GPU driver |
| GLFW | 3.x | Windowing |
| GLM | Any recent | Math library |
| GLAD | Bundled | OpenGL loader |
| CMake | >= 3.10 | Build system |
| C++ compiler | C++17 capable | GCC, Clang, MSVC |

### Commands

\`\`\`bash
# Configure
cmake -B build

# Build engine library + 4 demos
cmake --build build
\`\`\``,

  'KhojAI-readme.md': `# KhojAI

**An intelligent AI-powered search and chat application** that combines a local LLM (Ollama) with real-time web search to provide context-aware, factually-grounded responses.

KhojAI is a full-stack, multi-module platform with a **Java Spring Boot** backend, **Python FastAPI** AI engine, **Next.js** web frontend, and a **Flutter** cross-platform mobile app.

## Tech Stack

- **Java Spring Boot** — REST API, JWT auth, PostgreSQL, circuit breakers
- **Python FastAPI** — AI pipeline: spaCy NER, KeyBERT, YAKE, BM25, WordNet
- **Next.js** — Web frontend with SSE streaming, 9 event types
- **Flutter** — Cross-platform mobile app
- **Ollama** — Local LLM inference

## Architecture Overview

The platform uses a hybrid retrieval approach combining traditional NLP with semantic search.`,

  'Raycaster-OpenGL-readme.md': `# Raycaster

A Wolfenstein-style pseudo-3D raycasting engine built with C++ and OpenGL, using GLFW for windowing and GLAD for OpenGL loading. Self-contained — no external dependencies beyond what's included in this repository.

## Features

- **GPU-accelerated DDA raycasting** — walls, floor, and sky rendered entirely in a GLSL fragment shader
- **Textured walls** — PNG-based wall textures via a 2D texture array
- **Panoramic sky** — direction-mapped sky texture wrapping the horizon
- **Textured floor** — perspective-correct floor rendering with distance fog
- **Distance-based shading / fog** — toggleable fog that darkens geometry with distance
- **Mouse look** — horizontal mouse aiming with configurable sensitivity
- **WASD movement** — walking, strafing, sprinting, and collision detection
- **Weapon system** — 4 weapons with animated sprites, recoil, and ammo management`,

  'Auto-Git-Handler-Hub-readme.md': `# Auto-Git-Handler-Hub (AGHH)

**Auto-Git-Handler-Hub (AGHH)** is a terminal-based Git management and automation tool. It provides an intuitive text-based user interface (TUI) using \`dialog\`, allowing seamless repository navigation, automation tasks, and GitHub integration.

## Features

- **File Manager & Automation** — Navigate project directories and run scripts efficiently
- **Git Repository Management** — Scan your system for Git repositories and select one to work with
- **GitHub CLI Integration** — Authenticate and manage repositories with GitHub CLI
- **Insights & Analysis** — Generate stats and view repository status
- **Conflict Helper** — Quickly resolve Git conflicts
- **Cross-Platform** — Linux (Debian/Ubuntu, Arch, Fedora, openSUSE, Alpine) and macOS`,

  'Mini-Transfomer-From-Scratch-readme.md': `# Mini Transformer From Scratch

**An Efficient Mini Transformer from Scratch: Implementation and Optimization with Modern Techniques for Code Difference to Commit Message Translation**

An automated commit message generation system. This paper shows how a compact Encoder-Decoder Transformer model trained entirely from scratch on the CommitPack dataset can translate natural commit messages from code diffs.

## Key Innovations

1. **DiffEmbedding** — Adds \`<ADD>\`, \`<REMOVE>\`, \`<MODIFY>\` tags directly into the model
2. **Dual Tokenization** — Custom Unigram + BPE vocabularies for code and messages
3. **36.6M parameters** — Compact architecture using RoPE, RMSNorm, and SwiGLU

## Training Optimizations

- Mixed-precision bfloat16 with gradient checkpointing
- BucketBatchSampler reduces padding by 40-70%
- Curriculum learning with EMA decay rate of 0.999`,

  'my-html-project-readme.md': `# FundMyIdea BD — Empowering Student Innovation

**The Ultimate Crowdfunding Platform for Student Entrepreneurs**

FundMyIdea BD is a **next-generation crowdfunding platform** designed exclusively for student innovators. Whether you're developing breakthrough technology, launching a social impact project, or creating art that matters — we provide the tools to turn your vision into reality.

## Why Choose FundMyIdea BD?

- **Student-Focused** — Built by students, for students
- **Smart Matching** — AI-powered campaign recommendations
- **Real-Time Updates** — Live donation tracking via WebSocket
- **Professional Tools** — Drag-and-drop page builder
- **Gamification** — Rewards, milestones, and achievements
- **Mobile-First** — Responsive design that works everywhere`,
};

/* ── Constants ── */
const CURSOR_CHAR = '\u2588';
const TOKEN_INTERVAL_MS = 40;
const TOKEN_VARIANCE = 0.5;
const CODE_TOKEN_INTERVAL_MS = 5;
const MODAL_TRANSITION_MS = 250;

/* ── Injected styles (set once) ── */
let _stylesInjected = false;

function injectStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'md-viewer-styles';
  style.textContent = `
    @keyframes mdv-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes mdv-slide-up {
      from { opacity: 0; transform: translateY(24px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes mdv-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes mdv-fade-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    @keyframes mdv-slide-down {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(24px) scale(0.98); }
    }
    @keyframes mdv-pulse-glow {
      0%, 100% { box-shadow: 0 0 8px rgba(0, 229, 255, 0.15); }
      50% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.3); }
    }
    .mdv-highlight {
      background: rgba(0, 229, 255, 0.2) !important;
      border-radius: 2px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);
}

/* ── Helpers ── */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getReducedMotion() {
  return window.portfolio?.reducedMotion === true ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Markdown → Token Parser ── */

/**
 * Parse markdown text into an array of renderable token objects.
 * Each token has: { type, html }
 *   - type: 'word', 'space', 'code', 'heading', 'list-item', 'hr', 'newline'
 *   - html: the rendered HTML string for this token
 */
function parseMarkdownToTokens(text) {
  const tokens = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeBuffer = [];

  function flushCodeBlock() {
    if (codeBuffer.length === 0) return;
    const code = codeBuffer.join('\n');
    const html = '<pre class="mdv-code"><code>' + escapeHtml(code) + '</code></pre>';
    tokens.push({ type: 'code', html });
    codeBuffer = [];
  }

  function processInlineFormatting(word) {
    // Process **bold**, *italic*, `code`, [text](url)
    let result = escapeHtml(word);
    // Bold
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code class="mdv-inline-code">$1</code>');
    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return result;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Code block fences
    if (raw.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushCodeBlock();
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(raw);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(raw.trim())) {
      tokens.push({ type: 'hr', html: '<hr class="mdv-hr">' });
      continue;
    }

    // Headings
    const headingMatch = raw.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const formatted = text
        .split(/(\s+)/)
        .map((w) => {
          if (w.trim() === '') return w;
          return processInlineFormatting(w);
        })
        .join('');
      tokens.push({
        type: 'heading',
        html: `<h${level} class="mdv-h${level}">${formatted}</h${level}>`,
      });
      tokens.push({ type: 'newline', html: '' });
      continue;
    }

    // Empty line = paragraph break
    if (raw.trim() === '') {
      // Only add newline if previous token wasn't already a newline or block
      const last = tokens[tokens.length - 1];
      if (last && last.type !== 'newline' && last.type !== 'heading' && last.type !== 'code' && last.type !== 'hr') {
        tokens.push({ type: 'newline', html: '<br>' });
        tokens.push({ type: 'newline', html: '<br>' });
      }
      continue;
    }

    // List items
    const listMatch = raw.match(/^(\s*)[-*+]\s+(.*)$/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const text = listMatch[2].trim();
      const formatted = processInlineFormatting(text);
      const tag = indent === 0 ? 'ul' : 'ul';
      tokens.push({
        type: 'list-item',
        html: `<li class="mdv-li">${formatted}</li>`,
      });
      continue;
    }

    // Numbered list items
    const numListMatch = raw.match(/^(\s*)\d+[.)]\s+(.*)$/);
    if (numListMatch) {
      const text = numListMatch[2].trim();
      const formatted = processInlineFormatting(text);
      tokens.push({
        type: 'list-item',
        html: `<li class="mdv-li">${formatted}</li>`,
      });
      continue;
    }

    // Table rows (skip for simplicity, render as text)
    if (raw.trim().startsWith('|')) {
      const cells = raw
        .split('|')
        .filter((c) => c.trim())
        .map((c) => c.trim());
      // Skip separator rows
      if (cells.every((c) => /^[-:]+$/.test(c.replace(/\s/g, '')))) {
        tokens.push({ type: 'newline', html: '' });
        continue;
      }
      const formatted = cells
        .map((c) => processInlineFormatting(c))
        .join(' <span class="mdv-table-sep">|</span> ');
      tokens.push({ type: 'word', html: '<span class="mdv-table-row">| ' + formatted + ' |</span>' });
      tokens.push({ type: 'newline', html: '<br>' });
      continue;
    }

    // Regular paragraph text — split into words
    const words = raw.split(/(\s+)/);
    for (const word of words) {
      if (word === '') continue;
      if (/^\s+$/.test(word)) {
        tokens.push({ type: 'space', html: word });
      } else {
        const formatted = processInlineFormatting(word);
        tokens.push({ type: 'word', html: formatted });
      }
    }
    tokens.push({ type: 'newline', html: '<br>' });
  }

  // Flush any remaining code block
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return tokens;
}

/* ── RAF Token Renderer ── */

/**
 * Render tokens progressively using requestAnimationFrame.
 * Returns a destroy function to cancel rendering.
 *
 * @param {HTMLElement} container - Content area element
 * @param {Array} tokens - Array of { type, html } objects
 * @param {object} options
 * @param {number} options.interval - Base ms per token (default 40)
 * @param {number} options.onComplete - Callback when done
 * @returns {Function} destroy
 */
function renderTokens(container, tokens, options = {}) {
  if (!container || !tokens || tokens.length === 0) return () => {};

  const reducedMotion = getReducedMotion();
  const interval = options.interval || TOKEN_INTERVAL_MS;
  let index = 0;
  let destroyed = false;
  let rafId = null;
  let lastTime = 0;

  // Cursor element
  const cursor = document.createElement('span');
  cursor.className = 'mdv-cursor';
  cursor.textContent = CURSOR_CHAR;
  cursor.setAttribute('aria-hidden', 'true');
  cursor.style.cssText = [
    'display:inline-block',
    'opacity:1',
    'animation:mdv-blink 530ms step-end infinite',
    'color:var(--accent-cyan,#00e5ff)',
    'font-family:var(--font-mono,monospace)',
    'user-select:none',
    'pointer-events:none',
    'vertical-align:text-bottom',
    'line-height:1',
  ].join(';');

  function showCursor() {
    if (!cursor.parentNode) {
      container.insertAdjacentElement('beforeend', cursor);
    }
    cursor.style.display = 'inline-block';
  }

  function hideCursor() {
    cursor.style.display = 'none';
  }

  // Reduced motion: show all at once
  if (reducedMotion) {
    container.innerHTML = tokens.map((t) => t.html).join('');
    showCursor();
    if (typeof options.onComplete === 'function') options.onComplete();
    return () => {};
  }

  // RAF tick
  function tick(timestamp) {
    if (destroyed) return;

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    if (index < tokens.length) {
      const token = tokens[index];

      // Determine interval based on token type
      let tokenInterval = interval;
      if (token.type === 'code') {
        tokenInterval = CODE_TOKEN_INTERVAL_MS;
      }

      if (elapsed >= tokenInterval) {
        // Append this token
        appendToken(token);
        index++;
        lastTime = timestamp;
      }
    }

    if (index >= tokens.length) {
      // All tokens rendered
      hideCursor();
      showCursor();
      if (typeof options.onComplete === 'function') options.onComplete();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function appendToken(token) {
    if (token.html === '') return;
    // For space tokens, add a space character
    if (token.type === 'space') {
      container.appendChild(document.createTextNode(token.html));
      return;
    }
    // For inline tokens (word, inline-code, etc.), wrap appropriately
    container.insertAdjacentHTML('beforeend', token.html);
  }

  // Start
  showCursor();
  rafId = requestAnimationFrame(tick);

  return function destroy() {
    destroyed = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (cursor.parentNode) {
      cursor.remove();
    }
  };
}

/* ── Modal DOM ── */

let _viewerState = null;

/**
 * Create the viewer modal DOM structure.
 * Returns { overlay, window, titleEl, contentEl, inputEl, closeBtn }
 */
function createModal(filename) {
  injectStyles();

  // Overlay
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Markdown viewer: ' + filename);
  overlay.className = 'mdv-overlay';

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mdv-backdrop';

  // Terminal window
  const win = document.createElement('div');
  win.className = 'mdv-window';

  // Title bar
  const titlebar = document.createElement('div');
  titlebar.className = 'mdv-titlebar';

  const dots = document.createElement('div');
  dots.className = 'mdv-dots';
  dots.innerHTML =
    '<span class="mdv-dot mdv-dot--red"></span>' +
    '<span class="mdv-dot mdv-dot--yellow"></span>' +
    '<span class="mdv-dot mdv-dot--green"></span>';

  const title = document.createElement('div');
  title.className = 'mdv-title';
  title.textContent = filename;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'mdv-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close markdown viewer');
  closeBtn.title = 'Close (Esc)';

  titlebar.append(dots, title, closeBtn);

  // Loading indicator
  const loading = document.createElement('div');
  loading.className = 'mdv-loading';
  loading.textContent = '⟳ loading markdown...';

  // Content area
  const content = document.createElement('div');
  content.className = 'mdv-content';

  // Input bar
  const inputBar = document.createElement('div');
  inputBar.className = 'mdv-inputbar';

  const prompt = document.createElement('span');
  prompt.className = 'mdv-prompt';
  prompt.textContent = '>';

  const input = document.createElement('input');
  input.className = 'mdv-input';
  input.type = 'text';
  input.placeholder = 'type command... (help)';
  input.setAttribute('aria-label', 'Terminal command input');
  input.spellcheck = false;
  input.autocomplete = 'off';

  inputBar.append(prompt, input);

  // Assemble window
  win.append(titlebar, loading, content, inputBar);

  // Assemble overlay
  overlay.append(backdrop, win);

  // ── Styling (applied via element style + classNames) ──
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono, monospace)',
  });

  Object.assign(backdrop.style, {
    position: 'absolute',
    inset: '0',
    background: 'rgba(0,0,0,0)',
    backdropFilter: 'blur(0px)',
    WebkitBackdropFilter: 'blur(0px)',
    transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
  });

  // Use CSS custom properties for backdrop
  const bgVoid = getComputedStyle(document.documentElement).getPropertyValue('--bg-void').trim() || '#05050f';
  backdrop.style.background = `${bgVoid}D9`; // 0.85 alpha via hex

  Object.assign(win.style, {
    position: 'relative',
    width: 'min(800px, 92vw)',
    maxHeight: '80vh',
    background: 'var(--bg-card, #111127)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    opacity: '0',
    transform: 'translateY(24px) scale(0.98)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    boxShadow: '0 0 40px rgba(0,0,0,0.4), 0 0 80px rgba(0,0,0,0.2)',
    animation: 'mdv-pulse-glow 4s ease-in-out infinite',
  });

  Object.assign(titlebar.style, {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    gap: '10px',
    minHeight: '42px',
    flexShrink: '0',
  });

  Object.assign(dots.style, {
    display: 'flex',
    gap: '6px',
    flexShrink: '0',
  });

  // Dot styles injected via style tag for pseudo-elements
  const dotStyle = document.createElement('style');
  dotStyle.textContent = `
    .mdv-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .mdv-dot--red { background: #ff5f5f; }
    .mdv-dot--yellow { background: #ffbd2e; }
    .mdv-dot--green { background: #28c840; }
  `;
  dots.appendChild(dotStyle);

  Object.assign(title.style, {
    flex: '1',
    fontSize: 'var(--text-xs, 0.7rem)',
    color: 'var(--text-secondary, #7878a8)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  Object.assign(closeBtn.style, {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted, #3a3a5c)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '2px',
    lineHeight: '1',
    transition: 'color 0.15s, background 0.15s',
    flexShrink: '0',
  });

  Object.assign(loading.style, {
    padding: '16px',
    color: 'var(--text-muted, #3a3a5c)',
    fontSize: 'var(--text-sm, 0.85rem)',
    display: 'none',
  });

  Object.assign(content.style, {
    flex: '1',
    overflowY: 'auto',
    padding: '20px 24px',
    fontSize: 'var(--text-sm, 0.85rem)',
    lineHeight: 'var(--leading-relaxed, 1.8)',
    color: 'var(--text-primary, #e8e8f8)',
    fontFamily: 'var(--font-body, Inter, sans-serif)',
    scrollBehavior: 'smooth',
  });

  Object.assign(inputBar.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    background: 'rgba(0,0,0,0.15)',
    flexShrink: '0',
  });

  Object.assign(prompt.style, {
    color: 'var(--accent-green, #00ff41)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 'var(--text-sm, 0.85rem)',
    flexShrink: '0',
  });

  Object.assign(input.style, {
    flex: '1',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary, #e8e8f8)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 'var(--text-sm, 0.85rem)',
    outline: 'none',
    caretColor: 'var(--accent-cyan, #00e5ff)',
  });

  return { overlay, backdrop, win, titleEl: title, contentEl: content, inputEl: input, closeBtn, loadingEl: loading };
}

/* ── Modal Animation Helpers ── */

function animateIn(overlay, win) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      win.style.opacity = '1';
      win.style.transform = 'translateY(0) scale(1)';
      setTimeout(resolve, MODAL_TRANSITION_MS);
    });
  });
}

function animateOut(overlay, win) {
  return new Promise((resolve) => {
    win.style.opacity = '0';
    win.style.transform = 'translateY(24px) scale(0.98)';
    overlay.style.backdropFilter = 'blur(0px)';
    overlay.style.background = 'rgba(0,0,0,0)';
    setTimeout(() => {
      overlay.remove();
      resolve();
    }, MODAL_TRANSITION_MS + 50);
  });
}

/* ── Search Highlighting ── */

function highlightText(container, term) {
  if (!term || term.length < 2) return;

  // Remove existing highlights
  container.querySelectorAll('.mdv-highlight').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });

  // Walk text nodes and wrap matches
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  const matches = [];
  const lowerTerm = term.toLowerCase();

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const idx = node.textContent.toLowerCase().indexOf(lowerTerm);
    if (idx !== -1) {
      matches.push({ node, idx, length: term.length });
    }
  }

  // Process matches (reverse order to preserve offsets)
  for (let m = matches.length - 1; m >= 0; m--) {
    const { node, idx, length } = matches[m];
    const text = node.textContent;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + length);
    const after = text.slice(idx + length);

    const span = document.createElement('span');
    span.className = 'mdv-highlight';
    span.textContent = match;

    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(span);
    if (after) fragment.appendChild(document.createTextNode(after));

    node.parentNode.replaceChild(fragment, node);
  }
}

function clearHighlights(container) {
  container.querySelectorAll('.mdv-highlight').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });
}

/* ── Command Input Handler ── */

function setupInputHandler(input, contentEl, closeFn) {
  function handleCommand(value) {
    const cmd = value.trim().toLowerCase();

    if (cmd === 'close' || cmd === 'q' || cmd === 'quit') {
      input.value = '';
      closeFn();
      return;
    }

    if (cmd === 'top') {
      contentEl.scrollTop = 0;
      input.value = '';
      return;
    }

    if (cmd === 'help') {
      showHelp(contentEl);
      input.value = '';
      return;
    }

    if (cmd === 'clear' || cmd === 'cls') {
      clearHighlights(contentEl);
      input.value = '';
      return;
    }

    if (cmd.startsWith('search ') || cmd.startsWith('find ')) {
      const term = cmd.replace(/^(search|find)\s+/i, '');
      if (term) {
        highlightText(contentEl, term);
      }
      input.value = '';
      return;
    }

    // Unknown command — flash help hint
    input.style.color = 'var(--accent-magenta, #ff00aa)';
    setTimeout(() => {
      input.style.color = '';
    }, 400);
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input.value);
    }
  }

  input.addEventListener('keydown', onKeydown);

  return function cleanup() {
    input.removeEventListener('keydown', onKeydown);
  };
}

/* ── Help Display ── */

function showHelp(contentEl) {
  const helpHTML = [
    '<div class="mdv-help" style="margin: 12px 0; padding: 12px; border: 1px solid var(--border-subtle); border-radius: 4px; background: rgba(0,0,0,0.2);">',
    '  <div style="color: var(--accent-cyan); margin-bottom: 8px; font-weight: 500;">╔════════════════════════════╗</div>',
    '  <div style="color: var(--accent-cyan); margin-bottom: 8px; font-weight: 500;">║  MARKDOWN VIEWER COMMANDS  ║</div>',
    '  <div style="color: var(--accent-cyan); margin-bottom: 12px; font-weight: 500;">╚════════════════════════════╝</div>',
    '  <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-family: var(--font-mono); font-size: var(--text-xs);">',
    '    <span style="color: var(--accent-green);">close, q</span><span style="color: var(--text-secondary);">Close viewer</span>',
    '    <span style="color: var(--accent-green);">top</span><span style="color: var(--text-secondary);">Scroll to top</span>',
    '    <span style="color: var(--accent-green);">search &lt;term&gt;</span><span style="color: var(--text-secondary);">Highlight matching text</span>',
    '    <span style="color: var(--accent-green);">clear</span><span style="color: var(--text-secondary);">Clear highlights</span>',
    '    <span style="color: var(--accent-green);">help</span><span style="color: var(--text-secondary);">Show this help</span>',
    '  </div>',
    '</div>',
  ].join('\n');

  contentEl.insertAdjacentHTML('beforeend', helpHTML);
  contentEl.scrollTop = contentEl.scrollHeight;
}

/* ── Focus Trap ── */

function setupFocusTrap(overlay, closeBtn, inputEl, closeFn) {
  // Focusable elements within the modal
  function getFocusable() {
    return overlay.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeFn();
    }
  }

  overlay.addEventListener('keydown', onKeydown);
  overlay.addEventListener('keydown', trapFocus);

  // Auto-focus input
  setTimeout(() => inputEl.focus(), MODAL_TRANSITION_MS + 100);

  return function cleanup() {
    overlay.removeEventListener('keydown', onKeydown);
    overlay.removeEventListener('keydown', trapFocus);
  };
}

/* ── Main Export ── */

/**
 * Open the markdown viewer modal for a given file.
 * @param {string} filename - e.g. 'CV-Tailor-readme.md'
 */
export async function openMarkdownViewer(filename) {
  // Close existing viewer if open
  if (_viewerState) {
    await closeViewer();
  }

  // Build modal
  const { overlay, backdrop, win, titleEl, contentEl, inputEl, closeBtn, loadingEl } = createModal(filename);
  document.body.appendChild(overlay);

  // Track state
  let destroyRender = null;
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    closeViewer();
  }

  // Wire close button
  closeBtn.addEventListener('click', close);

  // Wire close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Wire hover effect on close button
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = 'var(--accent-magenta, #ff00aa)';
    closeBtn.style.background = 'rgba(255, 0, 170, 0.1)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = '';
    closeBtn.style.background = '';
  });

  // Set up input commands
  const inputCleanup = setupInputHandler(inputEl, contentEl, close);

  // Set up focus trap & escape
  const focusCleanup = setupFocusTrap(overlay, closeBtn, inputEl, close);

  // Animate in
  await animateIn(overlay, win);

  // Store state for cleanup
  _viewerState = {
    close,
    overlay,
    win,
    cleanup: () => { inputCleanup(); focusCleanup(); },
    _destroyRender: null,
    setDestroyRender: (fn) => { _viewerState._destroyRender = fn; },
  };

  // ── Load & Render Content ──

  // 1. Show embedded content immediately
  const embedded = EMBEDDED[filename];
  if (embedded) {
    const tokens = parseMarkdownToTokens(embedded);
    destroyRender = renderTokens(contentEl, tokens, {
      interval: TOKEN_INTERVAL_MS,
      onComplete: () => {
        // Embedded preview done
      },
    });
    _viewerState.setDestroyRender(destroyRender);
  }

  // 2. Try fetching full content
  try {
    const fullContent = await fetchMarkdown(filename);
    if (closed) return;

    // Cancel current render and clear content
    if (destroyRender) {
      destroyRender();
      destroyRender = null;
    }
    contentEl.innerHTML = '';

    // Render full content
    const tokens = parseMarkdownToTokens(fullContent);
    destroyRender = renderTokens(contentEl, tokens, {
      interval: TOKEN_INTERVAL_MS,
      onComplete: () => {
        contentEl.querySelector('.mdv-cursor')?.style?.setProperty('display', 'inline-block');
      },
    });
    _viewerState.setDestroyRender(destroyRender);
  } catch (err) {
    // Embedded content already showing — that's fine
    if (!closed) {
      // Mark loading as done (embedded already displayed)
    }
  }
}

/**
 * Close the currently open viewer with animation.
 */
export async function closeViewer() {
  if (!_viewerState) return;
  const { close: closeFn, cleanup, overlay, win } = _viewerState;

  // Cancel any active rendering
  if (typeof _viewerState._destroyRender === 'function') {
    _viewerState._destroyRender();
  }

  cleanup();

  if (overlay && win) {
    await animateOut(overlay, win);
  }

  _viewerState = null;
}

/* ── Markdown Fetch ── */

async function fetchMarkdown(filename) {
  // Check cache first
  if (MARKDOWN_CACHE[filename]) {
    return MARKDOWN_CACHE[filename];
  }

  // Try fetching from md-docs/ directory
  try {
    const res = await fetch('./md-docs/' + encodeURIComponent(filename));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    MARKDOWN_CACHE[filename] = text;
    return text;
  } catch (err) {
    // Fall back to embedded
    if (EMBEDDED[filename]) {
      return EMBEDDED[filename];
    }
    throw new Error(`Could not load ${filename}: ${err.message}`);
  }
}
