import './DataQualityBadges.css';
import { formatAngka } from '../../data/mock';

/* Baris kecil indikator kualitas data instrumen. */
export default function DataQualityBadges({ persenSeragam, duplikat, n }) {
  const items = [];

  items.push({
    key: 'seragam',
    label: `Jawaban seragam ${formatAngka(persenSeragam)}%`,
    tone: persenSeragam > 50 ? 'warn' : 'ok'
  });

  items.push({
    key: 'duplikat',
    label: `Duplikat terdeteksi: ${duplikat}`,
    tone: duplikat > 0 ? 'warn' : 'ok'
  });

  if (n < 30) {
    items.push({
      key: 'n',
      label: `n = ${n}, di bawah 30 — data belum representatif`,
      tone: 'warn'
    });
  } else {
    items.push({
      key: 'n',
      label: `n = ${n}`,
      tone: 'ok'
    });
  }

  return (
    <div className="dqb">
      {items.map((it) => (
        <span key={it.key} className={`dqb__item dqb__item--${it.tone}`}>
          {it.label}
        </span>
      ))}
    </div>
  );
}
