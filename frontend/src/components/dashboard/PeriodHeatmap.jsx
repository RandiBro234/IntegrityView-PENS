import { formatAngka } from '../../data/mock';
import { PERIODE, arahPerubahan } from '../../data/reportData';
import './PeriodHeatmap.css';

const PANAH = { naik: '↑', turun: '↓' };

export default function PeriodHeatmap({ instrumen, periode, selectedKey, onSelect }) {
  if (!instrumen.length) return <p>Belum ada data untuk kombinasi filter ini.</p>;

  return (
    <div className="heatmap" role="table" aria-label="Indeks instrumen per semester">
      <div className="heatmap__row heatmap__head" role="row">
        <span role="columnheader">Instrumen</span>
        {PERIODE.map((p) => (
          <span
            role="columnheader"
            key={p.key}
            title={`${p.label} · ${p.rentang}`}
            className={periode === p.key ? 'heatmap__active' : ''}
          >
            <b>{p.tahun}</b>
            <i>{p.semester}</i>
          </span>
        ))}
      </div>

      {instrumen.map((entry) => (
        <button
          key={entry.info.key}
          type="button"
          className={`heatmap__row heatmap__data ${selectedKey === entry.info.key ? 'heatmap__selected' : ''}`}
          onClick={() => onSelect(entry.info.key)}
          role="row"
          aria-label={`Pilih ${entry.info.namaPanjang}`}
        >
          <span role="rowheader">{entry.info.nama}</span>
          {entry.tren.map((p) => {
            const arah = arahPerubahan(p.deltaSemester);
            return (
              <span
                key={p.key}
                role="cell"
                className={`${periode === p.key ? 'heatmap__active' : ''} ${p.skor > 62 ? 'heatmap__cell--gelap' : ''}`.trim()}
                title={`${entry.info.nama} · ${p.label} (${p.rentang}): ${p.skor == null ? 'n < 5' : `${formatAngka(p.skor)}%`}`}
                style={{
                  backgroundColor: `rgba(11, 27, 51, ${p.skor == null ? 0.05 : 0.12 + p.skor / 125})`,
                  color: p.skor > 62 ? 'var(--white)' : 'var(--navy-900)'
                }}
              >
                <span className="heatmap__nilai">
                  {p.skor == null ? 'n < 5' : `${formatAngka(p.skor)}%`}
                  {(arah === 'naik' || arah === 'turun') && (
                    <small className={`heatmap__panah heatmap__panah--${arah}`} aria-label={arah}>
                      {PANAH[arah]}
                    </small>
                  )}
                </span>
              </span>
            );
          })}
        </button>
      ))}
    </div>
  );
}
