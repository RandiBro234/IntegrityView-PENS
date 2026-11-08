/* Menghasilkan registry instrumen untuk Edge Function chatbot.

   Sumber tunggal tetap frontend/src/data/instrumentConfig.js. File JSON hasil
   skrip ini dipakai Deno karena Edge Function tidak bisa mengimpor modul dari
   folder frontend/. Jangan mengedit JSON hasil generate dengan tangan.

   Jalankan dari frontend/:  npm run gen:instrumen
   Atau dari root:           node scripts/gen-instrumen.mjs
*/

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUMBER = resolve(AKAR, 'frontend/src/data/instrumentConfig.js');
const TUJUAN = resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json');

/* Jumlah butir resmi. Dipakai sebagai penjaga: kalau instrumentConfig.js
   berubah tanpa sengaja, skrip berhenti alih-alih menghasilkan registry
   yang berbeda diam-diam. Perbarui tabel ini hanya bila perubahannya
   memang disengaja. */
const HARAPAN_BUTIR = {
  spip: 9,
  spak: 6,
  spkp: 8,
  gratifikasi: 5,
  benturan: 6,
  wbs: 6,
  pengaduan: 6,
  'budaya-zi': 7,
  'pens-joss': 6,
  '5r': 7
};

/* Awalan kode butir, mis. SPIP3. Ditentukan di sini (bukan diturunkan dari
   nama) supaya kode butir stabil dan terbaca, sekaligus mudah diubah bila
   nanti ada kode resmi dari pengelola survei. */
const AWALAN = {
  spip: 'SPIP',
  spak: 'SPAK',
  spkp: 'SPKP',
  gratifikasi: 'GRAT',
  benturan: 'BENT',
  wbs: 'WBS',
  pengaduan: 'PGD',
  'budaya-zi': 'BZI',
  'pens-joss': 'JOSS',
  '5r': 'LR'
};

/* `pengaduan` ada di instrumentConfig.js tetapi bukan instrumen berskala 1-4:
   ia sistem tiket tanpa distribusi jawaban, sehingga tidak punya agregat yang
   bisa dijelaskan chatbot. Tetap dimasukkan (kode butir bisa dipakai di tempat
   lain), tetapi ditandai agar perakit konteks melewatinya. */
const TANPA_AGREGAT = new Set(['pengaduan']);

function gagal(pesan) {
  console.error(`\n  GAGAL: ${pesan}\n`);
  process.exit(1);
}

const modul = await import(pathToFileURL(SUMBER).href);
const { INSTRUMENTS, ALIAS_INSTRUMEN, AMBANG, SKALA } = modul;

if (!Array.isArray(INSTRUMENTS) || !INSTRUMENTS.length) {
  gagal('INSTRUMENTS tidak ditemukan di instrumentConfig.js');
}

const instrumen = [];
const masalah = [];

for (const info of INSTRUMENTS) {
  const awalan = AWALAN[info.slug];
  if (!awalan) masalah.push(`slug "${info.slug}" belum punya awalan kode di AWALAN`);
  if (!Array.isArray(info.butir) || !info.butir.length) {
    masalah.push(`slug "${info.slug}" tidak punya butir`);
  }

  const harapan = HARAPAN_BUTIR[info.slug];
  if (harapan === undefined) {
    masalah.push(`slug "${info.slug}" tidak ada di tabel HARAPAN_BUTIR`);
  } else if (info.butir.length !== harapan) {
    masalah.push(
      `slug "${info.slug}" punya ${info.butir.length} butir, tabel mengharapkan ${harapan}`
    );
  }

  instrumen.push({
    slug: info.slug,
    nama: info.nama,
    nama_panjang: info.namaPanjang,
    kategori: info.kategori,
    kelompok: info.kelompok,
    jumlah_butir: info.butir.length,
    punya_agregat: !TANPA_AGREGAT.has(info.slug),
    butir: info.butir.map((butir, i) => ({
      kode: `${awalan}${i + 1}`,
      nomor: i + 1,
      label: butir.label,
      teks: butir.teks
    }))
  });
}

/* Kode butir dipakai untuk kolom `dasar` di jawaban chatbot, jadi harus unik
   lintas instrumen. */
const semuaKode = instrumen.flatMap((i) => i.butir.map((b) => b.kode));
const duplikat = semuaKode.filter((kode, i) => semuaKode.indexOf(kode) !== i);
if (duplikat.length) masalah.push(`kode butir duplikat: ${[...new Set(duplikat)].join(', ')}`);

if (masalah.length) {
  gagal(`registry tidak konsisten:\n    - ${masalah.join('\n    - ')}`);
}

const keluaran = {
  _catatan: 'Dihasilkan scripts/gen-instrumen.mjs dari frontend/src/data/instrumentConfig.js. Jangan diedit tangan.',
  _sumber: relative(AKAR, SUMBER).replace(/\\/g, '/'),
  instrumen,
  alias: ALIAS_INSTRUMEN,
  ambang: AMBANG,
  skala: SKALA
};

await mkdir(dirname(TUJUAN), { recursive: true });
await writeFile(TUJUAN, `${JSON.stringify(keluaran, null, 2)}\n`, 'utf8');

const total = instrumen.reduce((n, i) => n + i.jumlah_butir, 0);
console.log(`\n  ${instrumen.length} instrumen, ${total} butir -> ${relative(AKAR, TUJUAN).replace(/\\/g, '/')}\n`);
for (const i of instrumen) {
  const tanda = i.punya_agregat ? ' ' : ' (tanpa agregat)';
  console.log(`    ${i.slug.padEnd(12)} ${String(i.jumlah_butir).padStart(2)} butir  ${i.butir[0].kode}..${i.butir.at(-1).kode}${tanda}`);
}
console.log('');
