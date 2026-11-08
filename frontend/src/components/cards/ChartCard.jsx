import { useMemo, useState } from 'react';
import './cards.css';

function buildPath(points, w, h, pad) {
  if (!points.length) return '';
  const xs = points.map((_, i) => pad.l + (i * (w - pad.l - pad.r)) / (points.length - 1));
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const ys = points.map((v) => pad.t + (1 - (v - min) / range) * (h - pad.t - pad.b));

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const x0 = xs[i - 1], y0 = ys[i - 1];
    const x1 = xs[i], y1 = ys[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return { d, xs, ys, min, max };
}

export default function ChartCard({ title, subtitle, labels, dates, series, benchmark, benchmarkLabel }) {
  const W = 560, H = 220;
  const pad = useMemo(() => ({ t: 16, r: 16, b: 28, l: 36 }), []);
  const [hover, setHover] = useState(null);

  const main = useMemo(() => buildPath(series, W, H, pad), [series, pad]);
  const benchY = useMemo(() => {
    if (benchmark == null) return null;
    const range = (main.max - main.min) || 1;
    return pad.t + (1 - (benchmark - main.min) / range) * (H - pad.t - pad.b);
  }, [benchmark, main, pad]);

  const ticks = useMemo(() => {
    const min = main.min, max = main.max, range = max - min || 1;
    const n = 4;
    const arr = [];
    for (let i = 0; i <= n; i++) {
      const v = min + (range * i) / n;
      arr.push({ v, y: pad.t + (1 - i / n) * (H - pad.t - pad.b) });
    }
    return arr;
  }, [main, pad]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const plotW = W - pad.l - pad.r;
    const rel = (x / rect.width) * W - pad.l;
    const idx = Math.round((rel / plotW) * (series.length - 1));
    const clamped = Math.max(0, Math.min(series.length - 1, idx));
    setHover(clamped);
  };

  return (
    <article className="card chart-card">
      <div className="chart-card__head">
        <div>
          <p className="label-eyebrow">{title}</p>
          {subtitle && <p className="chart-card__sub">{subtitle}</p>}
        </div>
        <div className="chart-card__legend">
          <span className="chart-card__legend-item">
            <span className="chart-card__legend-dot chart-card__legend-dot--main" />
            Indeks Persepsi Integritas
          </span>
          {benchmark != null && (
            <span className="chart-card__legend-item">
              <span className="chart-card__legend-dot chart-card__legend-dot--bench" />
              {benchmarkLabel || `Benchmark ${benchmark}%`}
            </span>
          )}
        </div>
      </div>

      <div className="chart-card__plot" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-card__svg" aria-hidden="true">
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={t.y} y2={t.y} stroke="var(--gray-200)" strokeWidth="1" strokeDasharray="3 5" />
              <text x={pad.l - 8} y={t.y + 4} fontSize="10.5" fill="var(--gray-500)" textAnchor="end">{t.v.toFixed(0)}%</text>
            </g>
          ))}

          {benchY != null && (
            <line
              x1={pad.l} x2={W - pad.r} y1={benchY} y2={benchY}
              stroke="var(--teal-500)" strokeWidth="1.5" strokeDasharray="5 5"
            />
          )}

          <path d={main.d} fill="none" stroke="var(--orange-500)" strokeWidth="2.5" strokeLinecap="round" />

          {hover != null && (
            <g>
              <line x1={main.xs[hover]} x2={main.xs[hover]} y1={pad.t} y2={H - pad.b} stroke="var(--navy-900)" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
              <circle cx={main.xs[hover]} cy={main.ys[hover]} r="5" fill="var(--orange-500)" stroke="#fff" strokeWidth="2" />
            </g>
          )}

          {labels.map((l, i) => (
            <text key={l} x={main.xs[i]} y={H - 8} fontSize="11" fill="var(--gray-500)" textAnchor="middle">{l}</text>
          ))}
        </svg>

        {hover != null && (
          <div
            className="chart-card__tooltip"
            style={{
              left: `${(main.xs[hover] / W) * 100}%`,
              top: `${(main.ys[hover] / H) * 100}%`
            }}
          >
            <span className="chart-card__tooltip-date">{dates ? dates[hover] : labels[hover]}</span>
            <span className="chart-card__tooltip-value">{series[hover].toFixed(1).replace('.', ',')}%</span>
          </div>
        )}
      </div>
    </article>
  );
}
