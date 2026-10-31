import { getInstrumen } from '../instrumentConfig.js';
import { jawabanSensitif, temaTerbuka } from './normalize.js';

export function rata(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function varianSampel(arr) {
  if (arr.length < 2) return 0;
  const m = rata(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1);
}

function median(arr) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/* Pembulatan largest remainder agar total tepat 100%. */
export function persenLargestRemainder(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return [0, 0, 0, 0];
  const mentah = counts.map((c) => (c / total) * 100);
  const dasar = mentah.map((v) => Math.floor(v));
  let sisa = 100 - dasar.reduce((a, b) => a + b, 0);
  const urutan = mentah
    .map((v, i) => ({ i, sisa: v - Math.floor(v) }))
    .sort((a, b) => b.sisa - a.sisa);
  for (let k = 0; k < urutan.length && sisa > 0; k++) { dasar[urutan[k].i] += 1; sisa -= 1; }
  return dasar;
}

function cronbach(rows, k) {
  if (rows.length < 2 || k < 2) return null;
  const variansButir = [];
  for (let i = 0; i < k; i++) variansButir.push(varianSampel(rows.map((r) => r.items[i])));
  const total = rows.map((r) => r.items.reduce((a, b) => a + b, 0));
  const varTotal = varianSampel(total);
  if (!varTotal) return null;
  const alpha = (k / (k - 1)) * (1 - variansButir.reduce((a, b) => a + b, 0) / varTotal);
  return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : null;
}

function skorBaris(items) {
  return (rata(items) / 4) * 100;
}

/* Agregat satu (instrumen, periode). */
export function hitungAgregat(slug, periode, records, sumber, kualitasTambahan = {}) {
  const instrumen = getInstrumen(slug);
  if (!instrumen || !records.length) return null;
  const k = instrumen.butir.length;
  const skor = records.map((r) => skorBaris(r.items));
  const n = records.length;

  const distribusiButir = instrumen.butir.map((butir, i) => {
    const counts = [0, 0, 0, 0];
    records.forEach((r) => { counts[r.items[i] - 1] += 1; });
    const rataButir = rata(records.map((r) => r.items[i]));
    const negatif = counts[0] + counts[1];
    return {
      label: butir.label,
      teks: butir.teks,
      rata: rataButir,
      distribusi: counts,
      distribusiPersen: persenLargestRemainder(counts),
      persenSetuju: ((counts[2] + counts[3]) / n) * 100,
      persenNegatif: (negatif / n) * 100
    };
  });

  const totalCounts = [0, 0, 0, 0];
  records.forEach((r) => r.items.forEach((v) => { totalCounts[v - 1] += 1; }));
  const totalJawaban = totalCounts.reduce((a, b) => a + b, 0);

  const indeks = (records.reduce((a, r) => a + r.items.reduce((x, y) => x + y, 0), 0) / (k * 4 * n)) * 100;
  const sd = Math.sqrt(varianSampel(skor));
  const se = n >= 2 ? sd / Math.sqrt(n) : null;
  const ci = se == null ? null : { bawah: Math.max(0, indeks - 1.96 * se), atas: Math.min(100, indeks + 1.96 * se) };

  const seragam = records.filter((r) => r.items.every((v) => v === r.items[0])).length;
  const terbuka = records.filter((r) => r.terbuka).length;
  const tertahan = records.filter((r) => r.terbuka && jawabanSensitif(r.terbuka)).length;
  const tema = temaTerbuka(records
    .filter((r) => r.terbuka && !jawabanSensitif(r.terbuka))
    .map((r) => r.terbuka));

  const alpha = cronbach(records, k);

  return {
    slug,
    periode,
    sumber,
    jumlahButir: k,
    n,
    indeks,
    skorRata: indeks,
    median: median(skor),
    sd,
    se,
    ci,
    alpha,
    alphaCatatan: alpha != null && n < 30 ? 'n kecil, interpretasi hati-hati' : null,
    setuju: (totalCounts[2] + totalCounts[3]) / totalJawaban * 100,
    distribusi: totalCounts,
    distribusiPersen: persenLargestRemainder(totalCounts),
    butir: distribusiButir,
    butirTerendah: distribusiButir.reduce((a, b) => (b.rata < a.rata ? b : a), distribusiButir[0]),
    kualitas: {
      seragam: (seragam / n) * 100,
      duplikat: kualitasTambahan.duplikat || 0,
      dibuang: kualitasTambahan.dibuang || 0,
      terbuka,
      tertahan,
      tema,
      n
    },
    kelompok: (() => {
      const dosen = records.filter((r) => r.kelompok === 'Dosen').length;
      const tendik = records.filter((r) => r.kelompok === 'Tenaga Kependidikan').length;
      return dosen || tendik ? { dosen, tendik } : null;
    })()
  };
}
