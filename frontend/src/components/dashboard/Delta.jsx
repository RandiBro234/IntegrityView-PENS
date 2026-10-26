import { formatAngka } from '../../data/mock';
import { arahPerubahan } from '../../data/reportData';
import './Delta.css';

const SIMBOL = { naik: '↑', turun: '↓', stabil: '—' };

/* Satu-satunya tampilan selisih skor. Arah ditentukan oleh arahPerubahan()
   di reportData agar aturan 0,5 poin konsisten di seluruh aplikasi. */
export default function Delta({ value, unit = 'poin', compact = false, desimal = 1 }) {
  if (value == null) return null;
  const arah = arahPerubahan(value);
  const angka = formatAngka(Math.abs(value), desimal);
  const tanda = arah === 'naik' ? '+' : arah === 'turun' ? '−' : '';
  return (
    <span
      className={`delta delta--${arah}`}
      aria-label={`${arah === 'stabil' ? 'stabil' : arah} ${angka} ${unit}`}
      title={arah === 'stabil' ? 'stabil' : undefined}
    >
      {SIMBOL[arah]} {tanda}{angka}{compact ? '' : `\u00a0${unit}`}
    </span>
  );
}
