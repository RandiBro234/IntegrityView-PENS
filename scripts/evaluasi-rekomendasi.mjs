/* Evaluasi rekomendasi jawaban terbuka: baseline kata kunci vs klasterisasi.

   Yang diukur:
     1. Cakupan baseline `temaTerbuka()` (14 pasangan kata kunci, substring).
     2. Cakupan klasterisasi (komentar yang punya kata bermakna).
     3. Jumlah kelompok dan silhouette per kombinasi instrumen-periode.

   Kedua metode memakai himpunan komentar yang sama: sudah dideduplikasi per
   responden dan sudah membuang komentar sensitif. Dengan begitu perbandingannya
   adil. Isi komentar tidak pernah dicetak.

   Jalankan:
     node --experimental-strip-types scripts/evaluasi-rekomendasi.mjs
     node --experimental-strip-types scripts/evaluasi-rekomendasi.mjs --tulis
*/

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TULIS = process.argv.includes('--tulis');

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
const norm = await impor('frontend/src/data/survey/normalize.js');
const { komentarPeriode } = await impor('supabase/functions/hitung-rekomendasi/lib/sumber.ts');
const { bentukKelompok } = await impor('supabase/functions/hitung-rekomendasi/lib/kelompok.ts');
const { periodeDariTanggal, urutkanPeriode } = await impor('supabase/functions/hitung-rekomendasi/lib/periode.ts');

const periodeSemua = urutkanPeriode(
  [...new Set(rows.map((r) => periodeDariTanggal(r.created_at)).filter(Boolean))]
);

const instrumenSemua = [...new Set(rows.map((r) => r.nama_instrumen))].sort();

const perBaris = [];
const perInstrumen = new Map();

for (const instrumen of instrumenSemua) {
  const milik = rows.filter((r) => r.nama_instrumen === instrumen);
  const ringkas = { instrumen, komentar: 0, baseline: 0, terkategori: 0, tanpaKata: 0, kelompok: 0, silhouette: [] };

  for (const periode of periodeSemua) {
    const komentar = komentarPeriode(milik, periode);
    if (!komentar.length) continue;

    const cocok = komentar.filter((t) => norm.temaTerbuka([t]).length > 0).length;
    const hasil = bentukKelompok(komentar);
    const terkategori = komentar.length - hasil.tanpaKata;

    perBaris.push({
      instrumen,
      periode,
      komentar: komentar.length,
      baseline: cocok,
      terkategori,
      tanpaKata: hasil.tanpaKata,
      kelompok: hasil.kelompok.length,
      k: hasil.k,
      silhouette: hasil.silhouette
    });

    ringkas.komentar += komentar.length;
    ringkas.baseline += cocok;
    ringkas.terkategori += terkategori;
    ringkas.tanpaKata += hasil.tanpaKata;
    ringkas.kelompok += hasil.kelompok.length;
    if (hasil.silhouette != null) ringkas.silhouette.push(hasil.silhouette);
  }

  perInstrumen.set(instrumen, ringkas);
}

const persen = (a, b) => (b ? ((a / b) * 100).toFixed(1) : '0.0');
const rata = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const total = {
  komentar: 0,
  baseline: 0,
  terkategori: 0,
  tanpaKata: 0,
  kelompok: 0,
  silhouette: []
};
for (const r of perInstrumen.values()) {
  total.komentar += r.komentar;
  total.baseline += r.baseline;
  total.terkategori += r.terkategori;
  total.tanpaKata += r.tanpaKata;
  total.kelompok += r.kelompok;
  total.silhouette.push(...r.silhouette);
}

const silRata = rata(total.silhouette);
const kSatu = perBaris.filter((b) => b.k === 1).length;

const barisTabel = perBaris
  .map(
    (b) =>
      `| ${b.instrumen} | ${b.periode} | ${b.komentar} | ${b.baseline} (${persen(b.baseline, b.komentar)}%) | ` +
      `${b.terkategori} (${persen(b.terkategori, b.komentar)}%) | ${b.kelompok} | ` +
      `${b.silhouette == null ? '–' : b.silhouette.toFixed(3)} |`
  )
  .join('\n');

const barisInstrumen = [...perInstrumen.values()]
  .sort((a, b) => b.komentar - a.komentar)
  .map(
    (r) =>
      `| ${r.instrumen} | ${r.komentar} | ${r.baseline} (${persen(r.baseline, r.komentar)}%) | ` +
      `${r.terkategori} (${persen(r.terkategori, r.komentar)}%) | ${r.kelompok} | ` +
      `${rata(r.silhouette) == null ? '–' : rata(r.silhouette).toFixed(3)} |`
  )
  .join('\n');

const laporan = `# Evaluasi Rekomendasi Jawaban Terbuka

Dihasilkan oleh \`scripts/evaluasi-rekomendasi.mjs\` pada ${new Date().toISOString().slice(0, 10)}.
Sumber: RPC \`survey_rows_safe\` (${rows.length} baris). Isi komentar tidak dimuat di laporan ini.

## Ringkasan

| Ukuran | Nilai |
|---|---:|
| Komentar dianalisis (setelah dedup & saring sensitif) | ${total.komentar} |
| Baseline kata kunci: masuk kategori | ${total.baseline} (${persen(total.baseline, total.komentar)}%) |
| Klasterisasi: punya kata bermakna | ${total.terkategori} (${persen(total.terkategori, total.komentar)}%) |
| Komentar tanpa kata bermakna | ${total.tanpaKata} |
| Kelompok terbentuk | ${total.kelompok} |
| Kombinasi dengan k=1 | ${kSatu} dari ${perBaris.length} |
| Silhouette rata-rata | ${silRata == null ? '–' : silRata.toFixed(3)} |

Cakupan klasterisasi lebih tinggi karena setiap komentar yang punya kata
bermakna selalu masuk satu kelompok. Cakupan tinggi **bukan** bukti pemisahan
yang baik: lihat silhouette. Nilai 0,00–0,05 berarti kelompok saling tumpang
tindih, dan itu wajar untuk jawaban terbuka yang topiknya bercampur.

## Per instrumen (seluruh periode)

| Instrumen | Komentar | Baseline | Klasterisasi | Kelompok | Silhouette |
|---|---:|---:|---:|---:|---:|
${barisInstrumen}

## Per instrumen dan periode

| Instrumen | Periode | Komentar | Baseline | Klasterisasi | Kelompok | Silhouette |
|---|---|---:|---:|---:|---:|---:|
${barisTabel}

## Batasan

- Delapan instrumen berasal dari data sintetis dengan 6–8 kalimat tetap.
  Kalimat yang berulang persis menghasilkan vektor TF-IDF identik, sehingga
  \`pilihK\` umumnya berhenti di k=1. Hasil di instrumen itu bukan temuan
  tentang kondisi kampus.
- SPAK dan Gratifikasi berisi komentar beragam, tetapi silhouette-nya tetap
  rendah. Artinya topik dalam satu instrumen memang bercampur, bukan pipeline
  yang rusak.
- Baseline hanya punya 14 pasangan kata kunci; dua di antaranya
  ("Tindak lanjut", "Antrean layanan") tidak pernah cocok.
`;

if (TULIS) {
  const tujuan = resolve(AKAR, 'docs/evaluasi-rekomendasi.md');
  await writeFile(tujuan, laporan, 'utf8');
  console.log(`ditulis: ${tujuan}`);
} else {
  console.log(laporan);
}
