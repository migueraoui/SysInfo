/**
 * Configuration unique du site.
 *
 * Pour héberger le site ailleurs, modifier seulement GITHUB_USER et REPO :
 *  - dépôt « <user>.github.io »  → site servi à la racine (base = "/")
 *  - tout autre nom de dépôt     → site servi sous « /<repo>/ »
 * Attention : GitHub Pages respecte la casse (« SysInfo » ≠ « sysinfo »).
 */
export const GITHUB_USER = 'migueraoui';
export const REPO = 'SysInfo';

const isUserSite = REPO.toLowerCase() === `${GITHUB_USER}.github.io`.toLowerCase();

/** Origine du site (sans chemin), utilisée par Astro (`site`). */
export const SITE_ORIGIN = `https://${GITHUB_USER}.github.io`;
/** Chemin de base (sans barre finale), utilisé par Astro (`base`). */
export const BASE_PATH = isUserSite ? '/' : `/${REPO}`;

/** Informations affichées sur le site. Aucun nom de personne ici. */
export const MODULE = {
  nom: "Systèmes d'information",
  nomCourt: 'SI',
  institution: 'Centre universitaire Nour Bachir – El Bayadh',
  departement: "Département d'informatique",
  niveau: '2ᵉ année Licence Informatique',
  niveauCourt: 'L2 Informatique',
  semestre: 'S3',
  annee: '2026/2027',
  credits: 4,
  coefficient: 2,
  prealables: ['Algorithmique'],
  evaluation: { examen: 60, controleContinu: 40 },
  description:
    "Cours, TD et programme du module Systèmes d'information — 2ᵉ année Licence Informatique (S3), Centre universitaire Nour Bachir – El Bayadh, 2026/2027.",
} as const;

export const THEME_COLOR = '#1B365D';
