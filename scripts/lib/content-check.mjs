/**
 * Vérification du contenu, indépendante d'Astro (utilisée par `npm run build`,
 * `npm run check`, `npm run validate` et `npm run publish`).
 *
 * Erreurs bloquantes :
 *  - JSON de séance invalide, numéro ≠ nom de fichier, chapitre inconnu ;
 *  - document mal nommé, en double, date invalide ;
 *  - fichier référencé absent de public/docs/ ;
 *  - PDF présent dans public/docs/ mais référencé nulle part (évite de publier
 *    par erreur un fichier, par exemple un corrigé) ;
 *  - fichier privé (fiche, source LaTeX…) présent dans public/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SEANCES_DIR = path.join(ROOT, 'src', 'content', 'seances');
export const CHAPITRES_FILE = path.join(ROOT, 'src', 'content', 'chapitres.json');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const DOCS_DIR = path.join(PUBLIC_DIR, 'docs');

export const DOC_TYPES = ['cours', 'td', 'corrige'];

/** Motifs de fichiers qui ne doivent jamais se trouver dans public/ (ni dans dist/). */
export const PRIVATE_PATTERNS = [/fiche/i, /\.tex$/i, /\.sty$/i, /\.zip$/i, /\.rar$/i, /sources?_latex/i];

export const pad2 = (n) => String(n).padStart(2, '0');

function isValidIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/** @returns {{ errors: string[], seances: Array<{ file: string, data: any }> }} */
export function checkContent() {
  const errors = [];
  const seances = [];

  // Chapitres
  let chapitreNums = new Set();
  try {
    const chapitres = JSON.parse(fs.readFileSync(CHAPITRES_FILE, 'utf8'));
    if (!Array.isArray(chapitres)) throw new Error('le fichier doit contenir un tableau');
    chapitreNums = new Set(chapitres.map((c) => c.numero));
  } catch (e) {
    errors.push(`${rel(CHAPITRES_FILE)} : ${e.message}`);
  }

  // Séances
  const referenced = new Set();
  const files = fs.existsSync(SEANCES_DIR) ? fs.readdirSync(SEANCES_DIR).filter((f) => f.endsWith('.json')) : [];
  if (files.length === 0) errors.push(`Aucune séance dans ${rel(SEANCES_DIR)}`);

  for (const f of files.sort()) {
    const full = path.join(SEANCES_DIR, f);
    const where = rel(full);
    if (!/^\d{2}\.json$/.test(f)) {
      errors.push(`${where} : le nom doit être de la forme NN.json (ex. 06.json)`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      errors.push(`${where} : JSON invalide (${e.message})`);
      continue;
    }
    seances.push({ file: full, data });

    const nn = f.slice(0, 2);
    if (!Number.isInteger(data.numero) || pad2(data.numero) !== nn) {
      errors.push(`${where} : « numero » (${data.numero}) ne correspond pas au nom du fichier`);
    }
    if (!Number.isInteger(data.chapitre) || !chapitreNums.has(data.chapitre)) {
      errors.push(`${where} : chapitre ${data.chapitre} absent de src/content/chapitres.json`);
    }
    if (typeof data.titre !== 'string' || data.titre.trim().length < 3) errors.push(`${where} : « titre » manquant`);
    if (data.resume !== undefined && typeof data.resume !== 'string') errors.push(`${where} : « resume » doit être un texte`);
    if (!Array.isArray(data.documents)) {
      errors.push(`${where} : « documents » doit être un tableau (vide si la séance est à venir)`);
      continue;
    }
    const types = new Set();
    data.documents.forEach((d, i) => {
      const w = `${where} › documents[${i}]`;
      if (!DOC_TYPES.includes(d?.type)) {
        errors.push(`${w} : type « ${d?.type} » invalide (cours | td | corrige)`);
        return;
      }
      if (types.has(d.type)) errors.push(`${w} : type « ${d.type} » en double`);
      types.add(d.type);
      const attendu = `seance-${nn}/${d.type}-${nn}.pdf`;
      if (d.fichier !== attendu) errors.push(`${w} : fichier « ${d.fichier} », attendu « ${attendu} »`);
      if (!isValidIsoDate(d.date)) errors.push(`${w} : date « ${d.date} » invalide (AAAA-MM-JJ)`);
      if (typeof d.fichier === 'string') {
        referenced.add(d.fichier);
        const pdf = path.join(DOCS_DIR, ...d.fichier.split('/'));
        if (!fs.existsSync(pdf)) errors.push(`${w} : fichier introuvable : public/docs/${d.fichier}`);
      }
    });
  }

  // PDF non référencés dans public/docs/
  for (const p of walk(DOCS_DIR)) {
    const r = path.relative(DOCS_DIR, p).split(path.sep).join('/');
    if (r === '.gitkeep') continue;
    if (!referenced.has(r)) {
      errors.push(`public/docs/${r} : fichier non référencé par une séance (supprimez-le ou publiez-le avec npm run publish)`);
    }
  }

  // Fichiers privés dans public/
  for (const p of walk(PUBLIC_DIR)) {
    const r = rel(p);
    if (PRIVATE_PATTERNS.some((re) => re.test(r))) errors.push(`${r} : fichier privé interdit dans public/`);
  }

  return { errors, seances };
}

/** Affiche le résultat ; renvoie true si tout est valide. */
export function reportContent({ quiet = false } = {}) {
  const { errors, seances } = checkContent();
  if (errors.length) {
    console.error(`\n✖ Contenu invalide (${errors.length} erreur${errors.length > 1 ? 's' : ''}) :`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('');
    return false;
  }
  if (!quiet) {
    const docs = seances.reduce((n, s) => n + s.data.documents.length, 0);
    console.log(`✔ Contenu valide : ${seances.length} séances, ${docs} document(s) publié(s).`);
  }
  return true;
}
