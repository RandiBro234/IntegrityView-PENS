import { arahPerubahan } from '../../data/surveyData';
import { formatDeltaAngka, formatDeltaNetral } from '../../lib/formatDelta';
import { IkonNaik, IkonTurun, IkonStabil } from './ArahIkon';
import './Delta.css';

const IKON = { naik: IkonNaik, turun: IkonTurun, stabil: IkonStabil };

/* Satu-satunya tampilan selisih skor.

   Arah ditentukan arahPerubahan() di surveyData (ambang 0,5 poin), angka
   diformat lewat lib/formatDelta, dan simbolnya ikon SVG — bukan karakter
   Unicode — agar tidak rusak oleh encoding. */
export default function Delta({ value, unit = 'poin', compact = false, desimal = 1 }) {
  if (value == null) return null;

  const arah = arahPerubahan(value);
  const Ikon = IKON[arah];
  const angka = arah === 'stabil'
    ? formatDeltaNetral(value, desimal)
    : formatDeltaAngka(value, desimal);
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
