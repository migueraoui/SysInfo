export const DOC_TYPES = ['cours', 'td', 'corrige'] as const;
export type DocType = (typeof DOC_TYPES)[number];

/** Document enrichi au moment du build (pages, taille, URL…). */
export interface DocInfo {
  type: DocType;
  /** « Cours 1 », « TD1 », « Corrigé TD1 » */
  label: string;
  /** Identifiant d'ancre dans la page de la séance, ex. « td-01 ». */
  anchor: string;
  seance: number;
  chapitre: number;
  seanceTitre: string;
  fichier: string;
  date: string;
  dateLabel: string;
  href: string;
  downloadName: string;
  pages: number;
  size: number;
  sizeLabel: string;
  /** URL de la page de la séance (avec base). */
  seanceHref: string;
  /** URL absolue de partage (page de la séance + ancre). */
  shareUrl: string;
}

export interface SeanceSummary {
  numero: number;
  slug: string;
  chapitre: number;
  titre: string;
  resume: string;
  motsCles: string[];
  href: string;
  documents: DocInfo[];
  publiee: boolean;
}
