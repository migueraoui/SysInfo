/**
 * JavaScript client minimal, chargé sur toutes les pages :
 *  - bascule du thème clair / sombre (mémorisé dans localStorage) ;
 *  - bouton « Partager » (Web Share API, sinon copie du lien + message).
 */

const STORAGE_KEY = 'si-theme';
const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveTheme(): 'dark' | 'light' {
  const forced = root.dataset.theme;
  if (forced === 'dark' || forced === 'light') return forced;
  return darkQuery.matches ? 'dark' : 'light';
}

function syncToggles(): void {
  const isDark = effectiveTheme() === 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(isDark));
  });
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (meta) meta.content = isDark ? '#0e1726' : '#1b365d';
}

function setTheme(theme: 'dark' | 'light'): void {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* stockage indisponible (navigation privée…) : le choix vaut pour cette page */
  }
  syncToggles();
}

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  if (!target) return;

  if (target.closest('[data-theme-toggle]')) {
    setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
    return;
  }

  const shareBtn = target.closest<HTMLElement>('[data-share]');
  if (shareBtn) {
    void share(shareBtn);
  }
});

darkQuery.addEventListener('change', syncToggles);
syncToggles();

/* ---------- Partage ---------- */

let toastTimer: number | undefined;

function toast(message: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-visible'), 3200);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* presse-papiers refusé : le lien sera affiché dans le message */
  }
  return false;
}

async function share(btn: HTMLElement): Promise<void> {
  const url = btn.dataset.shareUrl ?? window.location.href;
  const title = btn.dataset.shareTitle ?? document.title;
  const text = btn.dataset.shareText ?? title;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // partage annulé
    }
  }

  const copied = await copyText(url);
  toast(copied ? 'Lien copié dans le presse-papiers' : `Copiez ce lien : ${url}`);
}
