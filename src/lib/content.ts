/**
 * Accès au contenu (collections Astro) enrichi au moment du build :
 * nombre de pages (pdf-lib), taille (fs), libellés, URL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { PDFDocument } from 'pdf-lib';
import { absoluteUrl, docHref, url } from './url';
import { formatDate, formatSize, pad2 } from './format';
import type { DocInfo, DocType, SeanceSummary } from './types';

const DOCS_DIR = path.resolve(process.cwd(), 'public', 'docs');

const TYPE_ORDER: Record<DocType, number> = { cours: 0, td: 1, corrige: 2 };

export function docLabel(type: DocType, numero: number): string {
  switch (type) {
    case 'cours':
      return `Cours ${numero}`;
    case 'td':
      return `TD${numero}`;
    case 'corrige':
      return `Corrigé TD${numero}`;
  }
}

export function downloadName(type: DocType, numero: number): string {
  const nn = pad2(numero);
  switch (type) {
    case 'cours':
      return `SI_Cours_${nn}.pdf`;
    case 'td':
      return `SI_TD_${nn}.pdf`;
    case 'corrige':
      return `SI_Corrige_TD_${nn}.pdf`;
  }
}

export const seanceSlug = (numero: number): string => pad2(numero);
export const seanceHref = (numero: number): string => url(`/seances/${seanceSlug(numero)}/`);

/* ---------- Lecture des PDF (avec cache) ---------- */

const pdfCache = new Map<string, { mtime: number; pages: number; size: number }>();

async function pdfInfo(fichier: string, seance: number): Promise<{ pages: number; size: number }> {
  const full = path.join(DOCS_DIR, ...fichier.split('/'));
  if (!fs.existsSync(full)) {
    throw new Error(
      `[contenu] Séance ${seance} : le fichier « public/docs/${fichier} » est introuvable. ` +
        `Publiez-le avec « npm run publish » ou corrigez src/content/seances/${pad2(seance)}.json.`,
    );
  }
  const stat = fs.statSync(full);
  const cached = pdfCache.get(full);
  if (cached && cached.mtime === stat.mtimeMs) return cached;
  let pages: number;
  try {
    const doc = await PDFDocument.load(fs.readFileSync(full), { updateMetadata: false, ignoreEncryption: true });
    pages = doc.getPageCount();
  } catch (e) {
    throw new Error(`[contenu] « public/docs/${fichier} » n'est pas un PDF lisible : ${(e as Error).message}`);
  }
  const info = { mtime: stat.mtimeMs, pages, size: stat.size };
  pdfCache.set(full, info);
  return info;
}

/* ---------- Séances ---------- */

type SeanceEntry = CollectionEntry<'seances'>;

async function toSummary(entry: SeanceEntry): Promise<SeanceSummary> {
  const s = entry.data;
  if (entry.id !== pad2(s.numero)) {
    throw new Error(`[contenu] src/content/seances/${entry.id}.json : « numero » vaut ${s.numero}.`);
  }
  const docs = [...s.documents].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
  const documents: DocInfo[] = await Promise.all(
    docs.map(async (d) => {
      const { pages, size } = await pdfInfo(d.fichier, s.numero);
      const anchor = `${d.type}-${pad2(s.numero)}`;
      return {
        type: d.type,
        label: docLabel(d.type, s.numero),
        anchor,
        seance: s.numero,
        chapitre: s.chapitre,
        seanceTitre: s.titre,
        fichier: d.fichier,
        date: d.date,
        dateLabel: formatDate(d.date),
        href: docHref(d.fichier),
        downloadName: downloadName(d.type, s.numero),
        pages,
        size,
        sizeLabel: formatSize(size),
        seanceHref: seanceHref(s.numero),
        shareUrl: absoluteUrl(`/seances/${pad2(s.numero)}/#${anchor}`),
      } satisfies DocInfo;
    }),
  );
  return {
    numero: s.numero,
    slug: seanceSlug(s.numero),
    chapitre: s.chapitre,
    titre: s.titre,
    resume: s.resume,
    motsCles: s.motsCles,
    href: seanceHref(s.numero),
    documents,
    publiee: documents.length > 0,
  };
}

export async function getSeances(): Promise<SeanceSummary[]> {
  const entries = await getCollection('seances');
  const summaries = await Promise.all(entries.map(toSummary));
  const chapitres = new Set((await getChapitres()).map((c) => c.numero));
  for (const s of summaries) {
    if (!chapitres.has(s.chapitre)) {
      throw new Error(`[contenu] Séance ${s.numero} : chapitre ${s.chapitre} absent de src/content/chapitres.json.`);
    }
  }
  return summaries.sort((a, b) => a.numero - b.numero);
}

/** Tous les documents publiés, du plus récent au plus ancien. */
export async function getAllDocuments(filter?: DocType): Promise<DocInfo[]> {
  const docs = (await getSeances()).flatMap((s) => s.documents);
  return docs
    .filter((d) => !filter || d.type === filter)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.seance - a.seance || TYPE_ORDER[b.type] - TYPE_ORDER[a.type],
    );
}

/* ---------- Chapitres & annonces ---------- */

export async function getChapitres() {
  const entries = await getCollection('chapitres');
  return entries.map((e) => e.data).sort((a, b) => a.numero - b.numero);
}

export async function getAnnonces() {
  const entries = await getCollection('annonces');
  return entries.sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}
