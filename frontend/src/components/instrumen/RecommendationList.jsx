import './RecommendationList.css';

const PRIORITAS_CLASS = {
  'Tinggi': 'prioritas--tinggi',
  'Sedang': 'prioritas--sedang',
  'Pantau': 'prioritas--pantau'
};

/* Daftar rekomendasi: baris 1 = prioritas + judul (line-clamp 1) + Detail kanan,
   baris 2 = dasar data (line-clamp 1). Jarak antar item 12px. */
export default function RecommendationList({ items, max = 3, onDetail, compact = false }) {
  if (!items || !items.length) {
    return (
      <p className="reclist__empty">Tidak ada rekomendasi — seluruh indikator dalam batas wajar.</p>
    );
  }

  const shown = items.slice(0, max);

  return (
    <ul className={`reclist ${compact ? 'reclist--compact' : ''}`}>
      {shown.map((r, i) => (
        <li key={i} className="reclist__item">
          <div className="reclist__row1">
            <span className={`reclist__prio ${PRIORITAS_CLASS[r.prioritas] || ''}`}>
              {r.prioritas}
            </span>
            <p className="reclist__teks" title={r.teks}>{r.teks}</p>
            {onDetail && (
              <button
                type="button"
                className="reclist__detail"
                onClick={() => onDetail(r)}
                aria-label={`Detail rekomendasi: ${r.teks}`}
              >
                Detail
              </button>
            )}
          </div>
          <p className="reclist__dasar" title={r.dasar}>{r.dasar}</p>
        </li>
      ))}
    </ul>
  );
}
