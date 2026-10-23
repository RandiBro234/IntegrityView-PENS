import './instrumen-shared.css';
import { formatAngka } from '../../data/mock';

export const SKALA_WARNA = ['#C25E1E', '#F5843C', '#7FA8D9', '#0B1B33'];
export const SKALA_LABEL = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Setuju', 'Sangat Setuju'];

const MIN_LABEL_PCT = 7;

/* Satu baris stacked bar 100% untuk satu butir/instrumen.
   Layout: [nama 180px ellipsis] [bar flex] [persen 56px] [open icon opsional].
   Tinggi baris dikendalikan parent lewat prop style/rowHeight. */
export default function ItemDistributionBar({
  item,
  selected = false,
  onSelect,
  onOpenDetail,
  showName = true,
  showN = true,
  compact = false,
  height
}) {
  const Wrapper = onSelect ? 'button' : 'div';
  const wrapperProps = onSelect
    ? {
        type: 'button',
        onClick: () => onSelect(item.key ?? item.nama),
        'aria-pressed': selected,
        'aria-label': `Pilih ${item.namaPanjang || item.nama}`
      }
    : {};

  return (
    <Wrapper
      className={`idb ${selected ? 'is-selected' : ''} ${compact ? 'idb--compact' : ''} ${onSelect ? 'idb--clickable' : ''}`}
      style={height ? { height, minHeight: height } : undefined}
      {...wrapperProps}
    >
      {showName && (
        <span className="idb__name" title={item.namaPanjang || item.nama}>
          {item.nama}
          {item.sumber === 'simulasi' && <span className="idb__tag">simulasi</span>}
        </span>
      )}

      <span className="idb__bar" role="img" aria-label={`Sebaran jawaban ${item.nama}`}>
        {item.distribusiPersen.map((pct, i) => (
          <span
            key={i}
            className={`idb__seg ${item.sumber === 'simulasi' ? 'idb__seg--simulasi' : ''}`}
            style={{ width: pct + '%', background: SKALA_WARNA[i] }}
            title={`${SKALA_LABEL[i]}: ${formatAngka(pct)}% (n=${item.distribusiAbsolut[i]})`}
          >
            {pct >= MIN_LABEL_PCT && (
              <span className="idb__seg-label">{formatAngka(pct, 0)}%</span>
            )}
          </span>
        ))}
      </span>

      {showN && (
        <span className="idb__n">{formatAngka(item.persenSetuju ?? 0)}%</span>
      )}

      {onOpenDetail && (
        <span
          className="idb__open"
          role="button"
          tabIndex={0}
          aria-label={`Buka dashboard lengkap ${item.nama}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(item.key);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onOpenDetail(item.key);
            }
          }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      )}
    </Wrapper>
  );
}

export function SkalaLegend() {
  return (
    <div className="skala-legend">
      {SKALA_LABEL.map((l, i) => (
        <span key={l} className="skala-legend__item">
          <span className="skala-legend__swatch" style={{ background: SKALA_WARNA[i] }} />
          {i + 1} · {l}
        </span>
      ))}
    </div>
  );
}
