import fs from 'node:fs';
import { defineCollection } from 'astro:content';
import { file, glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { DOC_TYPES } from './lib/types';

/* ---------- Champs communs ---------- */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), {
    message: 'Date invalide',
  });

/* ---------- Séances : src/content/seances/NN.json ---------- */

const documentSchema = z.strictObject({
  type: z.enum(DOC_TYPES),
  fichier: z
    .string()
    .regex(
      /^seance-\d{2}\/(cours|td|corrige)-\d{2}\.pdf$/,
      'Chemin attendu : « seance-NN/<cours|td|corrige>-NN.pdf » (relatif à public/docs/)',
    ),
  date: isoDate,
});

const seances = defineCollection({
  loader: glob({ pattern: '[0-9][0-9].json', base: './src/content/seances' }),
  schema: z
    .strictObject({
      numero: z.number().int().min(1).max(99),
      chapitre: z.number().int().min(1),
      titre: z.string().trim().min(3),
      resume: z.string().trim().min(10),
      motsCles: z.array(z.string().trim().min(1)).default([]),
      documents: z.array(documentSchema).default([]),
    })
    .superRefine((s, ctx) => {
      const nn = String(s.numero).padStart(2, '0');
      const seen = new Set<string>();
      s.documents.forEach((d, i) => {
        const attendu = `seance-${nn}/${d.type}-${nn}.pdf`;
        if (d.fichier !== attendu) {
          ctx.addIssue({
            code: 'custom',
            path: ['documents', i, 'fichier'],
            message: `Pour la séance ${s.numero} et le type « ${d.type} », le fichier doit être « ${attendu} »`,
          });
        }
        if (seen.has(d.type)) {
          ctx.addIssue({
            code: 'custom',
            path: ['documents', i, 'type'],
            message: `Type « ${d.type} » présent deux fois dans la séance ${s.numero}`,
          });
        }
        seen.add(d.type);
      });
    }),
});

/* ---------- Chapitres du canevas : src/content/chapitres.json ---------- */

const chapitres = defineCollection({
  loader: file('src/content/chapitres.json'),
  schema: z.strictObject({
    id: z.string().regex(/^\d+$/),
    numero: z.number().int().min(1),
    titre: z.string().trim().min(3),
    items: z
      .array(
        z.strictObject({
          texte: z.string().trim().min(3),
          /** Numéros des séances qui traitent ce point (vide = pas encore traité). */
          seances: z.array(z.number().int().min(1)).default([]),
        }),
      )
      .min(1),
  }),
});

/* ---------- Annonces : src/content/annonces/*.md (facultatives) ---------- */

/**
 * Le chargeur glob() avertit quand le dossier est vide. Les annonces étant
 * facultatives, ce chargeur ne l'utilise que s'il existe au moins un fichier .md.
 */
function annoncesLoader(): Loader {
  const base = './src/content/annonces';
  const inner = glob({ pattern: '**/*.md', base });
  return {
    name: 'annonces-loader',
    load: async (context) => {
      const dir = new URL('src/content/annonces/', context.config.root);
      const hasMarkdown = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md'));
      if (!hasMarkdown) {
        context.store.clear();
        return;
      }
      await inner.load(context);
    },
  };
}

const annonces = defineCollection({
  loader: annoncesLoader(),
  schema: z.strictObject({
    titre: z.string().trim().min(3),
    date: isoDate,
  }),
});

export const collections = { seances, chapitres, annonces };
