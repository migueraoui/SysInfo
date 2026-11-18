import type { APIRoute } from 'astro';
import { url } from '../lib/url';
import { MODULE, THEME_COLOR } from '../site.config';

/** Manifeste généré au build : les chemins tiennent compte du chemin de base. */
export const GET: APIRoute = () => {
  const manifest = {
    name: `${MODULE.nom} — ${MODULE.niveauCourt}`,
    short_name: 'Systèmes d’info',
    description: MODULE.description,
    lang: 'fr',
    dir: 'ltr',
    id: url('/'),
    start_url: url('/'),
    scope: url('/'),
    display: 'standalone',
    background_color: '#EBF0F7',
    theme_color: THEME_COLOR,
    icons: [
      { src: url('/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: url('/icon-512.png'), sizes: '512x512', type: 'image/png' },
      { src: url('/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
