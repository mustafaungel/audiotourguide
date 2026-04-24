// Scroll position memory using sessionStorage.
// Used to restore list scroll positions when navigating back from detail pages.

const PREFIX = 'scroll-mem:';

export function saveScrollPosition(key: string, y: number): void {
  try {
    sessionStorage.setItem(PREFIX + key, String(y));
  } catch {
    // ignore storage errors (private mode, quota)
  }
}

export function readScrollPosition(key: string): number | null {
  try {
    const v = sessionStorage.getItem(PREFIX + key);
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearScrollPosition(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Smoothly scrolls to a given Y position. Falls back to instant if reduced motion.
 */
export function smoothScrollTo(y: number): void {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: y, left: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
}
