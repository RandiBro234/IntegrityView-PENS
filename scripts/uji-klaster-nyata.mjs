/* Menjalankan pipeline klasterisasi pada data asli, tanpa menyimpan apa pun.

   Berguna untuk melihat hasil sebelum Edge Function dibangun: berapa kelompok
   yang terbentuk, kata kunci tiap kelompok, dan berapa komentar yang tercakup.

   Hanya jumlah dan kata kunci yang dicetak. Isi komentar tidak ditampilkan.

   Jalankan: node --experimental-strip-types scripts/uji-klaster-nyata.mjs [instrumen]
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

const teks = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/hitung-rekomendasi/lib/teks.ts')).href);
const tfidf = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/hitung-rekomendasi/lib/tfidf.ts')).href);
const klaster = await import(pathToFileURL(resolve(AKAR, 'supabase/functions/hitung-rekomendasi/lib/klaster.ts')).href);
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

function periodeDari(iso) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  const b = d.getUTCMonth() + 1, t = d.getUTCFullYear();
  return b >= 9 ? `${t}-ganjil` : b <= 2 ? `${t - 1}-ganjil` : `${t}-genap`;
}

const PERIODE = '2026-ganjil';
const SEMUA = !process.argv[2];

const perInstrumen = new Map();
for (const row of rows) {
  if (periodeDari(row.created_at) !== PERIODE) continue;
  const t = komentarDari(row);
  if (!t) continue;
  if (!perInstrumen.has(row.nama_instrumen)) perInstrumen.set(row.nama_instrumen, []);
  perInstrumen.get(row.nama_instrumen).push(t);
}

const pilih = process.argv[2];
const daftar = pilih ? [[pilih, perInstrumen.get(pilih) ?? []]] : [...perInstrumen.entries()];

console.log(`\n  Klasterisasi komentar · periode ${PERIODE}\n`);

for (const [nama, komentar] of daftar.sort((a, b) => b[1].length - a[1].length)) {
  const tidakSensitif = komentar.filter((t) => !norm.jawabanSensitif(t));
  const unik = [...new Set(tidakSensitif)];

  console.log(`  ${nama.toUpperCase()}`);
  console.log(`    komentar ${komentar.length} · tidak sensitif ${tidakSensitif.length} · unik ${unik.length}`);

  if (unik.length < 3) {
    console.log('    → terlalu sedikit untuk diklasterisasi\n');
    continue;
  }

  const dokumen = unik.map((t) => teks.praproses(t));
  const kosong = dokumen.filter((d) => d.length === 0).length;
  const { vektor, kosakata } = tfidf.hitungTfIdf(dokumen);
  const hasil = klaster.pilihK(vektor, { maksK: 5, benih: 42 });

  /* Jumlah komentar asli per klaster (bukan jumlah teks unik). */
  const indeksUnik = new Map(unik.map((t, i) => [t, hasil.label[i]]));
  const cacahKomentar = new Array(hasil.k).fill(0);
  for (const t of tidakSensitif) {
    const l = indeksUnik.get(t);
    if (l !== undefined) cacahKomentar[l] += 1;
  }

  console.log(`    → k=${hasil.k} · silhouette ${hasil.silhouette == null ? '-' : hasil.silhouette.toFixed(3)} · dokumen tanpa kata berguna ${kosong}`);
  for (let c = 0; c < hasil.k; c++) {
    const kata = tfidf.kataTeratas(hasil.pusat[c], kosakata, 5).map((x) => x.kata);
    const porsi = ((cacahKomentar[c] / tidakSensitif.length) * 100).toFixed(0);
    console.log(`      klaster ${c + 1}: ${String(cacahKomentar[c]).padStart(4)} komentar (${porsi}%)  [${kata.join(', ')}]`);
  }
  console.log('');
}
