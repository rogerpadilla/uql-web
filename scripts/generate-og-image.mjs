/**
 * Generates the 1200×630 social/Open Graph card at public/og-image.png.
 * Run with: bun scripts/generate-og-image.mjs
 *
 * Uses the brand UQL wordmark (logo-full paths) on the dark slate theme
 * background, plus the tagline and feature chips. Pure SVG → PNG via sharp.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, '../public/og-image.png');

const W = 1200;
const H = 630;

// Brand palette (from src/styles/custom.css dark theme + logo).
const BG = '#0f172a'; // slate-900
const BG2 = '#1e293b'; // slate-800
const INDIGO = '#6366f1';
const GOLD = '#dac842';
const WHITE = '#f8fafc';
const MUTED = '#94a3b8';

// The UQL wordmark strokes (from public/logo-full.svg, viewBox "50 65 500 290").
const wordmark = `
  <g transform="skewX(-8)" stroke="${WHITE}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M 130 210 C 160 180, 185 105, 160 105 C 135 105, 130 185, 145 245 C 160 315, 215 320, 240 230 C 265 140, 275 100, 250 100 C 225 100, 215 185, 230 255 C 240 310, 275 305, 270 280"/>
    <path d="M 330 130 C 300 110, 275 145, 275 200 C 275 260, 300 305, 335 305 C 370 305, 390 260, 390 200 C 390 140, 370 110, 340 125 C 315 140, 350 245, 380 305"/>
    <path d="M 430 110 C 433 170, 435 240, 430 280 C 427 310, 440 320, 470 318 C 495 315, 520 305, 535 290"/>
  </g>`;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="78%" cy="22%" r="80%">
      <stop offset="0%" stop-color="${BG2}"/>
      <stop offset="60%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${INDIGO}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="url(#accent)"/>

  <!-- Wordmark, scaled from the 500×290 logo viewBox into the top-left. -->
  <g transform="translate(70,70) scale(0.62)">${wordmark}</g>

  <text x="78" y="430" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="700" fill="${WHITE}">A JSON-native ORM for TypeScript</text>

  <text x="80" y="492" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="${MUTED}">Serializable queries · No codegen · One API across SQL &amp; MongoDB</text>

  <!-- Feature chips -->
  <g font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600">
    <rect x="80" y="540" width="210" height="52" rx="26" fill="${BG2}" stroke="${INDIGO}" stroke-width="1.5"/>
    <text x="185" y="574" fill="${WHITE}" text-anchor="middle">PostgreSQL</text>
    <rect x="306" y="540" width="150" height="52" rx="26" fill="${BG2}" stroke="${INDIGO}" stroke-width="1.5"/>
    <text x="381" y="574" fill="${WHITE}" text-anchor="middle">MySQL</text>
    <rect x="472" y="540" width="150" height="52" rx="26" fill="${BG2}" stroke="${INDIGO}" stroke-width="1.5"/>
    <text x="547" y="574" fill="${WHITE}" text-anchor="middle">SQLite</text>
    <rect x="638" y="540" width="180" height="52" rx="26" fill="${BG2}" stroke="${INDIGO}" stroke-width="1.5"/>
    <text x="728" y="574" fill="${WHITE}" text-anchor="middle">MongoDB</text>
  </g>

  <text x="${W - 80}" y="586" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${GOLD}" text-anchor="end">uql-orm.dev</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Wrote', out);
