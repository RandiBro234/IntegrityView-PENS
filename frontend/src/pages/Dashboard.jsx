import { useLayoutEffect, useRef, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import RingkasanCards from '../components/dashboard/RingkasanCards';
import SebaranJawabanChart from '../components/dashboard/SebaranJawabanChart';
import StatistikPanel from '../components/dashboard/StatistikPanel';
import PeriodHeatmap from '../components/dashboard/PeriodHeatmap';
import ReportFilters from '../components/dashboard/ReportFilters';
import RingkasanDashboardTemplate from '../components/dashboard/RingkasanDashboardTemplate';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import { getUser } from '../data/mock';
import { unduhLaporanPdf, namaFileLaporan } from '../lib/reportPdf';
import './Dashboard.css';

export default function Dashboard({ onBackToLanding, onNavigate, onOpenInstrument }) {
  const user = getUser();
  const { filter, setFilter, siap } = useReportFilters();
  const [selectedKey, setSelectedKey] = useState(null);
  const [tab, setTab] = useState('sebaran');
  const [ekspor, setEkspor] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const reportRef = useRef(null);
  const [tanggalCetak] = useState(() => {
    const d = new Date();
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  });

  /* Indikator tab bergeser memakai transform, bukan left/width. */
  const tabRef = useRef(null);
  const [pil, setPil] = useState({ x: 0, skala: 1 });
  useLayoutEffect(() => {
    const wrap = tabRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector(`[data-tab="${tab}"]`);
    if (!btn) return;
    const wb = wrap.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    setPil({ x: bb.left - wb.left, skala: bb.width / 100 });
  }, [tab]);

  /* Semua angka dashboard berasal dari selector tunggal. */
  const laporan = getReportData(filter);
  const { ringkasan, sebaran } = laporan;

  const activeKey = laporan.instrumen.some((s) => s.info.key === selectedKey && s.aktif)
    ? selectedKey
    : sebaran[0]?.key || null;

  const handleMenu = (key) => {
    if (key === 'beranda') {
      if (onBackToLanding) onBackToLanding();
      return;
    }
    if (onNavigate) onNavigate(key);
  };

  const handleUnduh = async () => {
    if (!reportRef.current || mengunduh) return;
    setMengunduh(true);
    try {
      await unduhLaporanPdf(reportRef.current, namaFileLaporan('Ringkasan-ZI', laporan.periode.label));
      setEkspor(false);
    } finally {
      setMengunduh(false);
    }
  };

  return (
    <div className="app-shell dashboard-shell">
      <Sidebar active="dashboard" onNavigate={handleMenu} user={user} />

      <div className="app-main">
        <Topbar user={user} onProfil={() => handleMenu('profil')} onNavigate={handleMenu}>
          <ReportFilters ringkas filter={filter} onChange={setFilter} />
          <button
            type="button"
            className="btn btn-primary dashboard__ekspor"
            onClick={() => setEkspor(true)}
            disabled={!siap || ringkasan.totalInstrumen === 0}
          >
            Ekspor
          </button>
        </Topbar>

        <main className="app-content dashboard-page">
          <div className="dashboard__grid">
            {!siap ? (
              <div className="dashboard__loading" role="status" aria-label="Memuat data survei">
                <div className="dashboard__loading-cards">
                  <div className="skeleton skeleton--card" />
                  <div className="skeleton skeleton--card" />
                  <div className="skeleton skeleton--card" />
                </div>
                <div className="skeleton skeleton--panel" />
              </div>
            ) : laporan.error ? (
              <p className="dashboard__notice" role="alert">
                Gagal memuat data survei: {laporan.error}. Periksa koneksi Supabase lalu muat ulang halaman.
              </p>
            ) : ringkasan.totalInstrumen === 0 ? (
              <p className="dashboard__notice" role="status">
                Belum ada responden untuk kombinasi filter ini.
              </p>
            ) : (
              <>
                <RingkasanCards ringkasan={ringkasan} pembanding={laporan.periodePembanding} />

                <div className="dashboard__duo">
                  <section className="dashboard__box dashboard__box--left" aria-labelledby="sebaran-title">
                    <div className="dashboard__box-head">
                      <h2 className="dashboard__box-title" id="sebaran-title">
                        {tab === 'sebaran' ? 'Sebaran Jawaban per Instrumen' : 'Perubahan Skor per Semester'}
                      </h2>
                      <div className="dashboard__box-tools">
                        <div className="dashboard__tabs" role="group" aria-label="Tampilan grafik" ref={tabRef}>
                        <span
                          className="dashboard__tab-pil"
                          aria-hidden="true"
                          style={{ transform: `translateX(${pil.x}px) scaleX(${pil.skala})` }}
                        />
                        <button
                          type="button"
                          data-tab="sebaran"
                          className={tab === 'sebaran' ? 'is-active' : ''}
                          aria-pressed={tab === 'sebaran'}
                          onClick={() => setTab('sebaran')}
                        >
                          Sebaran
                        </button>
                        <button
                          type="button"
                          data-tab="perubahan"
                          className={tab === 'perubahan' ? 'is-active' : ''}
                          aria-pressed={tab === 'perubahan'}
                          onClick={() => setTab('perubahan')}
                        >
                          Perubahan
                        </button>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard__tab-panel" key={tab}>
                      {tab === 'sebaran' ? (
                        <SebaranJawabanChart
                          data={sebaran}
                          selectedKey={activeKey}
                          onSelect={setSelectedKey}
                          onOpenDetail={onOpenInstrument}
                        />
                      ) : (
                        <PeriodHeatmap
                          instrumen={laporan.instrumen}
                          periode={filter.periode}
                          selectedKey={activeKey}
                          onSelect={setSelectedKey}
                        />
                      )}
                    </div>
                  </section>

                  <section className="dashboard__box dashboard__box--right" aria-label="Ringkasan statistik dan rekomendasi">
                    <StatistikPanel
                      key={activeKey || 'kosong'}
                      selectedKey={activeKey}
                      laporan={laporan}
                      onOpenDetail={onOpenInstrument}
                    />
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {ekspor && (
        <div className="dashmodal__overlay" onClick={() => !mengunduh && setEkspor(false)} role="presentation">
          <div
            className="dashmodal"
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau Ringkasan Dashboard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashmodal__head">
              <h3>Pratinjau Ringkasan Dashboard</h3>
              <button type="button" className="dashmodal__close" onClick={() => setEkspor(false)} disabled={mengunduh} aria-label="Tutup">×</button>
            </div>
            <div className="dashmodal__preview">
              <div className="dashmodal__scale" ref={reportRef}>
                <RingkasanDashboardTemplate laporan={laporan} tanggalCetak={tanggalCetak} />
              </div>
            </div>
            <div className="dashmodal__foot">
              <button type="button" className="btn btn-outline-navy" onClick={() => setEkspor(false)} disabled={mengunduh}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUnduh} disabled={mengunduh}>
                {mengunduh ? 'Menyiapkan…' : 'Unduh PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

