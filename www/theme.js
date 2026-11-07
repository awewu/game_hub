(() => {
  const THEME_KEY = 'pocket-games-theme';
  let stored;
  try { stored = localStorage.getItem(THEME_KEY); } catch (_) { /* Theme switching also works without storage. */ }
  const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
  document.documentElement.dataset.theme = theme;

  function updateButtons() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#101827' : '#f8f9fc');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.textContent = dark ? '☼' : '☾';
      button.setAttribute('aria-label', dark ? '切换到日间模式' : '切换到夜间模式');
      button.title = dark ? '日间模式' : '夜间模式';
    });
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* Keep the current page usable. */ }
    updateButtons();
    window.dispatchEvent(new CustomEvent('pocket-theme-change', { detail: { theme: next } }));
  }

  window.PocketTheme = { toggle: toggleTheme, update: updateButtons };
  window.addEventListener('storage', event => {
    if (event.key !== THEME_KEY) return;
    document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    updateButtons();
    window.dispatchEvent(new CustomEvent('pocket-theme-change'));
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', toggleTheme));
    updateButtons();
  });
})();
