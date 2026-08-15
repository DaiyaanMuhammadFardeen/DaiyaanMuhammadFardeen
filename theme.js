/**
 * theme.js — System dark/light mode detection and dynamic switching
 * Frontend.Systems Portfolio
 */

const STORAGE_KEY = 'frontend-systems-theme';

export function initTheme() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  function applyTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Check localStorage override first, then system preference
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored);
  } else {
    applyTheme(mediaQuery.matches);
  }

  // Listen for system changes
  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set a manual override
    if (!localStorage.getItem('frontend-systems-theme-override')) {
      applyTheme(e.matches);
    }
  });
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEY, next);
  localStorage.setItem('frontend-systems-theme-override', 'true');
  return next;
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}
