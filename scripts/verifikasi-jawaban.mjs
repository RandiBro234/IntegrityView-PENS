/* Membandingkan angka yang disebut jawaban dengan angka sebenarnya di data.
   Dipakai untuk menilai hasil uji LLM secara objektif, bukan "kelihatannya benar".

   Jalankan: node --experimental-strip-types scripts\verifikasi-jawaban.mjs
*/

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registri = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/lib/instrumen.json'), 'utf8'));
const fixture = JSON.parse(await readFile(resolve(AKAR, 'supabase/functions/chat/tests/fixtures/agregat-db.json'), 'utf8'));

const spak = fixture.kasus.find((k) => k.slug === 'spak');
const grat = fixture.kasus.find((k) => k.slug === 'gratifikasi');

const skor = (indeks) => Number((indeks / 25).toFixed(2));

/* Fixture dibuat dari statistics.js yang belum mengenal kode butir, jadi kode
   diambil dari registry berdasarkan urutan. */
const kodeButir = (slug) => registri.instrumen.find((i) => i.slug === slug).butir.map((b) => b.kode);

console.log('\n  Angka sebenarnya (dari fixture data asli)');
console.log(`  SPAK         skor ${skor(spak.agregat.indeks)}  n=${spak.agregat.n}  alpha=${spak.agregat.alpha.toFixed(3)}`);
console.log(`  Gratifikasi  skor ${skor(grat.agregat.indeks)}  n=${grat.agregat.n}`);
console.log('');
const kodeSpak = kodeButir('spak');
spak.agregat.butir.forEach((b, i) => console.log(`    ${kodeSpak[i].padEnd(7)} ${b.rata.toFixed(2)}`));
console.log('');
const kodeGrat = kodeButir('gratifikasi');
grat.agregat.butir.forEach((b, i) => console.log(`    ${kodeGrat[i].padEnd(7)} ${b.rata.toFixed(2)}`));
console.log('');

/* Klaim dari jawaban LLM (disalin manual dari 07-chatbot-hasil-c4.md). */
const KLAIM = [
  { uji: 1, teks: 'SPAK skor 3,61 dan n=165', cek: () => skor(spak.agregat.indeks) === 3.61 && spak.agregat.n === 165 },
  { uji: 6, teks: 'alpha SPAK 0,936', cek: () => Number(spak.agregat.alpha.toFixed(3)) === 0.936 },
  { uji: 6, teks: 'n=165 melebihi minimum 30', cek: () => spak.agregat.n === 165 && registri.ambang.respondenMinimum === 30 },
  { uji: 7, teks: 'Gratifikasi 3,47 < SPAK 3,61', cek: () => skor(grat.agregat.indeks) === 3.47 && skor(spak.agregat.indeks) === 3.61 },
  { uji: 7, teks: 'butir terendah Gratifikasi GRAT3 = 3,13', cek: () => {
    /* Setelah JSON.parse, butirTerendah adalah objek terpisah, jadi indexOf
       tidak bisa dipakai untuk mencari posisinya. */
    const t = grat.agregat.butirTerendah;
    const idx = grat.agregat.butir.findIndex((b) => b.label === t.label && b.rata === t.rata);
    return kodeGrat[idx] === 'GRAT3' && Number(t.rata.toFixed(2)) === 3.13;
  } },
  { uji: 15, teks: 'SPAK1 = 3,6', cek: () => Number(spak.agregat.butir[0].rata.toFixed(2)) === 3.6 },
  { uji: 15, teks: 'SPAK2 = 3,51', cek: () => Number(spak.agregat.butir[1].rata.toFixed(2)) === 3.51 },
  { uji: 15, teks: 'SPAK3 = 3,57', cek: () => Number(spak.agregat.butir[2].rata.toFixed(2)) === 3.57 },
  { uji: 15, teks: 'SPAK4 = 3,73', cek: () => Number(spak.agregat.butir[3].rata.toFixed(2)) === 3.73 },
  { uji: 15, teks: 'SPAK5 = 3,58', cek: () => Number(spak.agregat.butir[4].rata.toFixed(2)) === 3.58 },
  { uji: 15, teks: 'SPAK6 = 3,65', cek: () => Number(spak.agregat.butir[5].rata.toFixed(2)) === 3.65 }
];

console.log('  Verifikasi klaim jawaban');
let benar = 0;
for (const k of KLAIM) {
  const ok = k.cek();
  if (ok) benar += 1;
  console.log(`    ${ok ? 'BENAR ' : 'SALAH '} uji #${String(k.uji).padStart(2)}  ${k.teks}`);
}
console.log(`\n  ${benar}/${KLAIM.length} klaim angka cocok dengan data\n`);
process.exit(benar === KLAIM.length ? 0 : 1);
