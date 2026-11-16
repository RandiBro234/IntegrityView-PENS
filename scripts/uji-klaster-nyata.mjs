/* Menjalankan pipeline rekomendasi pada data asli, tanpa menyimpan apa pun.

   Berguna untuk melihat hasil sebelum Edge Function dijalankan: berapa kelompok
   yang terbentuk, labelnya, kata kunci, dan berapa komentar yang tercakup.
   Isi komentar tidak pernah dicetak; hanya label dan kata kunci.

   Jalankan: node --experimental-strip-types scripts/uji-klaster-nyata.mjs [instrumen] [periode]
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

const impor = (jalur) => import(pathToFileURL(resolve(AKAR, jalur)).href);
const { komentarPeriode } = await impor('supabase/functions/hitung-rekomendasi/lib/sumber.ts');
const { bentukKelompok, prioritasDari } = await impor('supabase/functions/hitung-rekomendasi/lib/kelompok.ts');
const { periodeDariTanggal, urutkanPeriode } = await impor('supabase/functions/hitung-rekomendasi/lib/periode.ts');

const pilihInstrumen = process.argv[2] || null;
const pilihPeriode = process.argv[3] || null;

const perInstrumen = new Map();
for (const row of rows) {
  const p = periodeDariTanggal(row.created_at);
  if (!p) continue;
  if (pilihPeriode && p !== pilihPeriode) continue;
  if (pilihInstrumen && row.nama_instrumen.toLowerCase() !== pilihInstrumen.toLowerCase()) continue;
  if (!perInstrumen.has(row.nama_instrumen)) perInstrumen.set(row.nama_instrumen, []);
  perInstrumen.get(row.nama_instrumen).push(row);
}

const periodeTampil = pilihPeriode || urutkanPeriode([...new Set(rows.map((r) => periodeDariTanggal(r.created_at)).filter(Boolean))])[0];

console.log(`\n  Rekomendasi jawaban terbuka · periode ${periodeTampil}\n`);

for (const [nama, daftar] of [...perInstrumen.entries()].sort()) {
  const komentar = komentarPeriode(daftar, periodeTampil);
  const hasil = bentukKelompok(komentar);

  console.log(`  ${nama.toUpperCase()}  (${hasil.jumlahKomentar} komentar, ${hasil.jumlahUnik} unik, ${hasil.tanpaKata} tanpa kata)`);

  if (!hasil.kelompok.length) {
    console.log('    → belum cukup komentar untuk dikelompokkan\n');
    continue;
  }

  console.log(`    k=${hasil.k} · silhouette ${hasil.silhouette == null ? '-' : hasil.silhouette.toFixed(3)}`);
  for (const k of hasil.kelompok) {
    const porsi = (k.porsi * 100).toFixed(0);
    console.log(
      `      [${prioritasDari(k.porsi).padEnd(6)}] ${String(k.jumlah).padStart(4)} (${porsi.padStart(3)}%)  ${k.label}  ·  ${k.kata_kunci.join(', ')}`
    );
  }
  console.log('');
}
