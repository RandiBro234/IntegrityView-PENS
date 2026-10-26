import { formatAngka } from '../../data/mock';
import { arahPerubahan } from '../../data/reportData';
import './PeriodTrend.css';

const WARNA = {
  naik: 'var(--teal-500)',
  turun: 'var(--error-500)',
  stabil: 'var(--gray-500)'
};

/* Grafik garis lurus (tanpa smoothing) untuk 5 semester.
   Tiap ruas diwarnai sesuai arah perubahan: naik hijau, turun merah,
   stabil abu-abu. Pita tipis = interval kepercayaan 95%. */
export default function PeriodTrend({ tren, selected }) {
  if (!tren?.length) return <p>Belum ada data untuk kombinasi filter ini.</p>;
  const lebar = 620;
  const x = (i) => 58 + i * ((lebar - 96) / (tren.length - 1));
  const y = (v) => 150 - (v - 50) * 2.4;

  return (
    <div className="period-trend">
      <svg viewBox={`0 0 ${lebar} 182`} role="img" aria-label="Perubahan indeks antar semester beserta interval kepercayaan 95 persen">
        {[60, 80, 100].map((v) => (
          <g key={v}>
            <line x1="46" x2={lebar - 18} y1={y(v)} y2={y(v)} className="period-trend__guide" />
            <text x="8" y={y(v) + 4}>{v}%</text>
          </g>
        ))}

        {tren.map((p, i) => {
          if (p.skor == null) return null;
          const sebelumnya = i > 0 ? tren[i - 1] : null;
          const arah = sebelumnya?.skor != null ? arahPerubahan(p.skor - sebelumnya.skor) : null;
          return (
            <g key={p.key}>
              <line x1={x(i)} x2={x(i)} y1={y(p.ci.atas)} y2={y(p.ci.bawah)} className="period-trend__ci" />
              {arah && (
                <line
                  x1={x(i - 1)}
                  y1={y(sebelumnya.skor)}
                  x2={x(i)}
                  y2={y(p.skor)}
                  className="period-trend__line"
                  style={{ stroke: WARNA[arah] }}
                />
              )}
              <circle
                cx={x(i)}
                cy={y(p.skor)}
                r={p.key === selected ? 5 : 4}
                className={p.key === selected ? 'period-trend__selected' : 'period-trend__point'}
              >
                <title>{p.label} ({p.rentang}): {formatAngka(p.skor)}%</title>
              </circle>
              <text x={x(i)} y={y(p.skor) - 12} textAnchor="middle" className="period-trend__nilai">{formatAngka(p.skor)}%</text>
              <text x={x(i)} y="168" textAnchor="middle" className="period-trend__tahun">{p.tahun}</text>
              <text x={x(i)} y="179" textAnchor="middle" className="period-trend__semester">{p.semester}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
