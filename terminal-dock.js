/**
 * terminal-dock.js — Fixed bottom terminal navigation dock.
 * Command input + section navigation buttons with spec icons.
 * Matrix easter egg: click the matrix button 5 times.
 */

let matrixClickCount = 0;
let matrixActive = false;

const SECTIONS = [
  { id: 'hero',     icon: '[/]',  label: 'home',     cmd: 'home' },
  { id: 'about',    icon: '[~]',  label: 'about',    cmd: 'about' },
  { id: 'skills',   icon: '[*]',  label: 'skills',   cmd: 'skills' },
  { id: 'projects', icon: '[+]',  label: 'projects', cmd: 'projects' },
  { id: 'timeline', icon: '[#]',  label: 'timeline', cmd: 'timeline' },
  { id: 'contact',  icon: '[&]',  label: 'contact',  cmd: 'contact' },
];

/* ── Custom smooth scroll: easeInOutExpo ── */
function smoothScrollTo(targetY, duration = 800) {
  const start = window.scrollY;
  const diff = targetY - start;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // easeInOutExpo
    const ease =
      t === 0 ? 0
        : t === 1 ? 1
          : t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
    window.scrollTo(0, start + diff * ease);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Help text ── */
const HELP = `
Available commands:
  goto [section]   — scroll to section (home, about, skills, projects, timeline, contact)
  cat [file]       — display file contents (skills.txt, profile.txt, bio.txt)
  sudo [cmd]       — run command with elevated privileges (try: sudo make coffee)
  ping [host]      — ping a host (try: ping github.com)
  theme [name]     — switch theme (neon, matrix, void)
  matrix           — toggle matrix rain overlay
  clear            — clear terminal output
  help             — show this message
  whoami           — display current user
  echo [message]   — repeat message
  date             — show current date/time
  uptime           — show session duration
  ls               — list sections
  status           — show system status
  home, about, skills, projects, timeline, contact
                   — shortcut: scroll to section
`;

const WHOAMI = `daiyaan\nrole: AI Engineer & Systems Programmer\nshell: zsh 5.9\nuptime: see uptime command`;

export function initTerminalDock() {
  const dock = document.getElementById('terminal-dock');
  if (!dock) return;

  const startTime = Date.now();

  /* ── Build bar ── */
  const bar = document.createElement('div');
  bar.className = 'terminal-dock__bar';

  const prompt = document.createElement('span');
  prompt.className = 'terminal-dock__prompt';
  prompt.textContent = 'daiyaan@neural-os:~$';

  const input = document.createElement('input');
  input.className = 'terminal-dock__input';
  input.type = 'text';
  input.placeholder = 'type a command...';
  input.setAttribute('aria-label', 'Terminal command input');
  input.spellcheck = false;
  input.autocomplete = 'off';

  const nav = document.createElement('div');
  nav.className = 'terminal-dock__nav';

  SECTIONS.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'terminal-dock__btn';
    btn.dataset.section = s.id;
    btn.setAttribute('aria-label', `Navigate to ${s.label}`);
    btn.textContent = s.icon;

    const tip = document.createElement('span');
    tip.className = 'terminal-dock__tooltip';
    tip.textContent = s.label;
    btn.appendChild(tip);

    btn.addEventListener('click', () => scrollToSection(s.id));
    nav.appendChild(btn);
  });

  bar.appendChild(prompt);
  bar.appendChild(input);
  bar.appendChild(nav);

  /* ── Output panel ── */
  const output = document.createElement('div');
  output.className = 'terminal-output';
  output.setAttribute('aria-live', 'polite');

  dock.appendChild(bar);
  dock.appendChild(output);

  /* ── Input handler ── */
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      input.value = '';
      handleCommand(val, output, startTime);
    }
  });

  /* ── Focus dock input on Ctrl+K ── */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
  });

  /* ── Focus input on dock click (unless clicking a button) ── */
  dock.addEventListener('click', (e) => {
    if (!e.target.closest('.terminal-dock__btn')) {
      input.focus();
    }
  });
}

/* ── Helpers ── */

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - 20;
  smoothScrollTo(targetY, 800);
}

function handleCommand(cmd, output, startTime) {
  const args = cmd.split(/\s+/);
  const command = args[0].toLowerCase();

  const writeOutput = (text) => {
    output.classList.add('terminal-output--visible');
    const line = document.createElement('div');
    line.className = 'terminal-output__cmd';
    line.textContent = `$ ${cmd}`;
    output.appendChild(line);
    const resp = document.createElement('div');
    resp.className = 'terminal-output__resp';
    resp.textContent = text;
    output.appendChild(resp);
    output.scrollTop = output.scrollHeight;
  };

  switch (command) {
    case 'clear':
      output.innerHTML = '';
      output.classList.remove('terminal-output--visible');
      return;

    case 'help':
      writeOutput(HELP.trim());
      return;

    case 'whoami':
      writeOutput(WHOAMI);
      return;

    case 'goto': {
      const target = args[1]?.toLowerCase();
      const section = SECTIONS.find((s) => s.cmd === target || s.id === target);
      if (section) {
        scrollToSection(section.id);
        writeOutput(`navigating to ${section.label}...`);
      } else {
        writeOutput(`section not found: ${target}. Try: home, about, skills, projects, timeline, contact`);
      }
      return;
    }

    case 'home':
    case 'about':
    case 'skills':
    case 'projects':
    case 'timeline':
    case 'contact':
      scrollToSection(command);
      writeOutput(`navigating to ${command}...`);
      return;

    case 'cat': {
      const file = args[1]?.toLowerCase();
      const files = {
        'skills.txt': `Languages:  Rust, C++, Python, Go, TypeScript, PHP, SQL\nAI/ML:       PyTorch, Transformers, vLLM, ROCm, Embeddings\nSystems:     OpenGL, ECS, GPU Compute, Linux\nBackend:     FastAPI, PostgreSQL, Redis, Docker`,
        'profile.txt': `Name:    Daiyaan Muhammad Fardeen\nRole:    AI Engineer & Systems Programmer\nFocus:   AI infrastructure, GPU compute, neural architectures\nStatus:  Final year thesis — Commit Message Transformer`,
        'bio.txt': `Daiyaan is a final-year CS student at IUT, building AI systems that \nspan the stack — from GPU-optimized ML models to full-stack web \napps. His thesis explores compact Transformer architectures for \ncommit message generation, trained on AMD ROCm hardware.`,
        'stack.txt': `Languages:     Rust, C++, Python, Go, TypeScript, PHP, SQL\nFrameworks:    PyTorch, FastAPI, OpenGL, ECS\nInfra:         vLLM, Ollama, Celery, PostgreSQL, Redis, Docker\nTools:         ROCm, Neovim, Linux, Git, GitHub Actions`,
        'thesis.txt': `Commit Message Transformer\n\nA compact Transformer trained from scratch in PyTorch.\nArchitecture: RoPE, RMSNorm, SwiGLU, DiffEmbedding\ndual BPE vocabs × 2 embedding tables, 10 × 10^6 tokens.\nTraining on ROCm (AMD RX 6600).\nGoal: generate structured commit messages from diffs.`,
      };
      if (file && files[file]) {
        writeOutput(files[file]);
      } else {
        const available = Object.keys(files).join(', ');
        writeOutput(`cat: ${file || ''}: no such file. Available: ${available}`);
      }
      return;
    }

    case 'sudo': {
      const rest = args.slice(1).join(' ');
      if (rest.toLowerCase() === 'make coffee') {
        writeOutput(
          '[sudo] password for daiyaan:\n' +
          'Permission denied — neural.privacy.lock engaged.\n' +
          '☕ Coffee machine not found in neural topology.'
        );
      } else if (rest.toLowerCase() === 'rm -rf /') {
        writeOutput('Nice try, skiddie. Go home.');
      } else if (rest) {
        writeOutput(`[sudo] running: ${rest}\nCommand executed with root privileges. Output: nil.`);
      } else {
        writeOutput('usage: sudo [command]');
      }
      return;
    }

    case 'ping': {
      const host = args[1] || 'localhost';
      if (host === 'github.com') {
        writeOutput(
          `PING ${host} (140.82.121.3) 56(84) bytes of data.\n` +
          `64 bytes from 140.82.121.3: icmp_seq=1 ttl=49 time=214ms\n` +
          `64 bytes from 140.82.121.3: icmp_seq=2 ttl=49 time=198ms\n` +
          `64 bytes from 140.82.121.3: icmp_seq=3 ttl=49 time=221ms\n` +
          `--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss`
        );
      } else if (host === 'localhost') {
        writeOutput(
          `PING localhost (127.0.0.1) 56(84) bytes of data.\n` +
          `64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.043ms\n` +
          `64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.038ms\n` +
          `64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.041ms\n` +
          `--- localhost ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss`
        );
      } else {
        writeOutput(`ping: ${host}: Name or service not known`);
      }
      return;
    }

    case 'theme': {
      const theme = args[1]?.toLowerCase();
      const root = document.documentElement;
      switch (theme) {
        case 'neon':
          root.style.setProperty('--accent-cyan', '#00e5ff');
          root.style.setProperty('--accent-magenta', '#ff00aa');
          root.style.setProperty('--accent-green', '#00ff41');
          root.style.setProperty('--accent-amber', '#ffb300');
          root.style.setProperty('--bg-void', '#05050f');
          writeOutput('theme set to: neon (default)');
          break;
        case 'matrix':
          root.style.setProperty('--accent-cyan', '#00ff41');
          root.style.setProperty('--accent-magenta', '#00ff41');
          root.style.setProperty('--accent-green', '#00ff41');
          root.style.setProperty('--accent-amber', '#00ff41');
          root.style.setProperty('--bg-void', '#000000');
          writeOutput('theme set to: matrix — the code is everywhere');
          break;
        case 'void':
          root.style.setProperty('--accent-cyan', '#6a6a9e');
          root.style.setProperty('--accent-magenta', '#8a4a7a');
          root.style.setProperty('--accent-green', '#4a8a5a');
          root.style.setProperty('--accent-amber', '#7a6a3a');
          root.style.setProperty('--bg-void', '#050510');
          writeOutput('theme set to: void — deep space palette');
          break;
        default:
          writeOutput(`theme not found: ${theme}. Available: neon, matrix, void`);
      }
      return;
    }

    case 'matrix':
      toggleMatrixOverlay(output, cmd);
      return;

    case 'echo':
      if (args[1] === '$MOTD') {
        fetchQuote(output, cmd);
      } else {
        writeOutput(args.slice(1).join(' ') || '');
      }
      return;

    case 'date':
      writeOutput(new Date().toString());
      return;

    case 'uptime': {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      writeOutput(`up ${h}h ${m}m ${s}s — session active`);
      return;
    }

    case 'ls':
      writeOutput(SECTIONS.map((s) => `  ${s.icon.padEnd(6)} ${s.cmd.padEnd(12)} ${s.label}`).join('\n'));
      return;

    case 'status': {
      const sections = SECTIONS.map(
        (s) => `  ${s.icon.padEnd(6)} ${s.cmd.padEnd(12)} ${document.getElementById(s.id) ? '✓ online' : '✗ offline'}`
      ).join('\n');
      writeOutput(`neural-terminal status:\n${sections}`);
      return;
    }

    default:
      writeOutput(`command not found: ${command}. type "help" for available commands.`);
  }
}

/* ── Fetch Programming Quote ── */
async function fetchQuote(output, cmd) {
  const writeOut = (text) => {
    output.classList.add('terminal-output--visible');
    const line = document.createElement('div');
    line.className = 'terminal-output__cmd';
    line.textContent = `$ ${cmd}`;
    output.appendChild(line);
    const resp = document.createElement('div');
    resp.className = 'terminal-output__resp';
    resp.textContent = text;
    output.appendChild(resp);
    output.scrollTop = output.scrollHeight;
  };

  try {
    const res = await fetch('https://programming-quotes-api.herokuapp.com/quotes/random');
    if (!res.ok) throw new Error(`API: ${res.status}`);
    const data = await res.json();
    writeOut(`"${data.en}"\n  \u2014 ${data.author} (rating: ${data.rating ?? 'N/A'})`);
  } catch {
    writeOut('MOTD: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."\n  \u2014 Martin Fowler (offline fallback)');
  }
}

/* ── Matrix Overlay Toggle (with 5-click easter egg) ── */
function toggleMatrixOverlay(output, cmd) {
  const overlay = document.getElementById('matrix-overlay');
  if (!overlay) return;

  const writeOut = (text) => {
    output.classList.add('terminal-output--visible');
    const line = document.createElement('div');
    line.className = 'terminal-output__cmd';
    line.textContent = `$ ${cmd}`;
    output.appendChild(line);
    const resp = document.createElement('div');
    resp.className = 'terminal-output__resp';
    resp.textContent = text;
    output.appendChild(resp);
    output.scrollTop = output.scrollHeight;
  };

  if (matrixActive) {
    overlay.style.display = 'none';
    matrixActive = false;
    matrixClickCount = 0;
    output.textContent = '';
    output.classList.remove('terminal-output--visible');
    writeOut('matrix rain: disabled');
    return;
  }

  matrixClickCount++;
  if (matrixClickCount < 5) {
    writeOut(`matrix: ${matrixClickCount}/5 clicks to unlock...`);
    return;
  }

  // 5 clicks — activate
  overlay.style.display = 'block';
  matrixActive = true;
  output.textContent = '';
  output.classList.remove('terminal-output--visible');
  writeOut('matrix rain: ENABLED — welcome to the desert of the real');

  if (!window._matrixRain) {
    startMatrixRain(overlay);
  }
}

function startMatrixRain(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  window._matrixRain = true;

  function draw() {
    if (!matrixActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      window._matrixRain = false;
      return;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
