const TZ = 'Africa/Algiers';

/** « 15 novembre 2026 » à partir d'une date ISO « 2026-11-15 ». */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d);
}

/** « 15 nov. 2026 » */
export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(d);
}

/** Date du build, affichée dans le pied de page. */
export function buildDateLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(
    new Date(),
  );
}

/** Date du jour (fuseau Africa/Algiers) au format AAAA-MM-JJ. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
}

/** Taille lisible : « 64,8 Ko », « 1,2 Mo ». */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toLocaleString('fr-FR', { maximumFractionDigits: kb < 100 ? 1 : 0 })} Ko`;
  const mb = kb / 1024;
  return `${mb.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n > 1 ? plural : singular}`;
}
