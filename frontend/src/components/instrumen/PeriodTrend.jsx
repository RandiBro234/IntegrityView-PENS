import { formatAngka } from '../../data/mock';
import { keSkor } from '../../lib/formatSkor';
import { arahPerubahan } from '../../data/surveyData';
import './PeriodTrend.css';

const WARNA = {
  naik: 'var(--teal-500)',
  turun: 'var(--error-500)',
  stabil: 'var(--gray-500)'
};

/* Garis lurus (tanpa smoothing) untuk 5 semester.
   Tiap ruas diwarnai sesuai arah: naik hijau, turun merah, stabil abu-abu.
   Pita tipis = interval kepercayaan 95%. */
export default function PeriodTrend({ tren, selected }) {
  if (!tren?.length) return <p>Belum ada data untuk kombinasi filter ini.</p>;
  const lebar = 620;
  const x = (i) => 58 + i * ((lebar - 96) / (tren.length - 1));
  /* Sumbu memakai skala 1–4 seperti di tempat lain: 2 = Tidak Setuju,
     3 = Setuju, 4 = Sangat Setuju. */
  const y = (skor) => 150 - (skor - 2) * 60;

  return (
    <div className="period-trend">
      <svg viewBox={`0 0 ${lebar} 182`} role="img" aria-label="Perubahan rata-rata skor antar semester pada skala 1 sampai 4, beserta interval kepercayaan 95 persen">
        {[2, 3, 4].map((s) => (
          <g key={s}>
            <line x1="46" x2={lebar - 18} y1={y(s)} y2={y(s)} className="period-trend__guide" />
            <text x="14" y={y(s) + 4}>{s}</text>
          </g>
        ))}

        {tren.map((p, i) => {
          if (p.indeks == null) return null;
          const skor = keSkor(p.indeks);
          const sebelumnya = i > 0 ? tren[i - 1] : null;
          const arah = sebelumnya?.indeks != null ? arahPerubahan(p.indeks - sebelumnya.indeks) : null;
          return (
            <g key={p.key}>
              {p.ci && (
                <line x1={x(i)} x2={x(i)} y1={y(keSkor(p.ci.atas))} y2={y(keSkor(p.ci.bawah))} className="period-trend__ci" />
              )}
              {arah && (
                <line
                  x1={x(i - 1)}
                  y1={y(keSkor(sebelumnya.indeks))}
                  x2={x(i)}
                  y2={y(skor)}
                  className="period-trend__line"
                  style={{ stroke: WARNA[arah] }}
                />
              )}
              <circle
                cx={x(i)}
                cy={y(skor)}
                r={p.key === selected ? 5 : 4}
                className={p.key === selected ? 'period-trend__selected' : 'period-trend__point'}
              >
                <title>{p.label} ({p.rentang}): {formatAngka(skor, 2)} dari 4</title>
              </circle>
              <text x={x(i)} y={y(skor) - 12} textAnchor="middle" className="period-trend__nilai">{formatAngka(skor, 2)}</text>
              <text x={x(i)} y="168" textAnchor="middle" className="period-trend__tahun">{p.tahun}</text>
              <text x={x(i)} y="179" textAnchor="middle" className="period-trend__semester">{p.semester}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
