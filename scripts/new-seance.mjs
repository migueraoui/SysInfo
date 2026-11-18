#!/usr/bin/env node
/**
 * Crée une nouvelle séance (sans document : elle s'affiche « À venir »).
 *
 *   npm run new-seance -- <numero> <chapitre> "<titre>" [--resume "<résumé>"] [--mots "mot1, mot2"]
 *
 * Exemple :
 *   npm run new-seance -- 6 3 "Saisie et contrôle de l'information"
 */
import fs from 'node:fs';
import path from 'node:path';
import { CHAPITRES_FILE, ROOT, SEANCES_DIR, checkContent, pad2 } from './lib/content-check.mjs';

function fail(message) {
  console.error(`\n\x1b[31m✖\x1b[0m ${message}\n`);
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  console.log(`
Usage : npm run new-seance -- <numero> <chapitre> "<titre>" [--resume "<résumé>"] [--mots "mot1, mot2"]

Exemple :
  npm run new-seance -- 6 3 "Saisie et contrôle de l'information"
`);
  process.exit(argv.length === 0 ? 1 : 0);
}

let resume = '';
let mots = [];
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--resume') resume = argv[++i] ?? '';
  else if (a === '--mots') mots = (argv[++i] ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  else if (a.startsWith('--')) fail(`Option inconnue : ${a}`);
  else positional.push(a);
}

const [numArg, chapArg, ...titreParts] = positional;
const numero = Number(numArg);
const chapitre = Number(chapArg);
const titre = titreParts.join(' ').trim();

if (!Number.isInteger(numero) || numero < 1 || numero > 99) fail(`Numéro de séance invalide : « ${numArg ?? ''} ».`);
if (!Number.isInteger(chapitre) || chapitre < 1) fail(`Numéro de chapitre invalide : « ${chapArg ?? ''} ».`);
if (titre.length < 3) fail('Titre manquant. Mettez-le entre guillemets : "Titre de la séance".');

const chapitres = JSON.parse(fs.readFileSync(CHAPITRES_FILE, 'utf8'));
if (!chapitres.some((c) => c.numero === chapitre)) {
  fail(`Le chapitre ${chapitre} n'existe pas dans src/content/chapitres.json.`);
}

const nn = pad2(numero);
const file = path.join(SEANCES_DIR, `${nn}.json`);
if (fs.existsSync(file)) fail(`La séance ${numero} existe déjà : ${path.relative(ROOT, file)}`);

const seance = { numero, chapitre, titre, resume: resume.trim(), motsCles: mots, documents: [] };
fs.writeFileSync(file, `${JSON.stringify(seance, null, 2)}\n`, 'utf8');

const { errors } = checkContent();
if (errors.length) {
  fs.rmSync(file);
  console.error('\n\x1b[31m✖\x1b[0m Validation échouée, séance non créée :');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const message = `content(seance-${nn}): ajouter la séance ${numero}`;
console.log(`
\x1b[32m✔\x1b[0m Séance ${numero} créée : src/content/seances/${nn}.json (chapitre ${chapitre}, « À venir »)
${resume ? '' : '  Astuce : complétez « resume » et « motsCles » dans ce fichier.\n'}
Étapes suivantes :
  git add -A && git commit -m "${message}"
  git push

Puis, pour publier ses documents :
  npm run publish -- ${numero} cours <chemin-du-pdf>
  npm run publish -- ${numero} td <chemin-du-pdf>
`);
