import { useState } from 'react';
import './Sidebar.css';

const MENUS = [
  { key: 'beranda', label: 'Beranda', icon: IconHome },
  { key: 'dashboard', label: 'Dashboard', icon: IconGrid },
  { key: 'survei', label: 'Survei', icon: IconClipboard },
  { key: 'pengaduan', label: 'WBS', icon: IconShield },
  { key: 'laporan', label: 'Laporan', icon: IconFile },
];

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 10h6M9 14h6" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function Sidebar({ active, onNavigate, user }) {
  const [hoverKey, setHoverKey] = useState(null);
  const menus = user && user.role === 'admin' ? MENUS : MENUS.filter((m) => m.key !== 'laporan');

  return (
    <aside className="sidebar" aria-label="Navigasi utama">
      <div className="sidebar__logo" aria-hidden="true">
        <span className="sidebar__logo-mark">IV</span>
      </div>

      <nav className="sidebar__nav">
        {menus.map((m) => {
          const Icon = m.icon;
          const isActive = active === m.key;
          return (
            <button
              key={m.key}
              type="button"
              className={`sidebar__item ${isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate && onNavigate(m.key)}
              onMouseEnter={() => setHoverKey(m.key)}
              onMouseLeave={() => setHoverKey(null)}
              aria-label={m.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon />
              {hoverKey === m.key && (
                <span className="sidebar__tooltip" role="tooltip">{m.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__bottom">
        <button
          type="button"
          className="sidebar__item"
          onClick={() => onNavigate && onNavigate('profil')}
          onMouseEnter={() => setHoverKey('profil')}
          onMouseLeave={() => setHoverKey(null)}
          aria-label="Profil"
        >
          <IconUser />
          {hoverKey === 'profil' && (
            <span className="sidebar__tooltip" role="tooltip">Profil</span>
          )}
        </button>
        <button
          type="button"
          className="sidebar__item"
          onClick={() => onNavigate && onNavigate('keluar')}
          onMouseEnter={() => setHoverKey('keluar')}
          onMouseLeave={() => setHoverKey(null)}
          aria-label="Keluar"
        >
          <IconLogout />
          {hoverKey === 'keluar' && (
            <span className="sidebar__tooltip" role="tooltip">Keluar</span>
          )}
        </button>
        {user && (
          <div className="sidebar__avatar" title={user.nama}>
            {user.inisial}
          </div>
        )}
      </div>
    </aside>
  );
}
