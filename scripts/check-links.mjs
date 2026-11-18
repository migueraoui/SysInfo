#!/usr/bin/env node
/**
 * Vérifie, dans dist/, que chaque lien interne, chaque ressource et chaque PDF
 * pointe vers un fichier existant, en tenant compte du chemin de base.
 * Vérifie aussi les ancres (#id) des pages internes.
 *
 *   npm run build && npm run linkcheck
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

// Lit GITHUB_USER et REPO dans src/site.config.ts (même logique que le site).
const cfg = fs.readFileSync(path.join(ROOT, 'src', 'site.config.ts'), 'utf8');
const user = cfg.match(/GITHUB_USER\s*=\s*'([^']+)'/)?.[1];
const repo = cfg.match(/REPO\s*=\s*'([^']+)'/)?.[1];
if (!user || !repo) {
  console.error('Impossible de lire GITHUB_USER / REPO dans src/site.config.ts');
  process.exit(1);
}
const isUserSite = repo.toLowerCase() === `${user}.github.io`.toLowerCase();
const ORIGIN = `https://${user}.github.io`;
const BASE = isUserSite ? '/' : `/${repo}/`;

if (!fs.existsSync(DIST)) {
  console.error('dist/ introuvable : lancez d’abord « npm run build ».');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const idCache = new Map();

function idsOf(file) {
  if (!idCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

/** Résout un chemin absolu (avec base) vers un fichier de dist/, ou null. */
function resolveTarget(pathname) {
  if (!pathname.startsWith(BASE)) return null;
  const rel = decodeURIComponent(pathname.slice(BASE.length));
  const candidates = [];
  if (rel === '' || rel.endsWith('/')) candidates.push(path.join(DIST, rel, 'index.html'));
  else candidates.push(path.join(DIST, rel), path.join(DIST, rel, 'index.html'), path.join(DIST, `${rel}.html`));
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

const ATTRS = /\s(href|src|data|content|data-preview-src|data-share-url)="([^"]*)"/g;
const errors = [];
let checked = 0;

function checkUrl(raw, from, attr) {
  const where = `${path.relative(DIST, from).split(path.sep).join('/')} [${attr}="${raw}"]`;
  let value = raw.replaceAll('&amp;', '&').trim();
  if (!value || /^(mailto:|tel:|data:|javascript:)/i.test(value)) return;

  if (/^https?:\/\//i.test(value)) {
    if (!value.startsWith(`${ORIGIN}/`)) return; // lien externe : non vérifié
    value = value.slice(ORIGIN.length);
  } else if (attr === 'content') {
    return; // <meta content="…"> non-URL
  }

  const [beforeHash, hash] = value.split('#');
  const pathname = beforeHash.split('?')[0];

  if (pathname === '') {
    // ancre dans la même page
    if (hash && !idsOf(from).has(hash)) errors.push(`${where} : ancre #${hash} introuvable`);
    checked++;
    return;
  }
  if (!pathname.startsWith('/')) {
    errors.push(`${where} : lien relatif (doit passer par url() et le chemin de base ${BASE})`);
    return;
  }
  if (!pathname.startsWith(BASE)) {
    errors.push(`${where} : chemin sans la base ${BASE}`);
    return;
  }
  const target = resolveTarget(pathname);
  checked++;
  if (!target) {
    errors.push(`${where} : cible introuvable dans dist/`);
    return;
  }
  if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
    errors.push(`${where} : ancre #${hash} introuvable dans ${path.relative(DIST, target)}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(ATTRS)) checkUrl(m[2], file, m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) checkUrl(part.trim().split(/\s+/)[0], file, 'srcset');
  }
}

// Manifeste
const manifestFile = path.join(DIST, 'site.webmanifest');
if (fs.existsSync(manifestFile)) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  for (const u of [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)]) {
    checkUrl(u, manifestFile, 'manifest');
  }
} else {
  errors.push('dist/site.webmanifest manquant');
}

// Fichiers CSS : url(...) internes
for (const css of files.filter((f) => f.endsWith('.css'))) {
  const text = fs.readFileSync(css, 'utf8');
  for (const m of text.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    if (m[2].startsWith('/')) checkUrl(m[2], css, 'css url');
  }
}

if (errors.length) {
  console.error(`\n✖ ${errors.length} lien(s) cassé(s) :`);
  for (const e of [...new Set(errors)]) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ ${checked} liens vérifiés dans ${htmlFiles.length} pages (base « ${BASE} ») : aucun lien cassé.`);
