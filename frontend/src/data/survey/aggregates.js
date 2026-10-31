import { INSTRUMENTS } from '../instrumentConfig.js';
import { PERIODE } from './constants.js';
import { cacheAgregat } from './cache.js';
import { hitungAgregat } from './statistics.js';
import { simulasiRecords } from './simulation.js';
import { SIMULASI_AKTIF, store } from './store.js';

/* Records untuk satu (instrumen, periode): nyata jika ada, selain itu simulasi. */
export function recordsUntuk(slug, periodeKey) {
  const nyata = store.records.filter((r) => r.slug === slug && r.periode === periodeKey);
  if (nyata.length) return { records: nyata, sumber: 'real' };
  if (!SIMULASI_AKTIF) return { records: [], sumber: 'empty' };
  const idx = INSTRUMENTS.findIndex((i) => i.slug === slug);
  const pi = PERIODE.findIndex((p) => p.key === periodeKey);
  if (idx < 0 || pi < 0) return { records: [], sumber: 'empty' };
  return { records: simulasiRecords(INSTRUMENTS[idx], idx, pi), sumber: 'simulated' };
}

export function agregat(slug, periodeKey) {
  const kunci = `${slug}|${periodeKey}`;
  if (cacheAgregat.has(kunci)) return cacheAgregat.get(kunci);
  const { records, sumber } = recordsUntuk(slug, periodeKey);
  const hasil = hitungAgregat(slug, periodeKey, records, sumber, {
    dibuang: store.dibuang[slug] || 0,
    duplikat: store.duplikat[slug] || 0
  });
  cacheAgregat.set(kunci, hasil);
  return hasil;
}
