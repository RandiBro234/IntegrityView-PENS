/* Menghasilkan fixture untuk tes golden chatbot.

   Fixture ini adalah "kebenaran" versi frontend: ia menyimpan sekumpulan baris
   jawaban sintetis (deterministik) beserta agregat yang dihitung oleh
   frontend/src/data/survey/statistics.js. Port Deno di
   supabase/functions/chat/lib/statistik.ts harus menghasilkan angka yang sama.

   Jalankan dari root:  node scripts/gen-fixture.mjs
*/

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUMBER = resolve(AKAR, 'frontend/src/data/survey/statistics.js');
const TUJUAN = resolve(AKAR, 'supabase/functions/chat/tests/fixtures/agregat.json');

/* Generator bilangan acak berbenih supaya fixture stabil antar-jalankan.
   Tanpa ini, setiap `npm run gen:fixture` akan menghasilkan fixture berbeda
   dan tes golden jadi tidak bermakna. */
function lcg(benih) {
  let s = benih >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const KELOMPOK = ['Dosen', 'Tenaga Kependidikan', null];
const TERBUKA = [
  null,
  null,
  'Perlu sosialisasi rutin agar semua unit paham prosedurnya',
  'Sarana dan fasilitas pendukung masih kurang',
  'SOP belum jelas untuk beberapa alur layanan',
  'Perlu pelatihan berkala untuk petugas',
  'Proses digitalisasi perlu dipercepat',
  'Sudah ada dugaan mark up pada pengadaan kecil',
  'Komunikasi antar unit perlu diperbaiki',
  'Antrean layanan terlalu panjang pada jam sibuk',
  'Waktu layanan sering melebihi estimasi'
];

function buatRecords(jumlah, butir, benih) {
  const acak = lcg(benih);
  const rows = [];
  for (let i = 0; i < jumlah; i++) {
    /* Kecenderungan per responden: orang yang cenderung setuju menjawab tinggi
       di semua butir. Tanpa ini semua butir saling bebas dan Cronbach alpha
       jatuh mendekati 0, sehingga tes tidak benar-benar menguji rumus alpha. */
    const kecenderungan = acak();
    const items = [];
    for (let b = 0; b < butir; b++) {
      const r = (kecenderungan * 3 + acak() * 1.2) / 4.2;
      items.push(r < 0.08 ? 1 : r < 0.25 ? 2 : r < 0.65 ? 3 : 4);
    }
    const terbuka = TERBUKA[Math.floor(acak() * TERBUKA.length)];
    const kelompok = KELOMPOK[Math.floor(acak() * KELOMPOK.length)];
    rows.push({ items, terbuka, kelompok });
  }
  return rows;
}

const { hitungAgregat } = await import(pathToFileURL(SUMBER).href);
const cfg = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/instrumentConfig.js')).href);
const rekom = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/recommendations.js')).href);

/* Dua instrumen dengan jumlah butir berbeda (9 dan 6) supaya port tidak hanya
   teruji pada satu bentuk data. */
const KASUS = [
  { slug: 'spip', periode: '2026-ganjil', n: 58, benih: 20260101 },
  { slug: 'spak', periode: '2026-ganjil', n: 42, benih: 20260202 }
];

const keluaran = { _catatan: 'Dihasilkan scripts/gen-fixture.mjs dari frontend/src/data/survey/statistics.js. Jangan diedit tangan.', kasus: [] };

for (const k of KASUS) {
  const instrumen = cfg.getInstrumen(k.slug);
  const records = buatRecords(k.n, instrumen.butir.length, k.benih);
  const agregat = hitungAgregat(k.slug, k.periode, records, 'simulated', { dibuang: 3, duplikat: 1 });
  if (!agregat) throw new Error(`hitungAgregat mengembalikan null untuk ${k.slug}`);

  /* Pembanding: periode sebelumnya dengan benih lain dan n lebih kecil, supaya
     jalur perbandingan (delta + "n belum cukup") ikut teruji. */
  const recordsBanding = buatRecords(Math.floor(k.n * 0.6), instrumen.butir.length, k.benih + 7);
  const agregatBanding = hitungAgregat(k.slug, '2025-genap', recordsBanding, 'simulated', { dibuang: 0, duplikat: 0 });

  const perubahanButir = agregat.butir.map((b, i) => ({
    label: b.label,
    delta: rekom.getDelta(b.rata * 20, (agregatBanding?.butir[i]?.rata ?? b.rata) * 20)
  }));

  const rekomendasi = rekom.rekomendasiUntuk(agregat, agregatBanding, perubahanButir);

  keluaran.kasus.push({ ...k, records, agregat, recordsBanding, agregatBanding, rekomendasi });
}

await mkdir(dirname(TUJUAN), { recursive: true });
await writeFile(TUJUAN, `${JSON.stringify(keluaran, null, 2)}\n`, 'utf8');

for (const k of keluaran.kasus) {
  console.log(
    `  ${k.slug.padEnd(6)} n=${String(k.n).padStart(3)}  indeks=${k.agregat.indeks.toFixed(4)}  ` +
      `alpha=${k.agregat.alpha == null ? '-' : k.agregat.alpha.toFixed(6)}  tema=${k.agregat.kualitas.tema.length}`
  );
}
console.log(`\n  -> ${TUJUAN}\n`);
