import { arahPerubahan } from '../../data/surveyData';
import { formatDeltaAngka, formatDeltaNetral } from '../../lib/formatDelta';
import { IkonNaik, IkonTurun, IkonStabil } from './ArahIkon';
import './Delta.css';

const IKON = { naik: IkonNaik, turun: IkonTurun, stabil: IkonStabil };

/* Satu-satunya tampilan selisih skor.

   Arah ditentukan arahPerubahan() di surveyData (ambang 0,5 poin persen), angka
   diformat lewat lib/formatDelta, dan simbolnya ikon SVG — bukan karakter
   Unicode — agar tidak rusak oleh encoding.

   `value` selalu dalam poin persen. Dengan `skalaSkor`, angka yang ditampilkan
   dikonversi ke skala 1–4 (dibagi 25) agar satuannya sama dengan rata-rata
   skor di sebelahnya; arahnya tetap dihitung dari poin persen. */
export default function Delta({ value, unit = 'poin', compact = false, desimal = 1, skalaSkor = false }) {
  if (value == null) return null;

  const arah = arahPerubahan(value);
  const Ikon = IKON[arah];
  const angkaTampil = skalaSkor ? value / 25 : value;
  const angka = arah === 'stabil'
    ? formatDeltaNetral(angkaTampil, skalaSkor ? 2 : desimal)
    : formatDeltaAngka(angkaTampil, skalaSkor ? 2 : desimal);
  const teks = `${arah} ${angka}${compact ? '' : ` ${unit}`}`;

  return (
    <span
      className={`delta delta--${arah}`}
      aria-label={`Perubahan ${teks}`}
      title={arah === 'stabil' ? 'stabil' : undefined}
    >
      <Ikon />
      <span className="delta__angka">{angka}</span>
      {!compact && <span className="delta__unit">{unit}</span>}
    </span>
  );
}
