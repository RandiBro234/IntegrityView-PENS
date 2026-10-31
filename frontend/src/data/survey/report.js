import { INSTRUMENTS } from '../instrumentConfig.js';
import { DEFAULT_FILTER, PERIODE } from './constants.js';
import { cacheLaporan } from './cache.js';
import { normalisasiFilter } from './filters.js';
import { arahPerubahan, getDelta, rekomendasiUntuk } from './recommendations.js';
import { rata } from './statistics.js';
import { agregat, recordsUntuk } from './aggregates.js';
import { store } from './store.js';

/* Jumlah responden satu periode: email distinct lintas instrumen, baris tanpa
   email dihitung satu per baris, ditambah baris simulasi bila dipakai. */
function jumlahResponden(periodeKey, slugs) {
  const set = new Set(slugs);
  const emailSet = new Set();
  let tanpaEmail = 0;
  store.records.forEach((r) => {
    if (r.periode !== periodeKey || !set.has(r.slug)) return;
    if (r.email) emailSet.add(r.email);
    else tanpaEmail += 1;
  });
  let simulasi = 0;
  slugs.forEach((slug) => {
    const { records, sumber } = recordsUntuk(slug, periodeKey);
    if (sumber === 'simulated') simulasi += records.length;
  });
  return emailSet.size + tanpaEmail + simulasi;
}

/* ---------------------------------------------------------------------
   Selector utama
   --------------------------------------------------------------------- */
export function getReportData(pilihan = DEFAULT_FILTER) {
  const filter = normalisasiFilter(pilihan);
  const kunci = `${filter.periode}|${filter.pembanding}|${filter.kategori}|${store.loaded}|${store.records.length}`;
  if (cacheLaporan.has(kunci)) return cacheLaporan.get(kunci);

  const idxPeriode = PERIODE.findIndex((p) => p.key === filter.periode);
  const idxBanding = filter.pembanding === 'tanpa' ? -1 : idxPeriode - 1;
  const periode = PERIODE[idxPeriode];
  const periodePembanding = PERIODE[idxBanding] || null;

  const daftar = INSTRUMENTS.filter((i) => filter.kategori === 'Semua' || i.kelompok === filter.kategori);

  const instrumen = daftar.map((info) => {
    const aktif = agregat(info.slug, periode.key);
    const banding = periodePembanding ? agregat(info.slug, periodePembanding.key) : null;
    const perubahanButir = aktif
      ? aktif.butir.map((b, i) => {
        const sebelum = banding?.butir[i];
        return {
          label: b.label,
          teks: b.teks,
          rata: b.rata,
          skor: (b.rata / 4) * 100,
          sebelumnya: sebelum ? (sebelum.rata / 4) * 100 : null,
          delta: sebelum ? Math.round(((b.rata - sebelum.rata) / 4) * 1000) / 10 : null
        };
      }).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
      : [];

    const tren = PERIODE.map((p, i) => {
      const a = agregat(info.slug, p.key);
      const sebelum = i > 0 ? agregat(info.slug, PERIODE[i - 1].key) : null;
      return {
        ...p,
        indeks: a ? a.indeks : null,
        n: a ? a.n : 0,
        sumber: a ? a.sumber : 'empty',
        deltaSemester: a && sebelum ? getDelta(a.indeks, sebelum.indeks) : null
      };
    });

    return {
      info: {
        key: info.slug,
        nama: info.nama,
        namaPanjang: info.namaPanjang,
        kategori: info.kategori,
        kelompok: info.kelompok,
        jumlahButir: info.butir.length,
        url: info.url,
        requiresGoogleLogin: info.requiresGoogleLogin
      },
      aktif,
      pembanding: banding,
      delta: aktif && banding ? getDelta(aktif.indeks, banding.indeks) : null,
      perubahanButir,
      sebaranButir: aktif ? aktif.butir.map((b) => ({
        nama: b.teks,
        label: b.label,
        rata: b.rata,
        distribusiAbsolut: b.distribusi,
        distribusiPersen: b.distribusiPersen,
        persenSetuju: b.persenSetuju,
        n: aktif.n
      })) : [],
      rekomendasi: rekomendasiUntuk(aktif, banding, perubahanButir),
      tren
    };
  });

  const valid = instrumen.filter((s) => s.aktif);
  const validBanding = instrumen.filter((s) => s.pembanding);

  const indeksRata = valid.length ? rata(valid.map((s) => s.aktif.indeks)) : null;
  const indeksBanding = validBanding.length ? rata(validBanding.map((s) => s.pembanding.indeks)) : null;
  const seGabungan = valid.length
    ? Math.sqrt(valid.reduce((a, s) => a + (s.aktif.se || 0) ** 2, 0)) / valid.length
    : null;
  const ciRingkasan = seGabungan == null ? null : {
    bawah: Math.max(0, indeksRata - 1.96 * seGabungan),
    atas: Math.min(100, indeksRata + 1.96 * seGabungan)
  };

  /* Responden: email distinct lintas instrumen + baris tanpa email + simulasi. */
  const semuaSlug = daftar.map((i) => i.slug);
  const responden = jumlahResponden(periode.key, semuaSlug);
  const respondenBanding = periodePembanding
    ? jumlahResponden(periodePembanding.key, semuaSlug)
    : null;

  const sebaran = valid.map((s) => ({
    key: s.info.key,
    nama: s.info.nama,
    namaPanjang: s.info.namaPanjang,
    sumber: s.aktif.sumber,
    n: s.aktif.n,
    indeks: s.aktif.indeks,
    distribusiAbsolut: s.aktif.distribusi,
    distribusiPersen: s.aktif.distribusiPersen,
    delta: s.delta,
    deltaArah: arahPerubahan(s.delta)
  })).sort((a, b) => a.indeks - b.indeks);

  const kategoriSkor = [...new Set(daftar.map((i) => i.kategori))].map((kategori) => {
    const items = valid.filter((s) => s.info.kategori === kategori);
    if (!items.length) return null;
    const nilai = rata(items.map((s) => s.aktif.indeks));
    const bandingItems = items.filter((s) => s.pembanding);
    const sebelum = bandingItems.length ? rata(bandingItems.map((s) => s.pembanding.indeks)) : null;
    return { kategori, skor: nilai, delta: sebelum == null ? null : getDelta(nilai, sebelum) };
  }).filter(Boolean);

  const simulasiTerpakai = valid.filter((s) => s.aktif.sumber === 'simulated').length;
  const realTerpakai = valid.filter((s) => s.aktif.sumber === 'real').length;

  const hasil = {
    filter,
    periode,
    periodePembanding,
    instrumen,
    sebaran,
    kategoriSkor,
    simulasiTerpakai,
    realTerpakai,
    memakaiSimulasi: simulasiTerpakai > 0,
    loading: !store.loaded,
    error: store.error,
    ringkasan: {
      totalInstrumen: valid.length,
      deltaInstrumen: periodePembanding ? valid.length - validBanding.length : null,
      kelompok: {
        layanan: valid.filter((s) => s.info.kelompok === 'Layanan').map((s) => s.info.nama),
        internal: valid.filter((s) => s.info.kelompok === 'Internal').map((s) => s.info.nama)
      },
      responden: {
        total: responden,
        dosen: valid.reduce((a, s) => a + (s.aktif.kelompok?.dosen || 0), 0),
        tendik: valid.reduce((a, s) => a + (s.aktif.kelompok?.tendik || 0), 0),
        adaKelompok: valid.some((s) => s.aktif.kelompok)
      },
      deltaResponden: respondenBanding == null ? null : responden - respondenBanding,
      rataSkor: indeksRata,
      delta: indeksBanding == null || indeksRata == null ? null : getDelta(indeksRata, indeksBanding),
      ci: ciRingkasan,
      simulasiTerpakai,
      realTerpakai
    },
    perubahanTerbesar: {
      naik: [...instrumen].filter((s) => s.delta != null).sort((a, b) => b.delta - a.delta)[0] || null,
      turun: [...instrumen].filter((s) => s.delta != null).sort((a, b) => a.delta - b.delta)[0] || null
    }
  };

  cacheLaporan.set(kunci, hasil);
  return hasil;
}

/* Ringkasan untuk landing/auth/pusat survei — sumber sama. */
export function getRingkasanPublik(filter = DEFAULT_FILTER) {
  return getReportData({ ...filter, kategori: 'Semua' });
}
