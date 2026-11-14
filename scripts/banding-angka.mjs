/* Membandingkan angka chatbot dengan dashboard memakai data asli.

   Chatbot memakai lib/sumber.ts (RPC berhalaman + dedup hash).
   Dashboard memakai normalisasiBaris + hitungAgregat dari frontend.

   Jalankan: node --experimental-strip-types scripts/banding-angka.mjs
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

/* Ambil semua baris lewat RPC berhalaman. */
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

/* Sisi dashboard: dedup lewat normalisasiBaris, lalu hitung per instrumen. */
const { records, duplikat } = norm.normalisasiBaris(rows);
const perKunci = new Map();
for (const rec of records) {
  const k = `${rec.slug}|${rec.periode}`;
  if (!perKunci.has(k)) perKunci.set(k, { slug: rec.slug, periode: rec.periode, rows: [] });
  perKunci.get(k).rows.push(rec);
}

console.log(`\n  Total baris terbaca : ${rows.length}`);
console.log(`  Periode dipilih     : ${chatbot.periode}`);
console.log(`  Duplikat (chatbot)  : ${chatbot.duplikat}`);
console.log(`  Duplikat (dashboard): ${JSON.stringify(duplikat)}\n`);

console.log(`  ${'instrumen'.padEnd(13)} ${'n chat'.padStart(7)} ${'n dash'.padStart(7)} ${'skor chat'.padStart(10)} ${'skor dash'.padStart(10)}  status`);
console.log(`  ${'-'.repeat(13)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(10)} ${'-'.repeat(10)}  ------`);

let beda = 0;
for (const d of chatbot.perInstrumen) {
  const sisi = perKunci.get(`${d.instrumen.slug}|${d.agregat.periode}`);
  if (!sisi) {
    console.log(`  ${d.instrumen.nama.padEnd(13)} ${String(d.agregat.n).padStart(7)} ${'—'.padStart(7)}  (tidak ada di dashboard)`);
    continue;
  }
  const dash = stat.hitungAgregat(d.instrumen.slug, sisi.periode, sisi.rows, 'real');
  const nChat = d.agregat.n;
  const nDash = dash.n;
  const sChat = (d.agregat.indeks / 25).toFixed(2);
  const sDash = (dash.indeks / 25).toFixed(2);
  const cocok = nChat === nDash && sChat === sDash;
  if (!cocok) beda += 1;
  console.log(
    `  ${d.instrumen.nama.padEnd(13)} ${String(nChat).padStart(7)} ${String(nDash).padStart(7)} ${sChat.padStart(10)} ${sDash.padStart(10)}  ${cocok ? 'sama' : 'BEDA'}`
  );
}

console.log(`\n  Instrumen berbeda: ${beda}\n`);
process.exit(beda === 0 ? 0 : 1);
