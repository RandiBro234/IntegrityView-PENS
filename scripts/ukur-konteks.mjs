/* Mengukur ukuran konteks untuk semua instrumen.

   Penting karena harga Kenari melonjak 5x di atas 100K token input per
   permintaan. Konteks kita harus jauh di bawah itu.

   Jalankan: node --experimental-strip-types scripts/ukur-konteks.mjs
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
const { rakitKonteksSatu, rakitKonteksSemua } = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/lib/konteks.ts')).href);
const { ATURAN } = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/chat/lib/prompt.ts')).href);

const data = kumpulkan(rows, registri);

/* Perkiraan kasar: 1 token ~ 4 karakter untuk teks Indonesia/JSON. */
const token = (teks) => Math.ceil(teks.length / 4);

console.log(`\n  System prompt: ${ATURAN.length} karakter (~${token(ATURAN)} token)\n`);
console.log(`  ${'instrumen'.padEnd(13)} ${'byte'.padStart(7)} ${'~token'.padStart(8)}`);
console.log(`  ${'-'.repeat(13)} ${'-'.repeat(7)} ${'-'.repeat(8)}`);

let maks = 0;
for (const d of data.perInstrumen) {
  const k = rakitKonteksSatu(d.agregat, d.instrumen, registri.ambang, d.rekomendasi);
  const teks = JSON.stringify(k);
  maks = Math.max(maks, teks.length);
  console.log(`  ${d.instrumen.nama.padEnd(13)} ${String(teks.length).padStart(7)} ${String(token(teks)).padStart(8)}`);
}

const semua = rakitKonteksSemua(
  data.perInstrumen.map((d) => ({ agregat: d.agregat, instrumen: d.instrumen, judulRekomendasi: d.rekomendasi.map((r) => r.judul) }))
);
const teksSemua = JSON.stringify(semua);
console.log(`  ${'(ringkasan)'.padEnd(13)} ${String(teksSemua.length).padStart(7)} ${String(token(teksSemua)).padStart(8)}`);

const totalMaks = token(ATURAN) + token(JSON.stringify(rakitKonteksSatu(
  data.perInstrumen[0].agregat, data.perInstrumen[0].instrumen, registri.ambang, data.perInstrumen[0].rekomendasi
))) + 50;

console.log(`\n  Konteks terbesar : ${maks} byte (~${token('x'.repeat(maks))} token)`);
console.log(`  Perkiraan total  : ~${totalMaks} token per permintaan`);
console.log(`  Batas tier murah : 100.000 token`);
console.log(`  Sisa ruang       : ${(100000 - totalMaks).toLocaleString('id-ID')} token\n`);
