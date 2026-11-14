/* Menjaga agar lib/instrumen.json tidak basi.

   Registry ini dihasilkan scripts/gen-instrumen.mjs dari
   frontend/src/data/instrumentConfig.js. Kalau tim mengubah label atau teks
   butir di sana tanpa menjalankan ulang generator, chatbot akan memakai label
   lama — dan itu pernah terjadi: BENT2 dilaporkan 2,58 padahal dashboard
   menampilkan 2,72, karena urutan teks tidak lagi cocok sehingga normalisasi
   jatuh ke urutan angka mentah.

   Tes ini membandingkan registry dengan sumbernya, jadi kelalaian itu langsung
   ketahuan.

   Dijalankan: node --test supabase/functions/chat/tests/registri.test.mjs
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRI = JSON.parse(await readFile(resolve(AKAR, 'lib/instrumen.json'), 'utf8'));
const cfg = await import(pathToFileURL(resolve(AKAR, '../../../frontend/src/data/instrumentConfig.js')).href);

test('registry memuat semua instrumen dari instrumentConfig', () => {
  assert.equal(REGISTRI.instrumen.length, cfg.INSTRUMENTS.length);
  for (const info of cfg.INSTRUMENTS) {
    const ada = REGISTRI.instrumen.find((i) => i.slug === info.slug);
    assert.ok(ada, `instrumen ${info.slug} tidak ada di registry`);
  }
});

test('label dan teks butir sama persis dengan instrumentConfig', () => {
  const basi = [];
  for (const info of cfg.INSTRUMENTS) {
    const reg = REGISTRI.instrumen.find((i) => i.slug === info.slug);
    if (reg.butir.length !== info.butir.length) {
      basi.push(`${info.slug}: jumlah butir ${reg.butir.length} != ${info.butir.length}`);
      continue;
    }
    info.butir.forEach((butir, i) => {
      const r = reg.butir[i];
      if (r.label !== butir.label) basi.push(`${info.slug} butir ${i + 1}: label "${r.label}" != "${butir.label}"`);
      if (r.teks !== butir.teks) basi.push(`${info.slug} butir ${i + 1}: teks berbeda`);
    });
  }
  assert.deepEqual(basi, [], `registry basi, jalankan: npm run gen:instrumen\n  ${basi.join('\n  ')}`);
});

test('ambang dan alias sama dengan instrumentConfig', () => {
  assert.deepEqual(REGISTRI.ambang, cfg.AMBANG);
  assert.deepEqual(REGISTRI.alias, cfg.ALIAS_INSTRUMEN);
});

test('kode butir unik dan berurutan', () => {
  const semua = REGISTRI.instrumen.flatMap((i) => i.butir.map((b) => b.kode));
  assert.equal(new Set(semua).size, semua.length, 'ada kode butir duplikat');
  for (const info of REGISTRI.instrumen) {
    info.butir.forEach((b, i) => assert.equal(b.nomor, i + 1, `${b.kode} nomor tidak berurutan`));
  }
});
