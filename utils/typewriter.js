/**
 * Typewriter — token-by-token text animation mimicking LLM generation.
 * Uses requestAnimationFrame for smooth, cancelable typing.
 *
 * Design tokens referenced:
 *   --accent-cyan, --font-mono, --text-muted, --text-primary
 * Global state: window.portfolio.reducedMotion
 */

const CURSOR_BLINK_MS = 530;
const PUNCTUATION_PAUSE_LONG = 300;  // . ! ?
const PUNCTUATION_PAUSE_SHORT = 120; // , ;
const THINKING_INTERVAL_MIN = 15;
const THINKING_INTERVAL_MAX = 25;
const THINKING_PAUSE_MIN = 300;
const THINKING_PAUSE_MAX = 800;
const DELETE_DELAY = 30;

const DEFAULT_OPTIONS = {
  speed: 35,
  variance: 0.5,
  pauseOnPunctuation: PUNCTUATION_PAUSE_LONG,
  thinkingMode: false,
  cursor: true,
  cursorChar: '\u2588',
  onComplete: null,
  onToken: null,
};

const BLINK_KEYFRAMES = `@keyframes tw-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}`;

export class Typewriter {
  /**
   * @param {HTMLElement} element - DOM element to write into.
   * @param {object}      options - See DEFAULT_OPTIONS above.
   */
  constructor(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new TypeError('Typewriter requires a valid HTMLElement');
    }

    this.element = element;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    /** @type {string} Internal text buffer (HTML-free plain text). */
    this._text = '';

    /** @type {Array<{type:string, value?:string, ms?:number, count?:number}>} */
    this._queue = [];

    this._isRunning = false;
    this._rafId = null;
    this._destroyed = false;

    /** @type {'idle'|'typing'|'thinking'|'pausing'} */
    this._phase = 'idle';
    this._phaseUntil = 0;
    this._thinkingRestore = '';
    this._opIndex = 0;

    this._cursorEl = null;
    this._cursorVisible = false;
    this._styleEl = null;

    this._reducedMotion =
      window.portfolio?.reducedMotion === true;

    this._initCursor();
    this._injectBlinkStyle();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Queue text to be typed token-by-token.
   * Returns `this` for chaining.
   */
  type(text) {
    if (this._destroyed) return this;
    if (!text) return this;

    if (this._reducedMotion) {
      this._appendText(text);
      return this;
    }

    const tokens = this._tokenize(text);
    for (const token of tokens) {
      this._queue.push({ type: 'token', value: token });
    }

    if (this.options.thinkingMode) {
      this._injectThinkingPauses(tokens.length);
    }

    this._start();
    return this;
  }

  /**
   * Queue a pause for `ms` milliseconds.
   */
  pause(ms) {
    if (this._destroyed) return this;
    this._queue.push({ type: 'pause', ms });
    this._start();
    return this;
  }

  /**
   * Queue deletion of `n` characters.
   */
  delete(n) {
    if (this._destroyed) return this;
    this._queue.push({ type: 'delete', count: n });
    this._start();
    return this;
  }

  /**
   * Queue a full clear of the element text.
   */
  clear() {
    if (this._destroyed) return this;
    this._queue.push({ type: 'clear' });
    this._start();
    return this;
  }

  /** Convenience — returns `this` so calls can be chained naturally. */
  chain() {
    return this;
  }

  /**
   * Cancel all pending operations and remove cursor. Safe to call
   * multiple times.
   */
  destroy() {
    this._destroyed = true;
    this._isRunning = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._cursorEl) {
      this._cursorEl.remove();
      this._cursorEl = null;
    }
    if (this._styleEl) {
      this._styleEl.remove();
      this._styleEl = null;
    }
    this._queue = [];
    this._phase = 'idle';
  }

  /* ------------------------------------------------------------------ */
  /*  Internal                                                           */
  /* ------------------------------------------------------------------ */

  /** Split text into variable-length "tokens" (1-3 chars each). */
  _tokenize(text) {
    const tokens = [];
    let i = 0;
    const len = text.length;
    while (i < len) {
      const remaining = len - i;
      // Weight toward shorter tokens at the end to avoid a lonely final char
      const maxLen = remaining <= 1 ? 1 : Math.min(3, remaining);
      const tokenLen = Math.min(
        Math.floor(Math.random() * maxLen) + 1,
        remaining,
      );
      tokens.push(text.slice(i, i + tokenLen));
      i += tokenLen;
    }
    return tokens;
  }

  /** Insert random thinking pauses distributed across the token queue. */
  _injectThinkingPauses(totalTokens) {
    if (totalTokens < THINKING_INTERVAL_MIN) return;

    // Determine how many pauses to insert
    const interval =
      THINKING_INTERVAL_MIN +
      Math.floor(Math.random() * (THINKING_INTERVAL_MAX - THINKING_INTERVAL_MIN + 1));
    const pauseCount = Math.floor(totalTokens / interval);

    // Work backwards so indices stay valid
    const insertions = [];
    for (let p = 1; p <= pauseCount; p++) {
      const tokenIndex = p * interval + (p - 1); // account for previously inserted pauses
      if (tokenIndex < this._queue.length) {
        insertions.push(tokenIndex);
      }
    }

    for (const idx of insertions.sort((a, b) => b - a)) {
      const pauseMs =
        THINKING_PAUSE_MIN +
        Math.floor(Math.random() * (THINKING_PAUSE_MAX - THINKING_PAUSE_MIN + 1));
      this._queue.splice(idx, 0, { type: 'thinking-pause', ms: pauseMs });
    }
  }

  /** Append plain text to the display buffer. */
  _appendText(text) {
    this._text += text;
    this._syncDOM();
  }

  /** Remove the last `n` characters from the display buffer. */
  _deleteChars(n) {
    this._text = this._text.slice(0, Math.max(0, this._text.length - n));
    this._syncDOM();
  }

  /** Sync the element textContent (preserving cursor position). */
  _syncDOM() {
    if (this._destroyed) return;
    // Temporarily remove cursor to avoid textContent destroying it
    const cursor = this._cursorEl;
    if (cursor) {
      try { this.element.removeChild(cursor); } catch (_) { /* not attached */ }
    }
    this.element.textContent = this._text;
    if (cursor) {
      this.element.insertAdjacentElement('beforeend', cursor);
    }
  }

  /* ---- Cursor ---- */

  _injectBlinkStyle() {
    if (this._styleEl) return;
    if (document.getElementById('tw-blink-style')) return;
    this._styleEl = document.createElement('style');
    this._styleEl.id = 'tw-blink-style';
    this._styleEl.textContent = BLINK_KEYFRAMES;
    document.head.appendChild(this._styleEl);
  }

  _initCursor() {
    if (!this.options.cursor) return;
    const el = document.createElement('span');
    el.className = 'tw-cursor';
    el.textContent = this.options.cursorChar;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = [
      'display:inline-block',
      'opacity:1',
      'animation:tw-blink ' + CURSOR_BLINK_MS + 'ms step-end infinite',
      'color:var(--accent-cyan,#00e5ff)',
      'font-family:var(--font-mono,monospace)',
      'user-select:none',
      'pointer-events:none',
    ].join(';');
    this._cursorEl = el;
    this._hideCursor();
    this.element.insertAdjacentElement('beforeend', el);
  }

  _showCursor() {
    if (this._cursorEl && !this._cursorVisible) {
      this._cursorEl.style.display = 'inline-block';
      this._cursorVisible = true;
    }
  }

  _hideCursor() {
    if (this._cursorEl && this._cursorVisible !== false) {
      this._cursorEl.style.display = 'none';
      this._cursorVisible = false;
    }
  }

  /* ---- RAF loop ---- */

  _start() {
    if (this._isRunning) return;
    if (this._reducedMotion) return;
    this._isRunning = true;
    this._phase = 'idle';
    this._opIndex = 0;
    this._hideCursor();
    this._rafId = requestAnimationFrame(this._tick);
  }

  _tick = (timestamp) => {
    if (this._destroyed || !this._isRunning) {
      this._isRunning = false;
      return;
    }

    // Handle timed phases (thinking pause, regular pause)
    if (this._phase === 'thinking' || this._phase === 'pausing') {
      if (timestamp >= this._phaseUntil) {
        if (this._phase === 'thinking') {
          // Restore text that was displayed before "▋ thinking..."
          this._text = this._thinkingRestore;
          this._syncDOM();
        }
        this._phase = 'idle';
        this._opIndex++;
      }
    }

    // Process next operation when idle
    if (this._phase === 'idle') {
      if (this._opIndex >= this._queue.length) {
        // Queue is empty — stop
        this._isRunning = false;
        this._rafId = null;
        this._showCursor();
        if (typeof this.options.onComplete === 'function') {
          this.options.onComplete();
        }
        return;
      }

      const op = this._queue[this._opIndex];
      let delay = 0;

      switch (op.type) {
        case 'token': {
          this._appendText(op.value);
          if (typeof this.options.onToken === 'function') {
            this.options.onToken(op.value);
          }

          // Base delay with variance
          const variance = 1 + (Math.random() - 0.5) * 2 * this.options.variance;
          delay = this.options.speed * Math.max(0.25, variance);

          // Extra pause after punctuation
          const lastChar = op.value[op.value.length - 1];
          if (lastChar && '!?'.includes(lastChar)) {
            delay += this.options.pauseOnPunctuation;
          } else if (lastChar === '.') {
            // Period is special — longer pause (sentence end)
            delay += this.options.pauseOnPunctuation;
          } else if (lastChar && ',;'.includes(lastChar)) {
            delay += PUNCTUATION_PAUSE_SHORT;
          }

          this._phaseUntil = timestamp + delay;
          this._phase = 'pausing';
          this._opIndex++;
          break;
        }

        case 'thinking-pause': {
          // Save current text and overlay thinking indicator
          this._thinkingRestore = this._text;
          this._text = '\u258B thinking...';
          this._syncDOM();

          this._phaseUntil = timestamp + op.ms;
          this._phase = 'thinking';
          break;
        }

        case 'pause': {
          this._phaseUntil = timestamp + op.ms;
          this._phase = 'pausing';
          this._opIndex++;
          break;
        }

        case 'delete': {
          this._deleteChars(op.count);
          this._phaseUntil = timestamp + DELETE_DELAY;
          this._phase = 'pausing';
          this._opIndex++;
          break;
        }

        case 'clear': {
          this._text = '';
          this._syncDOM();
          this._phaseUntil = timestamp + DELETE_DELAY;
          this._phase = 'pausing';
          this._opIndex++;
          break;
        }

        default:
          this._opIndex++;
          break;
      }
    }

    this._rafId = requestAnimationFrame(this._tick);
  };
}
