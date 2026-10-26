import { useEffect, useState } from 'react';
import './Topbar.css';

function formatTanggal(d) {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}
function formatJam(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}.${p(d.getMinutes())}`;
}

export default function Topbar({ user, notifCount = 3, onSearch, onProfil, showSearch = true, compact = false }) {
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className={`topbar ${compact ? 'topbar--compact' : ''}`}>
      <div className="topbar__left">
        <p className="topbar__greeting">
          Hai, {user?.nama?.split(' ')[0] || 'Pengunjung'}
        </p>
      </div>

      <div className="topbar__center">
        {showSearch && (
          <div className="topbar__search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              type="search"
              placeholder="Cari instrumen, laporan, atau kode laporan…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              aria-label="Pencarian"
            />
          </div>
        )}
      </div>

      <div className="topbar__right">
        <div className="topbar__clock" aria-label="Waktu saat ini">
          <span className="topbar__clock-time">{formatJam(now)}</span>
          <span className="topbar__clock-date">{formatTanggal(now)}</span>
        </div>

        <button type="button" className="topbar__notif" aria-label={`${notifCount} notifikasi belum dibaca`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {notifCount > 0 && <span className="topbar__notif-badge">{notifCount}</span>}
        </button>

        {user && user.role !== 'guest' ? (
          <button
            type="button"
            className="topbar__avatar"
            onClick={() => onProfil && onProfil()}
            aria-label={`Buka profil ${user.nama}`}
            title={user.nama}
          >
            {user.inisial}
          </button>
        ) : (
          <button type="button" className="btn btn-primary topbar__cta" onClick={() => onProfil && onProfil()}>
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}

