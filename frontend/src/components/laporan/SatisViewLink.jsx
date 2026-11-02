import { SATISVIEW_URL, SATISVIEW_NAMA } from '../../data/reportCategories';
import './SatisViewLink.css';

/* Tautan ke SatisView. Bila alamat belum diisi di reportCategories.js,
   nama ditampilkan sebagai teks biasa agar tidak menjadi tautan mati. */
export default function SatisViewLink({ className = '' }) {
  if (!SATISVIEW_URL) {
    return (
      <span
        className={`satisview-link ${className}`.trim()}
        title="Alamat SatisView belum diatur"
      >
        {SATISVIEW_NAMA}
      </span>
    );
  }
  return (
    <a
      className={`satisview-link ${className}`.trim()}
      href={SATISVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {SATISVIEW_NAMA}
    </a>
  );
}
