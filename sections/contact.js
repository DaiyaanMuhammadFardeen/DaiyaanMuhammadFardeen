/**
 * Contact Section — Neural message queue interface
 * Daiyaan Muhammad Fardeen Portfolio
 */
import { Typewriter } from '../utils/typewriter.js';
import { makeMagnetic } from '../utils/magnetic.js';

/* ── Formspree — replace with your actual Formspree ID ── */
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

/* ── Build form HTML ── */
function buildFormHTML() {
  const frag = document.createDocumentFragment();

  /* 1. ASCII Antenna */
  const antenna = document.createElement('pre');
  antenna.className = 'contact-antenna';
  antenna.textContent = `     /\\
    /  \\
   / ██ \\
  /______\\
     ||
     ||`;

  /* 2. Signal strength */
  const signal = document.createElement('div');
  signal.className = 'contact-signal';
  signal.textContent =
    'SIGNAL_STRENGTH: ████████░░ 80% \u2014 connection established';

  /* 3. Form element */
  const form = document.createElement('form');
  form.className = 'contact-form__element';
  form.setAttribute('novalidate', '');
  if (FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
    form.action = FORMSPREE_URL;
    form.method = 'POST';
  }

  /* ── Name field ── */
  const nameField = createField(
    'name',
    '// your_identifier',
    'anonymous_user',
    'text',
    false
  );
  form.append(nameField);

  /* ── Email field ── */
  const emailField = createField(
    'email',
    '// contact_address',
    'user@domain.tld',
    'email',
    true
  );
  form.append(emailField);

  /* ── Message field ── */
  const msgField = createField(
    'message',
    '// transmission_body',
    '// begin transmission...',
    'textarea',
    true
  );
  form.append(msgField);

  /* ── Submit button ── */
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'contact-form__submit';
  submitBtn.textContent = '[ transmit_packet ]';
  form.append(submitBtn);

  /* 4. Transmission log container (hidden initially) */
  const logContainer = document.createElement('div');
  logContainer.className = 'contact-transmission';
  logContainer.style.display = 'none';
  logContainer.setAttribute('aria-live', 'polite');

  /* 5. Social links */
  const social = document.createElement('div');
  social.className = 'contact-social';

  const githubLink = document.createElement('a');
  githubLink.className = 'contact-social__link';
  githubLink.href = 'https://github.com/DaiyaanMuhammadFardeen';
  githubLink.target = '_blank';
  githubLink.rel = 'noopener noreferrer';
  githubLink.textContent = '[github]';
  githubLink.dataset.cursorLabel = 'OPEN';
  makeMagnetic(githubLink, { strength: 0.25 });

  const emailLink = document.createElement('a');
  emailLink.className = 'contact-social__link';
  emailLink.href = 'mailto:daiyaan.muhammad2002@gmail.com';
  emailLink.textContent = '[email]';
  emailLink.dataset.cursorLabel = 'SEND';
  makeMagnetic(emailLink, { strength: 0.25 });

  const portfolioLink = document.createElement('a');
  portfolioLink.className = 'contact-social__link';
  portfolioLink.href = 'https://daiyaanmuhammadfardeen.github.io/DaiyaanMuhammadFardeen/';
  portfolioLink.target = '_blank';
  portfolioLink.rel = 'noopener noreferrer';
  portfolioLink.textContent = '[portfolio]';
  portfolioLink.dataset.cursorLabel = 'OPEN';
  makeMagnetic(portfolioLink, { strength: 0.25 });

  const domioLink = document.createElement('a');
  domioLink.className = 'contact-social__link';
  domioLink.href = 'https://github.com/DaiyaanMuhammadFardeen/Domio';
  domioLink.target = '_blank';
  domioLink.rel = 'noopener noreferrer';
  domioLink.textContent = '[domio]';
  domioLink.dataset.cursorLabel = 'READ';
  makeMagnetic(domioLink, { strength: 0.25 });

  social.append(githubLink, emailLink, portfolioLink, domioLink);

  /* Assemble */
  frag.append(antenna, signal, form, logContainer, social);

  return { frag, form, logContainer, submitBtn };
}

/* ── Create a form field with label, input/textarea, and packet indicator ── */
function createField(id, labelText, placeholder, type, required) {
  const wrapper = document.createElement('div');
  wrapper.className = 'contact-form__field';

  const label = document.createElement('label');
  label.className = 'contact-form__label';
  label.htmlFor = `contact-${id}`;
  label.textContent = labelText;

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'contact-form__textarea';
  } else {
    input = document.createElement('input');
    input.className = 'contact-form__input';
    input.type = type;
  }
  input.id = `contact-${id}`;
  input.name = id;
  input.placeholder = placeholder;
  if (required) input.required = true;

  /* Packet indicator dot */
  const packet = document.createElement('span');
  packet.className = 'contact-form__packet-indicator';
  packet.textContent = '.packet assembling..';

  wrapper.append(label, input, packet);

  /* ── Focus: left border animation ── */
  input.addEventListener('focus', () => {
    input.style.borderLeftColor = 'var(--accent-cyan)';
    input.style.boxShadow = '0 0 0 1px var(--accent-cyan), 0 0 8px #00e5ff33';
  });
  input.addEventListener('blur', () => {
    input.style.borderLeftColor = '';
    input.style.boxShadow = '';
  });

  /* ── Typing: show packet indicator ── */
  let packetTimeout = null;
  input.addEventListener('input', () => {
    packet.classList.add('contact-form__packet-indicator--active');
    clearTimeout(packetTimeout);
    packetTimeout = setTimeout(() => {
      packet.classList.remove('contact-form__packet-indicator--active');
    }, 1500);
  });

  return wrapper;
}

/* ── Transmission log lines ── */
function getTransmissionLines() {
  return [
    '> packet assembled: 124 bytes',
    '> routing to: daiyaan@neural-os.local',
    '> encoding: UTF-8 / neural-compress v1.2',
    '> estimated_delivery: immediate',
    '> STATUS: TRANSMITTED \u2713',
  ];
}

/* ── Handle form submit ── */
function handleSubmit(e, form, logContainer) {
  e.preventDefault();

  /* Collect form data */
  const data = new FormData(form);

  /* Fade out form */
  form.style.transition = 'opacity 500ms ease';
  form.style.opacity = '0';

  /* Show log container after form fades */
  setTimeout(() => {
    form.style.display = 'none';
    logContainer.style.display = 'block';
    logContainer.style.opacity = '0';
    logContainer.textContent = '';

    /* Fade in log container */
    requestAnimationFrame(() => {
      logContainer.style.transition = 'opacity 300ms ease';
      logContainer.style.opacity = '1';
    });

    /* Type out transmission lines */
    const lines = [...getTransmissionLines()];

    /* Send to Formspree if configured */
    if (form.action && FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
      })
        .then((res) => {
          if (res.ok) {
            lines.push('> server: 200 OK — message delivered');
          } else {
            lines.push('> server: ' + res.status + ' — delivery failed');
          }
        })
        .catch(() => {
          lines.push('> ERROR: transmission lost — check connection');
        });
    } else {
      lines.push('> Formspree not configured — replace FORMSPREE_ID');
    }

    const tw = new Typewriter(logContainer, { speed: 30 });

    for (let i = 0; i < lines.length; i++) {
      tw.type(lines[i]).pause(200);
      if (i < lines.length - 1) {
        tw.type('\n');
      }
    }

    tw.pause(600)
      .type('\n\nThank you, transmission received.')
      .chain();
  }, 500);
}

/* ── Main init ── */
export function initContact() {
  const container = document.getElementById('contact-form');
  if (!container) return;

  const { frag, form, logContainer, submitBtn } = buildFormHTML();
  container.append(frag);

  /* ── Magnetic effect on submit button ── */
  makeMagnetic(submitBtn, { strength: 0.3 });

  /* ── Submit handler ── */
  form.addEventListener('submit', (e) =>
    handleSubmit(e, form, logContainer)
  );
}
