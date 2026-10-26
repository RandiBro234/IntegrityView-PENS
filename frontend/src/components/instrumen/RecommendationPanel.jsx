import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RecommendationPanel.css';

const PRIORITAS_CLASS = {
  'Tinggi': 'prioritas--tinggi',
  'Sedang': 'prioritas--sedang',
  'Pantau': 'prioritas--pantau'
};

/* Saran tindak lanjut diturunkan dari tingkat prioritas, bukan mengubah data. */
const TINDAK_LANJUT = {
  'Tinggi': 'Jadwalkan perbaikan segera dan verifikasi ulang pada periode berikutnya.',
  'Sedang': 'Tindak lanjuti melalui unit terkait, lalu pantau perubahan skornya.',
  'Pantau': 'Pantau indikator ini pada periode berikutnya sebelum mengambil tindakan.'
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/* Tombol kecil "Lihat semua rekomendasi" + drawer daftar lengkap.
   Dipakai bersama oleh dashboard ringkasan dan semua dashboard instrumen. */
export default function RecommendationPanel({ items = [], judul = 'Semua Rekomendasi' }) {
  const [terbuka, setTerbuka] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const kosong = !items.length;

  useEffect(() => {
    if (!terbuka) return;
    const onKey = (event) => { if (event.key === 'Escape') setTerbuka(false); };
    const overflowSemula = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowSemula;
    };
  }, [terbuka]);

  const tutup = () => {
    setTerbuka(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="rek-trigger"
        onClick={() => setTerbuka(true)}
        disabled={kosong}
        title={kosong ? 'Belum ada rekomendasi' : undefined}
        aria-haspopup="dialog"
        aria-expanded={terbuka}
      >
        Lihat semua rekomendasi
        <ArrowIcon />
      </button>

      {terbuka && createPortal(
        <div
          className="rek-panel__overlay"
          onMouseDown={(event) => { if (event.target === event.currentTarget) tutup(); }}
        >
          <aside className="rek-panel" role="dialog" aria-modal="true" aria-label={judul}>
            <header className="rek-panel__head">
              <div>
                <p className="rek-panel__eyebrow">Rekomendasi Otomatis</p>
                <h2 className="rek-panel__title">{judul}</h2>
              </div>
              <button type="button" ref={closeRef} className="rek-panel__close" onClick={tutup} aria-label="Tutup panel rekomendasi">×</button>
            </header>

            <div className="rek-panel__body">
              <ol className="rek-panel__list">
                {items.map((r, i) => (
                  <li key={i} className="rek-panel__item">
                    <div className="rek-panel__item-head">
                      <span className={`reclist__prio ${PRIORITAS_CLASS[r.prioritas] || ''}`}>{r.prioritas}</span>
                      <p className="rek-panel__teks">{r.judul}</p>
                    </div>
                    <p className="rek-panel__meta"><span>Dasar data</span>{r.dasar}</p>
                    <p className="rek-panel__meta"><span>Tindak lanjut</span>{TINDAK_LANJUT[r.prioritas] || TINDAK_LANJUT.Pantau}</p>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}

