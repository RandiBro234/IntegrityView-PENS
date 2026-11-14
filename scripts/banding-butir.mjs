/* Membandingkan rata-rata PER BUTIR antara chatbot (TS) dan dashboard (JS).

   Indeks total bisa cocok walaupun urutan butir salah, karena indeks hanya
   menjumlahkan semua nilai. Karena itu per-butir harus dibandingkan terpisah.

   Jalankan: node --experimental-strip-types scripts/banding-butir.mjs [slug]
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = process.argv[2] || 'benturan';

const env = {};
for (const baris of (await readFile(resolve(AKAR, 'frontend/.env'), 'utf8')).split(/\r?\n/)) {
  const b = baris.trim();
  if (!b || b.startsWith('#') || !b.includes('=')) continue;
  const i = b.indexOf('=');
  env[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const url = env.VITE_SUPABASE_URL.replace(/\/$/, '');
const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Accept: 'application/json', 'Content-Type': 'application/json' };

const rows = [];
for (let offset = 0; ;) {
  const res = await fetch(`${url}/rest/v1/rpc/survey_rows_safe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_limit: 1000, p_offset: offset })
  });
  const halaman = await res.json();
  if (!Array.isArray(halaman) || halaman.length === 0) break;
  rows.push(...halaman);
  offset += halaman.length;
}

const registri = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json'), 'utf8'));
const { kumpulkan } = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/lib/sumber.ts')).href);
const norm = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/normalize.js')).href);
const stat = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/statistics.js')).href);

const chatbot = kumpulkan(rows, registri);
const sisiChat = chatbot.perInstrumen.find((d) => d.instrumen.slug === SLUG);
if (!sisiChat) {
  console.error(`\n  ${SLUG} tidak ada di hasil chatbot.\n`);
  process.exit(1);
}

const { records } = norm.normalisasiBaris(rows);
const barisDash = records.filter((r) => r.slug === SLUG && r.periode === sisiChat.agregat.periode);
const dash = stat.hitungAgregat(SLUG, sisiChat.agregat.periode, barisDash, 'real');

console.log(`\n  ${sisiChat.instrumen.nama} · ${sisiChat.agregat.periode}`);
console.log(`  n chatbot ${sisiChat.agregat.n} · n dashboard ${dash.n}\n`);
console.log(`  ${'kode'.padEnd(7)} ${'rata chat'.padStart(10)} ${'rata dash'.padStart(10)}  label`);
console.log(`  ${'-'.repeat(7)} ${'-'.repeat(10)} ${'-'.repeat(10)}  -----`);

let beda = 0;
sisiChat.agregat.butir.forEach((b, i) => {
  const d = dash.butir[i];
  const sama = Math.abs(b.rata - d.rata) < 1e-9;
  if (!sama) beda += 1;
  console.log(
    `  ${b.kode.padEnd(7)} ${b.rata.toFixed(2).padStart(10)} ${d.rata.toFixed(2).padStart(10)}  ${sama ? '' : 'BEDA  '}${b.label.slice(0, 45)}`
  );
});

console.log(`\n  Butir berbeda: ${beda}\n`);
process.exit(beda === 0 ? 0 : 1);
