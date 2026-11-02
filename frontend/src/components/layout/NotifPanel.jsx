import { useEffect, useRef } from 'react';
import './NotifPanel.css';

/* Panel notifikasi topbar. Isi berasal dari data/notifikasi.js — tidak ada
   pesan contoh. Maksimal 5 item tampil agar panel tetap ringkas. */
export default function NotifPanel({ daftar, onPilih, onTandaiSemua, onTutup }) {
  const ref = useRef(null);
  const belumDibaca = daftar.filter((n) => !n.dibaca).length;

  useEffect(() => {
    const klikLuar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onTutup();
    };
    const tekanEsc = (e) => { if (e.key === 'Escape') onTutup(); };
    document.addEventListener('mousedown', klikLuar);
    document.addEventListener('keydown', tekanEsc);
    return () => {
      document.removeEventListener('mousedown', klikLuar);
      document.removeEventListener('keydown', tekanEsc);
    };
  }, [onTutup]);

  return (
    <div className="np" ref={ref} role="dialog" aria-label="Notifikasi">
      <div className="np__head">
        <strong className="np__title">Notifikasi</strong>
        {belumDibaca > 0 && (
          <button type="button" className="np__aksi" onClick={onTandaiSemua}>
            Tandai semua dibaca
          </button>
        )}
      </div>

      {daftar.length === 0 ? (
        <p className="np__kosong">Tidak ada notifikasi.</p>
      ) : (
        <ul className="np__list">
          {daftar.slice(0, 5).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`np__item ${n.dibaca ? '' : 'is-baru'}`}
                onClick={() => onPilih(n)}
              >
                <span className={`np__dot np__dot--${n.jenis}`} aria-hidden="true" />
                <span className="np__isi">
                  <span className="np__judul">{n.judul}</span>
                  <span className="np__detail">{n.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="np__catatan">Dihitung dari data pada perangkat ini.</p>
    </div>
  );
}
