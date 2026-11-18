#!/usr/bin/env node
/** Vérifie le contenu avant le build : `npm run validate`. */
import { reportContent } from './lib/content-check.mjs';

process.exit(reportContent() ? 0 : 1);
