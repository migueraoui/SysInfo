/**
 * Tous les liens internes et toutes les URL de PDF passent par ces fonctions,
 * afin que le site fonctionne sous un sous-chemin (ex. /SysInfo/) sur GitHub Pages.
 */

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Ajoute le chemin de base. Les pages reçoivent une barre finale ; les fichiers non. */
export function url(path = '/'): string {
  const [rawPath = '', hash] = path.split('#');
  let p = rawPath.replace(/^\/+/, '');
  const isFile = /\.[a-z0-9]+$/i.test(p);
  if (p && !isFile && !p.endsWith('/')) p += '/';
  return `${BASE}/${p}${hash ? `#${hash}` : ''}`;
}

/** URL absolue (pour canonical, Open Graph, partage). */
export function absoluteUrl(path = '/'): string {
  const site = import.meta.env.SITE;
  if (!site) throw new Error("La propriété `site` doit être définie dans astro.config.ts");
  return new URL(url(path), site).href;
}

/** URL publique d'un PDF à partir de son chemin relatif à public/docs/. */
export function docHref(fichier: string): string {
  return url(`docs/${fichier}`);
}

/** Chemin de la page courante, sans le chemin de base, toujours avec « / » initial et final. */
export function stripBase(pathname: string): string {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/')) p += '/';
  return p;
}

/** Vrai si `href` (sans base, ex. « /seances/ ») correspond à la section de la page courante. */
export function isActive(currentPathname: string, href: string): boolean {
  const current = stripBase(currentPathname);
  if (href === '/') return current === '/';
  return current.startsWith(href);
}
