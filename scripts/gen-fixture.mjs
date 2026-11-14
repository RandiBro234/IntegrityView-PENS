/* Menghasilkan fixture untuk tes golden chatbot.

   Dua mode:

   1. `node scripts/gen-fixture.mjs` (bawaan)
      Data SINTETIS deterministik. Dipakai untuk menguji port rumus: angka di
      sini adalah keluaran statistics.js versi frontend, jadi port Deno harus
      menghasilkan angka yang persis sama. Tidak butuh kredensial dan bisa
      dijalankan di CI mana pun.

   2. `node scripts/gen-fixture.mjs --dari-db`
      Data ASLI dari Supabase (tabel survey_responses), dibaca lewat REST API
      memakai anon key. Hasil agregatnya disimpan sebagai fixture tambahan
      (tests/fixtures/agregat-db.json) supaya port rumus juga teruji pada
      bentuk data nyata, bukan hanya data buatan.

      Butuh VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY di frontend/.env.
      Fixture hasil mode ini TIDAK memuat email, komentar mentah, atau ID baris:
      yang disimpan hanya `items` hasil normalisasi dan agregatnya, karena
      tes golden tidak membutuhkan PII.

   Fixture tidak dipakai saat runtime. Edge Function chat membaca agregat
   langsung dari database (lihat lib/sumber.ts); fixture hanya untuk tes.
*/

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DARI_DB = process.argv.includes('--dari-db');

const TUJUAN = resolve(
  AKAR,
  DARI_DB
    ? 'supabase/functions/chat/tests/fixtures/agregat-db.json'
    : 'supabase/functions/chat/tests/fixtures/agregat.json'
);

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

const { hitungAgregat } = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/statistics.js')).href);
const cfg = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/instrumentConfig.js')).href);
const rekom = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/recommendations.js')).href);
const norm = await import(pathToFileURL(resolve(AKAR, 'frontend/src/data/survey/normalize.js')).href);

/* ---------------------------------------------------------------------
   Mode 2: ambil data asli dari Supabase
   --------------------------------------------------------------------- */
async function muatEnv() {
  const jalur = resolve(AKAR, 'frontend/.env');
  try {
    const isi = await readFile(jalur, 'utf8');
    const env = {};
    for (const baris of isi.split(/\r?\n/)) {
      const bersih = baris.trim();
      if (!bersih || bersih.startsWith('#') || !bersih.includes('=')) continue;
      const i = bersih.indexOf('=');
      env[bersih.slice(0, i).trim()] = bersih.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

async function kasusDariDb() {
  const env = { ...(await muatEnv()), ...process.env };
  const url = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.error(
      '\n  GAGAL: --dari-db butuh VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.\n' +
        '  Salin frontend/.env.example menjadi frontend/.env lalu isi keduanya.\n'
    );
    process.exit(1);
  }

  const headers = { apikey: key, Accept: 'application/json', 'Content-Type': 'application/json' };

  /* Lewat RPC berhalaman: tabel sudah >6000 baris, sedangkan PostgREST
     membatasi 1000 baris per request. Email tidak pernah ikut karena RPC
     sudah membuangnya di server. */
  const baris = [];
  for (let offset = 0; ;) {
    const res = await fetch(`${url}/rest/v1/rpc/survey_rows_safe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_limit: 1000, p_offset: offset })
    });
    if (!res.ok) {
      console.error(`\n  GAGAL: HTTP ${res.status} saat membaca survey_rows_safe.\n`);
      process.exit(1);
    }
    const halaman = await res.json();
    if (!Array.isArray(halaman) || halaman.length === 0) break;
    baris.push(...halaman);
    offset += halaman.length;
  }

  const perPeriode = new Map();
  for (const b of baris) {
    const slug = cfg.slugDariNamaInstrumen(b.nama_instrumen);
    if (!slug) continue;
    const periode = norm.periodeDariTanggal(b.created_at);
    if (!periode) continue;
    const info = cfg.getInstrumen(slug);
    const hasil = norm.normalizeAnswers(slug, b.data_jawaban);
    if (!hasil.items.length || hasil.items.length !== info.butir.length) continue;
    const kunci = `${slug}|${periode}`;
    if (!perPeriode.has(kunci)) perPeriode.set(kunci, { slug, periode, records: [] });
    /* `terbuka` sengaja TIDAK disimpan. Komentar mentah bisa memuat nama,
       nomor, atau dugaan personal; fixture di-commit ke repo publik. Tema
       komentar pun tidak dihitung di sini, sehingga kualitas.terbuka=0 dan
       tema=[] pada fixture DB. Uji tema memakai fixture sintetis. */
    perPeriode.get(kunci).records.push({
      items: hasil.items,
      kelompok: hasil.kelompok
    });
  }

  const kasus = [];
  for (const { slug, periode, records } of perPeriode.values()) {
    if (records.length < 2) continue;
    const agregat = hitungAgregat(slug, periode, records, 'real');
    if (!agregat) continue;
    kasus.push({ slug, periode, n: records.length, records, agregat, sumber: 'real' });
  }

  if (!kasus.length) {
    console.error('\n  GAGAL: tidak ada (instrumen, periode) valid di survey_responses.\n');
    process.exit(1);
  }
  /* Batasi ke 6 kasus terbesar supaya fixture tidak membengkak. */
  kasus.sort((a, b) => b.n - a.n);
  return kasus.slice(0, 6);
}

/* ---------------------------------------------------------------------
   Mode 1: data sintetis
   --------------------------------------------------------------------- */
function kasusSintetis() {
  const KASUS = [
    { slug: 'spip', periode: '2026-ganjil', n: 58, benih: 20260101 },
    { slug: 'spak', periode: '2026-ganjil', n: 42, benih: 20260202 }
  ];

  return KASUS.map((k) => {
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

    return {
      ...k,
      records,
      agregat,
      recordsBanding,
      agregatBanding,
      rekomendasi: rekom.rekomendasiUntuk(agregat, agregatBanding, perubahanButir)
    };
  });
}

const kasus = DARI_DB ? await kasusDariDb() : kasusSintetis();

const keluaran = {
  _catatan: DARI_DB
    ? 'Dihasilkan scripts/gen-fixture.mjs --dari-db dari Supabase (tanpa email/komentar mentah). Jangan diedit tangan.'
    : 'Dihasilkan scripts/gen-fixture.mjs dari frontend/src/data/survey/statistics.js. Jangan diedit tangan.',
  _sumber: DARI_DB ? 'supabase:survey_responses' : 'sintetis',
  kasus
};

await mkdir(dirname(TUJUAN), { recursive: true });
await writeFile(TUJUAN, `${JSON.stringify(keluaran, null, 2)}\n`, 'utf8');

for (const k of keluaran.kasus) {
  console.log(
    `  ${k.slug.padEnd(11)} ${k.periode.padEnd(12)} n=${String(k.n).padStart(3)}  ` +
      `indeks=${k.agregat.indeks.toFixed(4)}  alpha=${k.agregat.alpha == null ? '-' : k.agregat.alpha.toFixed(6)}`
  );
}
console.log(`\n  -> ${TUJUAN}\n`);
