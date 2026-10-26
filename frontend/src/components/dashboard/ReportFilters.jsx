import { useEffect, useRef, useState } from 'react';
import {
  PERIODE, PERIODE_AWAL, PILIHAN_PEMBANDING, PILIHAN_KATEGORI
} from '../../data/surveyData';
import InfoTip from './InfoTip';
import './ReportFilters.css';

const CATATAN_DASAR = 'Responden tiap semester berbeda, sehingga selisih skor membandingkan kelompok responden yang berbeda, bukan perubahan pada orang yang sama.';

export default function ReportFilters({ filter, onChange, memakaiSimulasi = false }) {
  const [terbuka, setTerbuka] = useState(false);
  const menuRef = useRef(null);
  const periodeAwal = filter.periode === PERIODE_AWAL;
  const periodeTerpilih = PERIODE.find((p) => p.key === filter.periode);
  const kategoriAktif = filter.kategori !== 'Semua';

  const catatan = memakaiSimulasi
    ? `${CATATAN_DASAR} Sebagian periode berupa simulasi untuk mendemonstrasikan fitur.`
    : CATATAN_DASAR;

  const pilih = (key) => (event) => {
    const nilai = event.target.value;
    if (key === 'periode') {
      onChange({ ...filter, periode: nilai, pembanding: nilai === PERIODE_AWAL ? 'tanpa' : 'sebelumnya' });
    } else {
      onChange({ ...filter, [key]: nilai });
    }
  };

  useEffect(() => {
    if (!terbuka) return;
    const tutupDiLuar = (event) => { if (!menuRef.current?.contains(event.target)) setTerbuka(false); };
    const tutupEscape = (event) => {
      if (event.key === 'Escape') {
        setTerbuka(false);
        menuRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', tutupDiLuar);
    document.addEventListener('keydown', tutupEscape);
    return () => {
      document.removeEventListener('pointerdown', tutupDiLuar);
      document.removeEventListener('keydown', tutupEscape);
    };
  }, [terbuka]);

  return (
    <div className="report-filters" role="group" aria-label="Filter laporan">
      <select
        aria-label="Periode"
        className="report-filters__periode"
        value={filter.periode}
        onChange={pilih('periode')}
        title={periodeTerpilih ? `${periodeTerpilih.label} · ${periodeTerpilih.rentang}` : undefined}
      >
        {PERIODE.map((p) => (
          <option key={p.key} value={p.key}>Periode: {p.label}</option>
        ))}
      </select>

      <select
        aria-label="Bandingkan dengan"
        className="report-filters__compare"
        value={filter.pembanding}
        onChange={pilih('pembanding')}
        disabled={periodeAwal}
        title={periodeAwal ? 'Semester paling awal tidak memiliki pembanding' : undefined}
      >
        {PILIHAN_PEMBANDING.map((p) => (
          <option key={p.key} value={p.key}>Bandingkan: {p.label}</option>
        ))}
      </select>

      <div className="report-filters__more" ref={menuRef}>
        <button
          type="button"
          className="report-filters__toggle"
          aria-expanded={terbuka}
          aria-controls="report-filters-more"
          onClick={() => setTerbuka((v) => !v)}
        >
          Filter lainnya{kategoriAktif && <span className="report-filters__count">1</span>}
        </button>
        {terbuka && (
          <div id="report-filters-more" className="report-filters__popover">
            <label>Kategori instrumen
              <select value={filter.kategori} onChange={pilih('kategori')}>
                {PILIHAN_KATEGORI.map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      <span className="report-filters__spacer" />
      <InfoTip label="Catatan perbandingan antar semester" teks={catatan} />
    </div>
  );
}
