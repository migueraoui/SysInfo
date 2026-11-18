/** Textes officiels du canevas (objectifs et bibliographie). */

export const OBJECTIFS: string[] = [
  "Comprendre ce qu'est un système d'information d'entreprise.",
  "Comprendre les dimensions constitutives d'un SI : technique, organisationnelle, managériale.",
  "Comprendre les éléments d'un SI : système de pilotage, système décisionnel, système opérationnel.",
  "Comprendre l'articulation du SI avec la stratégie d'entreprise (gouvernance des SI, gestion des projets SI).",
];

export interface Reference {
  auteurs: string;
  titre: string;
  details?: string;
}

export const BIBLIOGRAPHIE: Reference[] = [
  { auteurs: 'P. Vidal, P. Planeix (coord.)', titre: "Systèmes d'information organisationnels" },
  {
    auteurs: 'M.-L. Caron-Fasan, N. Lesca (coord.)',
    titre: "Présent et futurs des systèmes d'information",
    details: 'PUG',
  },
  {
    auteurs: 'M. Kalika et al.',
    titre: "Le e-management : quelles transformations pour l'entreprise ?",
    details: 'Éditions Liaisons',
  },
  { auteurs: 'J.-L. Le Moigne', titre: 'La théorie du système général', details: 'PUF' },
  { auteurs: 'L. von Bertalanffy', titre: 'Théorie générale des systèmes', details: 'Dunod' },
  {
    auteurs: 'X. Castellani',
    titre: "Méthode générale d'analyse d'une application informatique",
    details: 'Masson, 1975',
  },
];
