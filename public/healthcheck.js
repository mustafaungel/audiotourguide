(function () {
  try {
    const log = (...args) => console.log('[healthcheck]', ...args);
    const warn = (...args) => console.warn('[healthcheck]', ...args);

    // Add tiny badge to confirm static JS executes before app bundles
    const addBadge = () => {
      const badge = document.createElement('div');
      badge.id = 'healthcheck-badge';
      badge.textContent = 'Static OK';
      badge.style.position = 'fixed';
      badge.style.bottom = '8px';
      badge.style.right = '8px';
      badge.style.zIndex = '2147483647';
      badge.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif';
      badge.style.fontSize = '11px';
      badge.style.padding = '4px 6px';
      badge.style.borderRadius = '6px';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#065f46';
      badge.style.border = '1px solid rgba(16, 185, 129, 0.35)';
      badge.style.pointerEvents = 'none';
      document.body.appendChild(badge);
    };

    // Ensure #root has a visible placeholder if app bundle doesn't run
    const ensureRootPlaceholder = () => {
      const root = document.getElementById('root');
      if (root && root.childNodes.length === 0 && root.textContent?.trim() === '') {
        root.textContent = 'Loading app…';
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        addBadge();
        ensureRootPlaceholder();
        log('index.html served and healthcheck.js executed (DOMContentLoaded)');
      });
    } else {
      addBadge();
      ensureRootPlaceholder();
      log('index.html served and healthcheck.js executed');
    }
  } catch (e) {
    console.warn('[healthcheck] failed to run', e);
  }
})();
