/* Mengukur cakupan pengelompokan kata kunci yang sekarang dipakai.

   Baseline = `temaTerbuka()` di frontend/src/data/survey/normalize.js:
   14 pasangan kata kunci, pencocokan substring. Komentar yang tidak memuat
   satu pun kata kunci itu tidak masuk kategori apa pun.

   Komentar sensitif (memuat kata seperti "dugaan", "mark up", atau lebih dari
   300 karakter) dikeluarkan lebih dulu, sama seperti di statistics.js.

   Hanya angka yang dicetak. Isi komentar tidak ditampilkan.

   Jalankan: node --experimental-strip-types scripts/ukur-baseline-tema.mjs
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

const norm = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/normalize.js')).href);

const META = new Set(['kelompok', 'email', 'email address', 'timestamp', 'nama', 'unit kerja', 'jabatan']);

function komentarDari(row) {
  for (const [k, v] of Object.entries(row.data_jawaban || {})) {
    if (META.has(k.toLowerCase())) continue;
    const s = String(v ?? '').trim();
    if (!s || s === '-' || /^-?\d+(\.\d+)?$/.test(s)) continue;
    if (s.length > 3) return s;
  }
  return null;
}

const per = {};
const temaGlobal = new Map();
let totalKomentar = 0, totalSensitif = 0, totalDianalisis = 0, totalCocok = 0;

for (const row of rows) {
  const teks = komentarDari(row);
  if (!teks) continue;
  const inst = row.nama_instrumen;
  per[inst] = per[inst] || { komentar: 0, sensitif: 0, dianalisis: 0, cocok: 0 };
  per[inst].komentar += 1;
  totalKomentar += 1;

  if (norm.jawabanSensitif(teks)) {
    per[inst].sensitif += 1;
    totalSensitif += 1;
    continue;
  }

  per[inst].dianalisis += 1;
  totalDianalisis += 1;

  const tema = norm.temaTerbuka([teks]);
  if (tema.length) {
    per[inst].cocok += 1;
    totalCocok += 1;
    tema.forEach((t) => temaGlobal.set(t.tema, (temaGlobal.get(t.tema) || 0) + 1));
  }
}

console.log('\n  CAKUPAN PENGELOMPOKAN KATA KUNCI (baseline)\n');
console.log(`  ${'instrumen'.padEnd(13)} ${'komentar'.padStart(9)} ${'sensitif'.padStart(9)} ${'dianalisis'.padStart(11)} ${'cocok'.padStart(7)} ${'cakupan'.padStart(9)}`);
console.log(`  ${'-'.repeat(13)} ${'-'.repeat(9)} ${'-'.repeat(9)} ${'-'.repeat(11)} ${'-'.repeat(7)} ${'-'.repeat(9)}`);

for (const [inst, v] of Object.entries(per).sort((a, b) => b[1].komentar - a[1].komentar)) {
  const persen = v.dianalisis ? ((v.cocok / v.dianalisis) * 100).toFixed(1) : '0.0';
  console.log(
    `  ${inst.padEnd(13)} ${String(v.komentar).padStart(9)} ${String(v.sensitif).padStart(9)} ` +
      `${String(v.dianalisis).padStart(11)} ${String(v.cocok).padStart(7)} ${(persen + '%').padStart(9)}`
  );
}

const totalPersen = totalDianalisis ? ((totalCocok / totalDianalisis) * 100).toFixed(1) : '0.0';

console.log(`  ${'-'.repeat(13)} ${'-'.repeat(9)} ${'-'.repeat(9)} ${'-'.repeat(11)} ${'-'.repeat(7)} ${'-'.repeat(9)}`);
console.log(
  `  ${'TOTAL'.padEnd(13)} ${String(totalKomentar).padStart(9)} ${String(totalSensitif).padStart(9)} ` +
    `${String(totalDianalisis).padStart(11)} ${String(totalCocok).padStart(7)} ${(totalPersen + '%').padStart(9)}`
);

console.log(`\n  Komentar TIDAK masuk kategori : ${totalDianalisis - totalCocok} dari ${totalDianalisis}`);

console.log('\n  Sebaran tema yang terbentuk:\n');
const urut = [...temaGlobal.entries()].sort((a, b) => b[1] - a[1]);
const maks = urut[0]?.[1] ?? 1;
for (const [tema, jumlah] of urut) {
  const bar = '#'.repeat(Math.round((jumlah / maks) * 24));
  console.log(`    ${tema.padEnd(24)} ${String(jumlah).padStart(4)}  ${bar}`);
}
console.log('');
