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
    tags: ['Rust', 'C++', 'Python', 'Go', 'TypeScript', 'PHP', 'SQL'],
    borderColor: 'var(--accent-cyan)',
    glowVar: 'var(--glow-cyan)',
  },
  {
    label: 'Tools',
    tags: ['PyTorch', 'vLLM', 'ROCm', 'OpenGL', 'FastAPI', 'PostgreSQL', 'Redis', 'Neovim'],
    borderColor: 'var(--accent-magenta)',
    glowVar: 'var(--glow-magenta)',
  },
  {
    label: 'Currently Building',
    type: 'rotator',
    items: ['CVTailor', 'GPU Cluster Intelligence', 'Commit Msg Transformer'],
    borderColor: 'var(--accent-green)',
    glowVar: 'var(--glow-green)',
  },
  {
    label: 'Hardware',
    tags: ['AMD RX 6600', 'ROCm', 'Arch Linux', 'Neovim'],
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
  { text: '  "role": "AI Engineer & Systems Programmer",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "location": "Dhaka, Bangladesh",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "status": "Thesis student — Transformers for code understanding",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "affiliation": "University (CS)",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  "focus": [', cls: 'terminal-muted' },
  { text: '    "Large language models",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "Systems programming",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "GPU compute",', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '    "Game engine architecture"', cls: 'terminal-muted', strCls: 'terminal-cyan' },
  { text: '  ]', cls: 'terminal-muted' },
  { text: '}', cls: 'terminal-muted' },
  { text: '', cls: '' },
  { text: '$ cat bio.txt', cls: 'terminal-green' },
  { text: 'I build systems that think. My work lives at the boundary between', cls: 'terminal-primary' },
  { text: 'low-level hardware and high-level intelligence — from ECS game', cls: 'terminal-primary' },
  { text: 'engines in C++ to Transformer models running on AMD ROCm.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'My thesis explores compact Transformers for commit message generation:', cls: 'terminal-primary' },
  { text: 'teaching a model to read git diffs and describe what changed, in prose.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'I care about efficiency. Not just algorithmic efficiency, but systems', cls: 'terminal-primary' },
  { text: 'that respect the metal underneath — tight loops, cache-friendly data,', cls: 'terminal-primary' },
  { text: 'and code that knows why it runs fast.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: 'Currently: building an AI-powered CV tailoring tool, engineering a', cls: 'terminal-primary' },
  { text: 'GPU cluster intelligence system, and writing a thesis.', cls: 'terminal-primary' },
  { text: '', cls: '' },
  { text: '$ █', cls: 'terminal-green', isCursor: true },
];

const ABOUT_COMMANDS = {
  'cat stack.txt': `── Technology Stack ──\n\nLanguages:\n  Rust · C++ · Python · Go · TypeScript · PHP · SQL\n\nAI/ML:\n  PyTorch · Transformers · vLLM · ROCm · Hugging Face\n\nSystems:\n  OpenGL · ECS Architecture · GPU Compute · Linux\n\nBackend:\n  FastAPI · PostgreSQL · Redis · Docker\n\nTools:\n  Neovim · Git · ROCm · Arch Linux`,
  'cat thesis.txt': `── Thesis: Compact Transformers for Commit Message Generation ──\n\nThis research explores training a compact Transformer model to\nunderstand git diffs and generate human-readable commit messages.\n\nThe model learns to identify structural code changes, summarize\nthem, and produce concise, descriptive prose explaining what changed.\n\nKey areas:\n  • Tokenizing code diffs for Transformer consumption\n  • Attention-based change summarization\n  • Efficient inference on consumer GPUs (AMD ROCm)\n  • Evaluation against human-written commit messages\n\nStatus: In progress — thesis writing and model tuning.`,
  help: `Available commands:\n  whoami         — display identity\n  cat profile.json — view profile data\n  cat bio.txt    — read biography\n  cat stack.txt  — view technology stack\n  cat thesis.txt — read about my thesis\n  ls             — list directory\n  clear          — clear terminal\n  help           — show this message`,
  ls: `about/\n  profile.json\n  bio.txt\n  stack.txt\n  thesis.txt\n  projects/`,
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

      // Look up command output
      const output = ABOUT_COMMANDS[cmd] || `zsh: command not found: ${cmd}`;

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
