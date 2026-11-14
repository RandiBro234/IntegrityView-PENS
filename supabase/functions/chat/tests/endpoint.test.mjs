/* Tes endpoint /chat: validasi, batas pemakaian, kegagalan, dan bentuk hasil.

   Endpoint diuji lewat jawabChat() (inti logika), bukan Deno.serve, supaya
   bisa dijalankan dengan Node tanpa Edge Runtime.

   Dijalankan: node --test supabase/functions/chat/tests/endpoint.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jawabChat, cariDasar } from '../lib/penjawab.ts';
import { kumpulkan, periodeTerbaru, KOLOM } from '../lib/sumber.ts';
import { LlmTidakTersedia } from '../lib/llm.ts';
import { validasiChat, MAKS_PERTANYAAN } from '../lib/validasi.ts';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRI = JSON.parse(await readFile(resolve(AKAR, 'lib/instrumen.json'), 'utf8'));

/* Data contoh: bentuk sama dengan hasil kumpulkan(). */
function buatBarisPeriode(periode, jumlah) {
  const instrumen = REGISTRI.instrumen.find((i) => i.slug === 'spip');
  const bulan = periode.endsWith('ganjil') ? '10' : '04';
  const tahun = periode.split('-')[0];
  const baris = [];
  for (let i = 0; i < jumlah; i++) {
    const jawaban = {};
    instrumen.butir.forEach((b, n) => {
      jawaban[b.teks] = String(((i + n) % 4) + 1);
    });
    baris.push({
      nama_instrumen: 'SPIP',
      data_jawaban: jawaban,
      created_at: `${tahun}-${bulan}-15T03:00:00+00:00`
    });
  }
  return baris;
}

const DATA_CONTOH = kumpulkan(buatBarisPeriode('2026-ganjil', 40), REGISTRI);

function deps(ubah = {}) {
  return {
    registri: REGISTRI,
    ambilData: async () => DATA_CONTOH,
    tanyaLlm: async () => 'Butir terendah adalah SPIP3 dengan skor 1,50 dari 4.',
    cekBatas: async () => true,
    ...ubah
  };
}

/* ---------------------------------------------------------------------------
   Validasi 422
   --------------------------------------------------------------------------- */

test('pertanyaan tidak valid -> 422', async () => {
  const kasus = [
    ['kosong', { pertanyaan: '   ' }],
    ['terlalu panjang', { pertanyaan: 'a'.repeat(MAKS_PERTANYAAN + 1) }],
    ['bukan string', { pertanyaan: 42 }],
    ['body bukan objek', 'teks'],
    ['body null', null],
    ['instrumen tak dikenal', { pertanyaan: 'halo', instrumen: '<script>' }]
  ];
  for (const [nama, badan] of kasus) {
    const h = await jawabChat(badan, deps());
    assert.equal(h.status, 422, `kasus: ${nama}`);
  }
});

test('tepat 300 karakter dan instrumen valid diterima', async () => {
  assert.equal((await jawabChat({ pertanyaan: 'a'.repeat(MAKS_PERTANYAAN) }, deps())).status, 200);
  for (const instrumen of ['spip', 'SPIP', 'Survei Persepsi Anti Korupsi']) {
    assert.doesNotThrow(() => validasiChat({ pertanyaan: 'a', instrumen }, REGISTRI), instrumen);
  }
});

/* ---------------------------------------------------------------------------
   429 dan 503
   --------------------------------------------------------------------------- */

test('batas pemakaian -> 429, dan LLM tidak dipanggil', async () => {
  let dipanggil = false;
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      cekBatas: async () => false,
      tanyaLlm: async () => {
        dipanggil = true;
        return 'x';
      }
    })
  );
  assert.equal(h.status, 429);
  assert.equal(h.body.kode, 'batas_pemakaian');
  assert.equal(dipanggil, false, 'LLM dipanggil padahal sudah kena batas');
});

test('LLM gagal dan database gagal -> 503, bukan 500', async () => {
  const llmGagal = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      tanyaLlm: async () => {
        throw new LlmTidakTersedia('uji');
      }
    })
  );
  assert.equal(llmGagal.status, 503);
  assert.equal(llmGagal.body.kode, 'chatbot_tidak_tersedia');

  const dbGagal = await jawabChat(
    { pertanyaan: 'halo' },
    deps({
      ambilData: async () => {
        throw new Error('koneksi putus');
      }
    })
  );
  assert.equal(dbGagal.status, 503);
});

/* ---------------------------------------------------------------------------
   200 dan isi jawaban
   --------------------------------------------------------------------------- */

test('jawaban 200 berisi jawaban dan dasar', async () => {
  const h = await jawabChat({ pertanyaan: 'butir mana yang paling lemah di SPIP?' }, deps());
  assert.equal(h.status, 200);
  assert.equal(typeof h.body.jawaban, 'string');
  assert.deepEqual(h.body.dasar, ['SPIP3']);

  const tanpaKode = await jawabChat({ pertanyaan: 'halo' }, deps({ tanyaLlm: async () => 'Skor 3,07.' }));
  assert.deepEqual(tanpaKode.body.dasar, []);
});

test('kode butir di luar konteks tidak masuk dasar', () => {
  assert.deepEqual(cariDasar('menurut SPAK1 dan SPIP3', ['SPIP3']), ['SPIP3']);
  assert.deepEqual(cariDasar('SPIP30 bukan SPIP3', ['SPIP3']), ['SPIP3']);
});

test('tanpa data -> 200 dengan pesan jelas, bukan error', async () => {
  const h = await jawabChat(
    { pertanyaan: 'halo' },
    deps({ ambilData: async () => ({ periode: '', perInstrumen: [], dibuang: 0, totalBaris: 0 }) })
  );
  assert.equal(h.status, 200);
  assert.match(String(h.body.jawaban), /Belum ada data/i);
});

test('instrumen valid tapi belum ada datanya -> 200 tanpa memanggil LLM', async () => {
  let dipanggil = false;
  const h = await jawabChat(
    { pertanyaan: 'apa kabar SPAK?' },
    deps({
      ambilData: async () => ({ periode: '2026-ganjil', perInstrumen: DATA_CONTOH.perInstrumen, dibuang: 0, totalBaris: 0 }),
      tanyaLlm: async () => {
        dipanggil = true;
        return 'x';
      }
    })
  );
  assert.equal(h.status, 200);
  assert.match(String(h.body.jawaban), /belum tersedia/i);
  assert.equal(dipanggil, false);
});

/* ---------------------------------------------------------------------------
   Sumber data
   --------------------------------------------------------------------------- */

test('query hanya mengambil kolom yang diizinkan', () => {
  const kolom = KOLOM.split(',').sort();
  assert.deepEqual(kolom, ['created_at', 'data_jawaban', 'nama_instrumen'].sort());
  assert.ok(!KOLOM.includes('email'));
  assert.ok(!KOLOM.includes('id'));
});

test('kumpulkan() membuang instrumen asing dan baris jumlah butir salah', () => {
  const asing = kumpulkan(
    [{ nama_instrumen: 'Instrumen Karangan', data_jawaban: {}, created_at: '2026-10-15T03:00:00+00:00' }],
    REGISTRI
  );
  assert.equal(asing.perInstrumen.length, 0);

  const salah = kumpulkan(
    [{ nama_instrumen: 'SPIP', data_jawaban: { 'Etika & integritas': '3' }, created_at: '2026-10-15T03:00:00+00:00' }],
    REGISTRI
  );
  assert.equal(salah.dibuang, 1);
  assert.equal(salah.perInstrumen.length, 0);
});

test('periode dipilih dengan urutan semester yang benar', () => {
  /* Ganjil (Sep-Feb) terjadi SETELAH genap (Mar-Agu) pada tahun yang sama. */
  assert.equal(periodeTerbaru(['2025-genap', '2025-ganjil', '2026-genap']), '2026-genap');
  assert.equal(periodeTerbaru(['2026-genap', '2026-ganjil']), '2026-ganjil');
  assert.equal(periodeTerbaru([]), null);
});

test('pembanding memakai periode sebelumnya dan kualitas dibuang terhitung per instrumen', () => {
  const hasil = kumpulkan([...buatBarisPeriode('2025-genap', 30), ...buatBarisPeriode('2026-ganjil', 40)], REGISTRI);
  assert.equal(hasil.periode, '2026-ganjil');
  const spip = hasil.perInstrumen.find((d) => d.instrumen.slug === 'spip');
  assert.equal(spip.agregatBanding?.periode, '2025-genap');

  const denganRusak = kumpulkan(
    [
      ...buatBarisPeriode('2026-ganjil', 5),
      { nama_instrumen: 'SPIP', data_jawaban: { 'Etika & integritas': '3' }, created_at: '2026-10-16T03:00:00+00:00' }
    ],
    REGISTRI
  );
  assert.equal(denganRusak.dibuang, 1);
  assert.equal(denganRusak.perInstrumen[0].agregat.kualitas.dibuang, 1);
});
