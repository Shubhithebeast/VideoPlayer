const THEME_KEY = "streamx_theme";
const VALID_THEME_MODES = ["light", "dark", "system"];

function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function normalizeThemeMode(mode) {
  if (VALID_THEME_MODES.includes(mode)) {
    return mode;
  }
  return "system";
}

function getStoredThemePreference() {
  const stored = localStorage.getItem(THEME_KEY);
  return normalizeThemeMode(stored);
}

function applyThemePreference(mode) {
  const normalized = normalizeThemeMode(mode);
  const shouldUseDark = normalized === "dark" || (normalized === "system" && getSystemPrefersDark());

  document.body.classList.toggle("theme-dark", shouldUseDark);
  localStorage.setItem(THEME_KEY, normalized);

  return normalized;
}

export { THEME_KEY, getStoredThemePreference, applyThemePreference, getSystemPrefersDark };
