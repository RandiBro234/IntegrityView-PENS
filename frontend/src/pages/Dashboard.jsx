import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import RingkasanCards from '../components/dashboard/RingkasanCards';
import SebaranJawabanChart from '../components/dashboard/SebaranJawabanChart';
import StatistikPanel from '../components/dashboard/StatistikPanel';
import PeriodHeatmap from '../components/dashboard/PeriodHeatmap';
import ReportFilters from '../components/dashboard/ReportFilters';
import { getReportData } from '../data/surveyData';
import { useReportFilters } from '../data/useReportFilters';
import { getUser } from '../data/mock';
import './Dashboard.css';

export default function Dashboard({ onBackToLanding, onNavigate, onOpenInstrument }) {
  const user = getUser();
  const { filter, setFilter, siap } = useReportFilters();
  const [selectedKey, setSelectedKey] = useState(null);
  const [tab, setTab] = useState('sebaran');

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

  return (
    <div className="app-shell dashboard-shell">
      <Sidebar active="dashboard" onNavigate={handleMenu} user={user} />

      <div className="app-main">
        <Topbar user={user} notifCount={3} onProfil={() => handleMenu('profil')} />

        <main className="app-content dashboard-page">
          <div className="dashboard__grid">
            <ReportFilters filter={filter} onChange={setFilter} memakaiSimulasi={laporan.memakaiSimulasi} />

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
                        {tab === 'sebaran' ? 'Sebaran Jawaban per Instrumen' : 'Perubahan Indeks per Semester'}
                      </h2>
                      <div className="dashboard__tabs" role="group" aria-label="Tampilan grafik">
                        <button
                          type="button"
                          className={tab === 'sebaran' ? 'is-active' : ''}
                          aria-pressed={tab === 'sebaran'}
                          onClick={() => setTab('sebaran')}
                        >
                          Sebaran
                        </button>
                        <button
                          type="button"
                          className={tab === 'perubahan' ? 'is-active' : ''}
                          aria-pressed={tab === 'perubahan'}
                          onClick={() => setTab('perubahan')}
                        >
                          Perubahan
                        </button>
                      </div>
                    </div>

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
                  </section>

                  <section className="dashboard__box dashboard__box--right" aria-label="Ringkasan statistik dan rekomendasi">
                    <StatistikPanel
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
    </div>
  );
}

