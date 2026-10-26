import { formatAngka } from '../../data/mock';
import { PERIODE, arahPerubahan } from '../../data/surveyData';
import './PeriodHeatmap.css';

const PANAH = { naik: '↑', turun: '↓' };

export default function PeriodHeatmap({ instrumen, periode, selectedKey, onSelect }) {
  const adaData = instrumen.some((entry) => entry.tren.some((p) => p.indeks != null));
  if (!instrumen.length || !adaData) return <p>Belum ada responden untuk kombinasi filter ini.</p>;

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
            const gelap = p.indeks != null && p.indeks > 62;
            return (
              <span
                key={p.key}
                role="cell"
                className={`${periode === p.key ? 'heatmap__active' : ''} ${gelap ? 'heatmap__cell--gelap' : ''}`.trim()}
                title={`${entry.info.nama} · ${p.label} (${p.rentang}): ${p.indeks == null ? 'belum ada data' : `${formatAngka(p.indeks)}%`}`}
                style={{
                  backgroundColor: `rgba(11, 27, 51, ${p.indeks == null ? 0.05 : 0.12 + p.indeks / 125})`,
                  color: gelap ? 'var(--white)' : 'var(--navy-900)'
                }}
              >
                <span className="heatmap__nilai">
                  {p.indeks == null ? '—' : `${formatAngka(p.indeks)}%`}
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
