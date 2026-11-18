#!/usr/bin/env node
/**
 * Vérifie qu'aucun fichier privé n'est publié :
 *  - ni dans dist/ (le site construit),
 *  - ni dans l'index Git (git ls-files), puisque le dépôt est public.
 *
 *   npm run audit:private
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const FORBIDDEN = [
  { re: /(^|\/)private\//, why: 'dossier private/' },
  { re: /(^|\/)Fiche_/i, why: 'fiche enseignant' },
  { re: /(^|\/)Corrige_/, why: 'corrigé source (non publié via npm run publish)' },
  { re: /\.tex$/i, why: 'source LaTeX' },
  { re: /\.sty$/i, why: 'style LaTeX' },
  { re: /\.(zip|rar)$/i, why: 'archive' },
  { re: /(^|\/)Sources_LaTeX\//i, why: 'sources LaTeX' },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const problems = [];
const check = (list, where) => {
  for (const f of list) {
    const hit = FORBIDDEN.find((r) => r.re.test(f));
    if (hit) problems.push(`${where}: ${f} (${hit.why})`);
  }
};

const distFiles = walk(DIST).map((f) => path.relative(DIST, f).split(path.sep).join('/'));
if (distFiles.length === 0) console.warn('(dist/ absent ou vide : lancez « npm run build » pour l’inclure dans la vérification)');
check(distFiles, 'dist');

let gitFiles = [];
try {
  gitFiles = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  console.warn('(git indisponible : index Git non vérifié)');
}
check(gitFiles, 'git');

const corriges = distFiles.filter((f) => /corrige-\d{2}\.pdf$/.test(f));
if (corriges.length) console.log(`ℹ Corrigés publiés volontairement : ${corriges.join(', ')}`);

if (problems.length) {
  console.error(`\n✖ Fichiers privés détectés (${problems.length}) :`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ Aucun fichier privé dans dist/ (${distFiles.length} fichiers) ni dans Git (${gitFiles.length} fichiers suivis).`);
