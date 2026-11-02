import { useEffect, useRef, useState } from 'react';
import './SebaranJawabanChart.css';
import { formatAngka } from '../../data/mock';
import { SKALA } from '../../data/surveyData';
import Delta from './Delta';

/* Legenda satu baris, sejajar tepi kolom nama dan tepi kolom aksi. */
export function SebaranLegend() {
  return (
    <div className="sebaran__legend" aria-label="Skala jawaban Likert">
      {SKALA.map((s) => (
        <span key={s.singkat} className="sebaran__legend-item" title={`${s.singkat} · ${s.label}`}>
          <span className="sebaran__legend-swatch" style={{ backgroundColor: s.warna }} />
          <span className="sebaran__legend-full">{s.label}</span>
          <span className="sebaran__legend-short">{s.singkat}</span>
        </span>
      ))}
    </div>
  );
}

export default function SebaranJawabanChart({ data, selectedKey, onSelect, onOpenDetail }) {
  const [tooltip, setTooltip] = useState(null);
  const [barWidth, setBarWidth] = useState(0);
  const innerRef = useRef(null);

  useEffect(() => {
    const bar = innerRef.current?.querySelector('.sebaran__bar');
    if (!bar) return;
    const ro = new ResizeObserver(() => setBarWidth(bar.getBoundingClientRect().width));
    ro.observe(bar);
    return () => ro.disconnect();
  }, [data]);

  if (!data || !data.length) {
    return (
      <div className="sebaran sebaran--empty">
        <p>Belum ada responden untuk kombinasi filter ini.</p>
      </div>
    );
  }

  const showTip = (e, item, segIdx) => {
    const rect = e.currentTarget.closest('.sebaran__inner').getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, item, segIdx });
  };

  /* Kunci berubah saat data berubah, sehingga batang tumbuh ulang dari kiri
     alih-alih melompat ke nilai baru. */
  const versi = data.map((item) => `${item.key}:${Math.round(item.indeks * 10)}`).join('|');

  return (
    <div className="sebaran" key={versi}>
      <SebaranLegend />
      <div className="sebaran__inner" ref={innerRef} onMouseLeave={() => setTooltip(null)}>
        {data.map((item, baris) => {
          const isSelected = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              className={`sebaran__row ${isSelected ? 'is-selected' : ''}`}
              style={{ '--row-index': baris }}
              onClick={() => onSelect(item.key)}
              aria-pressed={isSelected}
              aria-label={`Pilih ${item.namaPanjang}, indeks ${formatAngka(item.indeks)} persen`}
            >
              <span className="sebaran__name" title={item.namaPanjang}>{item.nama}</span>

              <span className="sebaran__bar" role="img" aria-label={`Sebaran jawaban ${item.nama}`}>
                {item.distribusiPersen.map((pct, i) => (
                  <span
                    key={i}
                    className="sebaran__seg"
                    style={{ width: pct + '%', backgroundColor: SKALA[i].warna }}
                    onMouseMove={(e) => showTip(e, item, i)}
                  >
                    {barWidth * pct / 100 >= 40 && (
                      <span className="sebaran__seg-label">{formatAngka(pct, 0)}%</span>
                    )}
                  </span>
                ))}
              </span>

              <span className="sebaran__pct">{formatAngka(item.indeks)}%</span>

              <span className="sebaran__delta-slot">
                <Delta value={item.delta} compact />
              </span>

              <span className="sebaran__open-slot">
                {onOpenDetail && (
                  <span
                    className="sebaran__open"
                    role="button"
                    tabIndex={0}
                    aria-label={`Buka dashboard lengkap ${item.nama}`}
                    title={`Dashboard lengkap ${item.nama}`}
                    onClick={(e) => { e.stopPropagation(); onOpenDetail(item.key); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenDetail(item.key);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {tooltip && (
          <div className="sebaran__tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 8 }} role="status">
            <strong>{tooltip.item.namaPanjang}</strong>
            <span>
              {SKALA[tooltip.segIdx].label} ({tooltip.segIdx + 1}):{' '}
              {formatAngka(tooltip.item.distribusiPersen[tooltip.segIdx])}%
            </span>
            <span className="sebaran__tooltip-note">n = {tooltip.item.n} responden</span>
          </div>
        )}
      </div>
    </div>
  );
}
