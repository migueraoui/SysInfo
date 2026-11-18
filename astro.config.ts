import { defineConfig } from 'astro/config';
import { BASE_PATH, SITE_ORIGIN } from './src/site.config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE_ORIGIN,
  base: BASE_PATH,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    // Feuilles de style petites : intégrées dans la page (aucune requête bloquante).
    inlineStylesheets: 'always',
  },
  devToolbar: {
    enabled: false,
  },
});
