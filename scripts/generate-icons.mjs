#!/usr/bin/env node
/**
 * Génère les icônes et l'image de partage (Open Graph) dans public/.
 * À lancer seulement si l'identité visuelle change : les PNG produits sont commités.
 *   node scripts/generate-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
fs.mkdirSync(pub, { recursive: true });

const NAVY = '#1B365D';
const AMBER = '#D4892A';
const FONT = "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif";

/** Logo « SI » (carré arrondi). `pad` : marge intérieure pour l'icône « maskable ». */
function logoSvg(size, { rounded = true, pad = 0 } = {}) {
  const s = 64;
  const inner = s - pad * 2;
  const k = inner / s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rounded ? 14 : 0}" fill="${NAVY}"/>
  <g transform="translate(${pad} ${pad}) scale(${k})">
    <rect x="12" y="46" width="40" height="5" rx="2.5" fill="${AMBER}"/>
    <text x="32" y="38" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="800" fill="#FFFFFF">SI</text>
  </g>
</svg>`;
}

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1B365D"/>
      <stop offset="1" stop-color="#2B5287"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1080" cy="90" r="260" fill="#FFFFFF" fill-opacity="0.04"/>
  <circle cx="1130" cy="560" r="180" fill="#FFFFFF" fill-opacity="0.05"/>
  <g transform="translate(80 84)">
    <rect width="112" height="112" rx="24" fill="#FFFFFF" fill-opacity="0.12"/>
    <rect x="21" y="80" width="70" height="9" rx="4.5" fill="${AMBER}"/>
    <text x="56" y="67" text-anchor="middle" font-family="${FONT}" font-size="48" font-weight="800" fill="#FFFFFF">SI</text>
  </g>
  <text x="80" y="300" font-family="${FONT}" font-size="30" font-weight="600" fill="#F2BB6D" letter-spacing="2">COURS · TD · PROGRAMME</text>
  <text x="80" y="378" font-family="${FONT}" font-size="78" font-weight="800" fill="#FFFFFF">Systèmes d'information</text>
  <rect x="80" y="412" width="96" height="6" rx="3" fill="${AMBER}"/>
  <text x="80" y="478" font-family="${FONT}" font-size="34" font-weight="600" fill="#FFFFFF">2e année Licence Informatique · S3 · 2026/2027</text>
  <text x="80" y="530" font-family="${FONT}" font-size="30" font-weight="400" fill="#D3DEED">Centre universitaire Nour Bachir – El Bayadh · Département d'informatique</text>
</svg>`;

/** Fichier .ico contenant des PNG (format accepté par tous les navigateurs récents). */
function pngsToIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

fs.writeFileSync(path.join(pub, 'favicon.svg'), logoSvg(64).replace(/\n\s*/g, ''));

const ico = pngsToIco([
  { size: 16, data: await png(logoSvg(16), 16) },
  { size: 32, data: await png(logoSvg(32), 32) },
  { size: 48, data: await png(logoSvg(48), 48) },
]);
fs.writeFileSync(path.join(pub, 'favicon.ico'), ico);

fs.writeFileSync(path.join(pub, 'apple-touch-icon.png'), await png(logoSvg(180, { rounded: false, pad: 6 }), 180));
fs.writeFileSync(path.join(pub, 'icon-192.png'), await png(logoSvg(192), 192));
fs.writeFileSync(path.join(pub, 'icon-512.png'), await png(logoSvg(512), 512));
fs.writeFileSync(path.join(pub, 'icon-maskable-512.png'), await png(logoSvg(512, { rounded: false, pad: 10 }), 512));

await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(path.join(pub, 'og.png'));

console.log('Icônes et image Open Graph générées dans public/.');
