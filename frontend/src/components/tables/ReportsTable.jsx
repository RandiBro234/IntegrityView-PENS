import { useMemo, useState } from 'react';
import './ReportsTable.css';

const STATUS_OPTIONS = ['Semua', 'Baru', 'Diproses', 'Selesai'];

function statusClass(s) {
  if (s === 'Baru') return 'badge-status-baru';
  if (s === 'Diproses') return 'badge-status-diproses';
  if (s === 'Selesai') return 'badge-status-selesai';
  return '';
}

export default function ReportsTable({ rows, filterQuery = '' }) {
  const [status, setStatus] = useState('Semua');
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let out = rows.slice();
    if (status !== 'Semua') out = out.filter(r => r.status === status);
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      out = out.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.judul.toLowerCase().includes(q) ||
        r.kategori.toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, status, filterQuery]);

  return (
    <article className="card reports-card">
      <div className="reports-card__head">
        <div>
          <p className="label-eyebrow">Laporan WBS Terbaru</p>
          <p className="reports-card__sub">{filtered.length} laporan dalam filter saat ini</p>
        </div>
        <div className="reports-card__filters" role="tablist" aria-label="Filter status">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              className={`reports-card__filter ${status === s ? 'is-active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="reports-card__table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
                    <th>Kode Laporan</th>
              <th>
                <button type="button" className="reports-table__sort" onClick={() => setSortDesc(v => !v)}>
                  Tanggal {sortDesc ? '↓' : '↑'}
                </button>
              </th>
              <th>Judul</th>
              <th>Kategori</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr
                key={r.id}
                className={selected === r.id ? 'is-selected' : ''}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
              >
                <td className="reports-table__id">{r.id}</td>
                <td className="reports-table__date">{r.tanggal}</td>
                <td className="reports-table__judul">{r.judul}</td>
                <td className="reports-table__kategori">{r.kategori}</td>
                <td>
                  <span className={`badge badge-status ${statusClass(r.status)}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="reports-table__empty">Tidak ada laporan yang cocok dengan filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="reports-card__detail">
          {(() => {
            const r = rows.find(x => x.id === selected);
            if (!r) return null;
            return (
              <>
                <div className="reports-card__detail-head">
                  <span className="reports-table__id">{r.id}</span>
                  <span className={`badge badge-status ${statusClass(r.status)}`}>{r.status}</span>
                  <button type="button" className="reports-card__close" onClick={() => setSelected(null)} aria-label="Tutup detail">×</button>
                </div>
                <p className="reports-card__detail-judul">{r.judul}</p>
                <p className="reports-card__detail-meta">Kategori: <strong>{r.kategori}</strong></p>
              </>
            );
          })()}
        </div>
      )}
    </article>
  );
}
