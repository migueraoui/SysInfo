#!/usr/bin/env node
/**
 * Publie un document (un commit = un document).
 *
 *   npm run publish -- <seance> <cours|td|corrige> [cheminPdf] [--force] [--yes] [--date AAAA-MM-JJ]
 *
 * Exemples :
 *   npm run publish -- 2 td
 *   npm run publish -- 2 cours
 *   npm run publish -- 3 td D:\\Documents\\TD_SI_03_v2.pdf --force
 *   npm run publish -- 2 corrige --yes
 *
 * Sans chemin, le PDF est pris dans private/source/SI_Programme/Seance_NN/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { DOCS_DIR, DOC_TYPES, ROOT, SEANCES_DIR, checkContent, pad2 } from './lib/content-check.mjs';

const SOURCE_DIR = path.join(ROOT, 'private', 'source', 'SI_Programme');
const TYPE_ORDER = { cours: 0, td: 1, corrige: 2 };
const SOURCE_NAMES = {
  cours: (nn) => `Cours_SI_${nn}.pdf`,
  td: (nn) => `TD_SI_${nn}.pdf`,
  corrige: (nn) => `Corrige_TD_SI_${nn}.pdf`,
};
const LABELS = {
  cours: (n) => `Cours ${n}`,
  td: (n) => `TD${n}`,
  corrige: (n) => `Corrigé TD${n}`,
};

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function fail(message) {
  console.error(`\n${c.red('✖')} ${message}\n`);
  process.exit(1);
}

function usage() {
  console.log(`
Usage : npm run publish -- <seance> <cours|td|corrige> [cheminPdf] [options]

Options :
  --force              remplace un PDF déjà publié
  --yes                confirme la publication d'un corrigé (le fichier devient public)
  --date AAAA-MM-JJ    date affichée (par défaut : aujourd'hui, heure d'Alger)

Exemples :
  npm run publish -- 2 td
  npm run publish -- 2 cours
  npm run publish -- 2 corrige --yes
`);
}

function todayAlgiers() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/* ---------- Arguments ---------- */

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  usage();
  process.exit(argv.length === 0 ? 1 : 0);
}

const flags = { force: false, yes: false, date: undefined };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--force') flags.force = true;
  else if (a === '--yes' || a === '-y') flags.yes = true;
  else if (a === '--date') flags.date = argv[++i];
  else if (a.startsWith('--date=')) flags.date = a.slice('--date='.length);
  else if (a.startsWith('--')) fail(`Option inconnue : ${a}`);
  else positional.push(a);
}

const [seanceArg, typeArg, pdfArg] = positional;
const numero = Number.parseInt(seanceArg ?? '', 10);
if (!Number.isInteger(numero) || numero < 1 || numero > 99 || String(numero) !== String(Number(seanceArg))) {
  fail(`Numéro de séance invalide : « ${seanceArg ?? ''} » (entier entre 1 et 99).`);
}
const type = (typeArg ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
if (!DOC_TYPES.includes(type)) fail(`Type invalide : « ${typeArg ?? ''} » (cours | td | corrige).`);

const date = flags.date ?? todayAlgiers();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !new Date(`${date}T00:00:00Z`).toISOString().startsWith(date)) {
  fail(`Date invalide : « ${date} » (format AAAA-MM-JJ).`);
}

const nn = pad2(numero);
const label = LABELS[type](numero);

/* ---------- Corrigé : confirmation obligatoire ---------- */

if (type === 'corrige') {
  console.warn(
    `\n${c.yellow('⚠  ATTENTION')} : vous publiez le ${c.bold(label)}.\n` +
      `   Ce fichier devient PUBLIC : toute personne qui connaît l'adresse du site pourra le lire,\n` +
      `   et il restera dans l'historique Git même si vous le retirez plus tard.`,
  );
  if (!flags.yes) fail('Publication annulée. Relancez la commande avec --yes pour confirmer.');
}

/* ---------- Fichier source ---------- */

let source;
if (pdfArg) {
  source = path.resolve(process.cwd(), pdfArg);
} else {
  if (!fs.existsSync(SOURCE_DIR)) {
    fail(
      `Dossier source introuvable : ${path.relative(ROOT, SOURCE_DIR)}\n` +
        `  Extrayez l'archive dans private/source/ (voir README) ou indiquez le chemin du PDF.`,
    );
  }
  source = path.join(SOURCE_DIR, `Seance_${nn}`, SOURCE_NAMES[type](nn));
}
if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail(`Fichier introuvable : ${source}`);
if (/fiche/i.test(path.basename(source))) fail(`Refusé : « ${path.basename(source)} » est une fiche enseignant (privée).`);
if (type !== 'corrige' && /corrig/i.test(path.basename(source))) {
  fail(`Le fichier « ${path.basename(source)} » semble être un corrigé, mais le type demandé est « ${type} ».`);
}

const buffer = fs.readFileSync(source);
if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') fail(`Ce fichier n'est pas un PDF : ${source}`);
let pages;
try {
  const pdf = await PDFDocument.load(buffer, { updateMetadata: false, ignoreEncryption: true });
  pages = pdf.getPageCount();
  const author = pdf.getAuthor();
  if (author && author.trim()) {
    console.warn(
      `\n${c.yellow('⚠')}  Les métadonnées du PDF contiennent un auteur : « ${author} ».\n` +
        `   Ce nom sera visible dans les propriétés du fichier. Retirez-le à la source si nécessaire.`,
    );
  }
} catch (e) {
  fail(`PDF illisible (${e.message}) : ${source}`);
}

/* ---------- Séance ---------- */

const jsonPath = path.join(SEANCES_DIR, `${nn}.json`);
if (!fs.existsSync(jsonPath)) {
  fail(
    `La séance ${numero} n'existe pas (${path.relative(ROOT, jsonPath)}).\n` +
      `  Créez-la d'abord : npm run new-seance -- ${numero} <chapitre> "<titre>"`,
  );
}
const originalJson = fs.readFileSync(jsonPath, 'utf8');
const seance = JSON.parse(originalJson);

/* ---------- Copie ---------- */

const fichier = `seance-${nn}/${type}-${nn}.pdf`;
const dest = path.join(DOCS_DIR, `seance-${nn}`, `${type}-${nn}.pdf`);
const existed = fs.existsSync(dest);
if (existed && !flags.force) {
  fail(`${path.relative(ROOT, dest)} existe déjà. Ajoutez --force pour le remplacer.`);
}
const previousPdf = existed ? fs.readFileSync(dest) : null;

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(source, dest); // copie : le fichier source n'est jamais déplacé

/* ---------- Mise à jour du JSON ---------- */

const documents = Array.isArray(seance.documents) ? seance.documents.filter((d) => d.type !== type) : [];
documents.push({ type, fichier, date });
documents.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
seance.documents = documents;
fs.writeFileSync(jsonPath, `${JSON.stringify(seance, null, 2)}\n`, 'utf8');

/* ---------- Validation (avec retour arrière en cas d'erreur) ---------- */

const { errors } = checkContent();
if (errors.length) {
  fs.writeFileSync(jsonPath, originalJson, 'utf8');
  if (previousPdf) fs.writeFileSync(dest, previousPdf);
  else {
    fs.rmSync(dest, { force: true });
    if (fs.readdirSync(path.dirname(dest)).length === 0) fs.rmdirSync(path.dirname(dest));
  }
  console.error(`\n${c.red('✖')} Validation échouée, modifications annulées :`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

/* ---------- Résumé ---------- */

const kb = (buffer.length / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const verb = existed ? 'remplacé' : 'publié';
const message = `content(seance-${nn}): ${existed ? 'mettre à jour' : 'publier'} ${label}`;

console.log(`
${c.green('✔')} ${c.bold(label)} ${verb} : public/docs/${fichier} (${pages} page${pages > 1 ? 's' : ''}, ${kb} Ko, daté du ${date})
${c.green('✔')} src/content/seances/${nn}.json mis à jour
${c.green('✔')} Contenu validé

Étapes suivantes :
  ${c.dim('# (facultatif) vérifier le site en local : npm run dev')}
  git add -A && git commit -m "${message}"
  git push

${c.dim('Windows PowerShell 5 ne connaît pas « && » : lancez alors les deux commandes git l’une après l’autre :')}
  ${c.dim(`git add -A`)}
  ${c.dim(`git commit -m "${message}"`)}
`);
