import type { IconName } from '../components/Icon.astro';

export interface NavItem {
  /** Chemin sans le chemin de base. */
  path: string;
  label: string;
  icon: IconName;
}

/** Navigation principale (en-tête, bureau). */
export const MAIN_NAV: NavItem[] = [
  { path: '/', label: 'Accueil', icon: 'home' },
  { path: '/seances/', label: 'Séances', icon: 'layers' },
  { path: '/cours/', label: 'Cours', icon: 'book' },
  { path: '/td/', label: 'TD', icon: 'pencil' },
  { path: '/programme/', label: 'Programme', icon: 'list' },
];

/** Barre de navigation inférieure (téléphone) : 4 onglets. */
export const BOTTOM_NAV: NavItem[] = [
  { path: '/', label: 'Accueil', icon: 'home' },
  { path: '/seances/', label: 'Séances', icon: 'layers' },
  { path: '/td/', label: 'TD', icon: 'pencil' },
  { path: '/programme/', label: 'Programme', icon: 'list' },
];
