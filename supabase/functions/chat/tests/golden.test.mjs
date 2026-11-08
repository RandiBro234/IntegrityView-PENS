/* Tes golden: port Deno (lib/statistik.ts) harus menghasilkan angka yang sama
   dengan versi frontend (frontend/src/data/survey/statistics.js).

   Fixture dihasilkan scripts/gen-fixture.mjs. Kalau tes ini merah setelah
   statistics.js diubah, jalankan ulang generator fixture — jangan mengubah
   angkanya dengan tangan.

   Dijalankan dengan Node (type stripping bawaan Node 24), bukan Deno, supaya
   bisa dieksekusi tanpa memasang Deno:
       node --test supabase/functions/chat/tests/
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hitungAgregat } from '../lib/statistik.ts';
import { getDelta, rekomendasiUntuk } from '../lib/rekomendasi.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRI = JSON.parse(await readFile(resolve(AKAR, 'lib/instrumen.json'), 'utf8'));
const FIXTURE = JSON.parse(await readFile(resolve(AKAR, 'tests/fixtures/agregat.json'), 'utf8'));

/* Fixture kedua (opsional): snapshot agregat dari survey_responses asli.
   Tidak ada di repo sampai `node scripts/gen-fixture.mjs --dari-db` dijalankan. */
let FIXTURE_DB = null;
try {
  FIXTURE_DB = JSON.parse(await readFile(resolve(AKAR, 'tests/fixtures/agregat-db.json'), 'utf8'));
} catch {
  /* dilewati */
}

const TOLERANSI = 1e-9;

function instrumenDari(slug) {
  return REGISTRI.instrumen.find((i) => i.slug === slug) ?? null;
}

/* Pembanding rekursif: angka dibandingkan dengan toleransi, sisanya persis. */
function samaDalam(nilai, harapan, jalur = '') {
  if (typeof harapan === 'number') {
    assert.equal(typeof nilai, 'number', `${jalur} bukan angka (${typeof nilai})`);
    if (Number.isNaN(harapan)) return assert.ok(Number.isNaN(nilai), `${jalur} harus NaN`);
    assert.ok(
      Math.abs(nilai - harapan) <= TOLERANSI,
      `${jalur}: ${nilai} != ${harapan} (selisih ${Math.abs(nilai - harapan)})`
    );
    return;
  }
  if (harapan === null) return assert.equal(nilai, null, `${jalur} harus null`);
  if (Array.isArray(harapan)) {
    assert.ok(Array.isArray(nilai), `${jalur} harus array`);
    assert.equal(nilai.length, harapan.length, `${jalur} panjang ${nilai.length} != ${harapan.length}`);
    harapan.forEach((h, i) => samaDalam(nilai[i], h, `${jalur}[${i}]`));
    return;
  }
  if (typeof harapan === 'object') {
    assert.ok(nilai && typeof nilai === 'object', `${jalur} harus objek`);
    for (const k of Object.keys(harapan)) samaDalam(nilai[k], harapan[k], jalur ? `${jalur}.${k}` : k);
    return;
  }
  assert.equal(nilai, harapan, `${jalur} berbeda`);
}

for (const kasus of FIXTURE.kasus) {
  test(`agregat ${kasus.slug} sama dengan versi frontend`, () => {
    const instrumen = instrumenDari(kasus.slug);
    assert.ok(instrumen, `instrumen ${kasus.slug} tidak ada di instrumen.json`);

    const hasil = hitungAgregat(instrumen, kasus.periode, kasus.records, 'simulated', {
      dibuang: 3,
      duplikat: 1
    });
    assert.ok(hasil, 'hitungAgregat mengembalikan null');

    /* `sumber` sengaja tidak dibandingkan lewat fixture agregat karena nilainya
       hanya label; sisanya dibandingkan penuh. */
    samaDalam({ ...hasil, sumber: kasus.agregat.sumber }, kasus.agregat);
  });
}

test('kode butir mengikuti registry, bukan indeks', () => {  const kasus = FIXTURE.kasus[0];
  const instrumen = instrumenDari(kasus.slug);
  const hasil = hitungAgregat(instrumen, kasus.periode, kasus.records, 'simulated');
  assert.deepEqual(
    hasil.butir.map((b) => b.kode),
    instrumen.butir.map((b) => b.kode)
  );
});

test('agregat kosong mengembalikan null', () => {
  const instrumen = instrumenDari('spip');
  assert.equal(hitungAgregat(instrumen, '2026-ganjil', [], 'empty'), null);
  assert.equal(hitungAgregat(null, '2026-ganjil', [{ items: [1] }], 'empty'), null);
});

test('tema terbuka sama dengan versi frontend', async () => {
  const { pathToFileURL } = await import('node:url');
  const js = await import(pathToFileURL(resolve(AKAR, '../../../frontend/src/data/survey/normalize.js')).href);
  const { temaTerbuka, jawabanSensitif } = await import('../lib/tema.ts');

  const contoh = FIXTURE.kasus.flatMap((k) => k.records.map((r) => r.terbuka).filter(Boolean));
  assert.deepEqual(temaTerbuka(contoh), js.temaTerbuka(contoh));

  for (const teks of contoh.concat(['', 'a'.repeat(301), 'ada DUGAAN mark up'])) {
    assert.equal(jawabanSensitif(teks), js.jawabanSensitif(teks), `jawabanSensitif("${teks.slice(0, 20)}")`);
  }
});

test('rekomendasi sama dengan versi frontend', () => {
  const ambang = REGISTRI.ambang;
  for (const kasus of FIXTURE.kasus) {
    const instrumen = instrumenDari(kasus.slug);
    const agregat = hitungAgregat(instrumen, kasus.periode, kasus.records, 'simulated', {
      dibuang: 3,
      duplikat: 1
    });
    const banding = hitungAgregat(instrumen, '2025-genap', kasus.recordsBanding, 'simulated', {
      dibuang: 0,
      duplikat: 0
    });
    const perubahanButir = agregat.butir.map((b, i) => ({
      kode: b.kode,
      label: b.label,
      delta: getDelta(b.rata * 20, (banding.butir[i]?.rata ?? b.rata) * 20)
    }));

    const hasil = rekomendasiUntuk(agregat, banding, perubahanButir, ambang);

    assert.equal(hasil.length, kasus.rekomendasi.length, `${kasus.slug}: jumlah rekomendasi berbeda`);
    hasil.forEach((r, i) => {
      const h = kasus.rekomendasi[i];
      assert.equal(r.prioritas, h.prioritas, `${kasus.slug}[${i}].prioritas`);
      assert.equal(r.judul, h.judul, `${kasus.slug}[${i}].judul`);
      assert.equal(r.dasar, h.dasar, `${kasus.slug}[${i}].dasar`);
    });
  }
});

/* ---------------------------------------------------------------------------
   Fixture dari data asli (opsional)
   --------------------------------------------------------------------------- */

test('fixture data asli bebas PII', { skip: FIXTURE_DB == null && 'belum ada agregat-db.json' }, () => {
  const teks = JSON.stringify(FIXTURE_DB);
  const pola = [
    [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'alamat email'],
    [/email_responden/, 'kolom email_responden'],
    [/"terbuka"\s*:\s*"[^"]+"/, 'komentar terbuka'],
    [/respondentId/, 'respondentId']
  ];
  for (const [re, nama] of pola) {
    const cocok = teks.match(re);
    assert.equal(cocok, null, `fixture memuat ${nama}: ${cocok?.[0]?.slice(0, 60)}`);
  }
});

for (const kasus of FIXTURE_DB?.kasus ?? []) {
  test(`agregat ${kasus.slug} (data asli) sama dengan versi frontend`, () => {
    const instrumen = instrumenDari(kasus.slug);
    assert.ok(instrumen, `instrumen ${kasus.slug} tidak ada di instrumen.json`);

    const hasil = hitungAgregat(instrumen, kasus.periode, kasus.records, 'real', {
      dibuang: kasus.agregat.kualitas.dibuang,
      duplikat: kasus.agregat.kualitas.duplikat
    });
    assert.ok(hasil);
    samaDalam({ ...hasil, sumber: kasus.agregat.sumber }, kasus.agregat);
  });
}
