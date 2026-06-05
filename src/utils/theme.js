export const THEME_STORAGE_KEY = 'theme-preference';

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY);
}

export function resolveTheme(saved = getSavedTheme()) {
  if (saved === 'dark' || saved === 'light') return saved;
  return getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f2f7');
  }
}

export function initTheme() {
  const theme = resolveTheme();
  applyTheme(theme);
  return theme;
}

export function setThemePreference(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}
