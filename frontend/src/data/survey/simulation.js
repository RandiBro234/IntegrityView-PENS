import { PERIODE } from './constants.js';

/* ---------------------------------------------------------------------
   Data simulasi (seed tetap) — hanya jika flag aktif
   --------------------------------------------------------------------- */
const SKENARIO = ['naik', 'naik', 'turun', 'stabil', 'naik', 'stabil', 'turun', 'naik', 'stabil', 'naik'];

function rand(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function simulasiRecords(instrumen, idx, periodeIdx) {
  const rng = rand(9001 + idx * 7919 + periodeIdx * 1543);
  const n = 60 + ((idx * 37 + periodeIdx * 53) % 121);
  const butir = instrumen.butir;
  const geser = SKENARIO[idx] === 'naik' ? (periodeIdx - 2) * 0.16
    : SKENARIO[idx] === 'turun' ? (2 - periodeIdx) * 0.26 : (periodeIdx % 2 ? -0.02 : 0.02);
  const basis = 3.05 + (idx % 3) * 0.08;

  return Array.from({ length: n }, (_, r) => {
    const kecenderungan = rng() < 0.04 ? -1.6 : (rng() + rng() + rng() - 1.5) * 0.8;
    const items = butir.map((_, bi) => {
      const target = basis + geser + kecenderungan + (rng() + rng() - 1) * 1.1 + (bi % 3) * 0.04;
      return Math.max(1, Math.min(4, Math.round(target)));
    });
    return {
      slug: instrumen.slug,
      periode: PERIODE[periodeIdx].key,
      email: null,
      respondentId: `sim:${instrumen.slug}:${PERIODE[periodeIdx].key}:${r}`,
      createdAt: null,
      items,
      terbuka: null,
      kelompok: r % 5 < 2 ? 'Dosen' : 'Tenaga Kependidikan'
    };
  });
}
