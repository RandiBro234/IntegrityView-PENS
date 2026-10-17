import { useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import RingkasanCards from '../components/dashboard/RingkasanCards';
import SebaranJawabanChart from '../components/dashboard/SebaranJawabanChart';
import StatistikPanel from '../components/dashboard/StatistikPanel';
import { getRingkasanDashboard, getSebaranPerInstrumen, getUser } from '../data/mock';
import { useSurveiData } from '../data/api';
import './Dashboard.css';

export default function Dashboard({ onBackToLanding, onNavigate, onOpenInstrument }) {
  const user = getUser();
  const { dataset, loading, error, fallback } = useSurveiData();
  const [selectedKey, setSelectedKey] = useState(null);

  const ringkasan = useMemo(
    () => (dataset ? getRingkasanDashboard(dataset) : null),
    [dataset]
  );
  const sebaran = useMemo(
    () => (dataset ? getSebaranPerInstrumen(dataset) : []),
    [dataset]
  );

  const activeKey = selectedKey ?? (sebaran.length ? sebaran[0].key : null);

  const handleMenu = (key) => {
    if (key === 'beranda') {
      if (onBackToLanding) onBackToLanding();
      return;
    }
    if (onNavigate) onNavigate(key);
  };

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" onNavigate={handleMenu} user={user} />

      <div className="app-main">
        <Topbar user={user} notifCount={3} onProfil={() => handleMenu('profil')} />

        <main className="app-content">
          {loading ? (
            <div className="dashboard__loading" role="status" aria-label="Memuat data dashboard">
              <div className="dashboard__loading-cards">
                <div className="skeleton skeleton--card" />
                <div className="skeleton skeleton--card" />
                <div className="skeleton skeleton--card" />
              </div>
              <div className="skeleton skeleton--panel" />
            </div>
          ) : (
            <>
              {fallback && (
                <p className="dashboard__notice" role="status">
                  Backend belum terhubung — menampilkan data simulasi.
                  {error ? ` (${error.message})` : ''}
                </p>
              )}

              <RingkasanCards ringkasan={ringkasan} />

              <div className="dashboard__duo">
                <section className="dashboard__box dashboard__box--left" aria-labelledby="sebaran-title">
                  <div className="dashboard__box-head">
                    <div>
                      <p className="label-eyebrow">Distribusi Jawaban</p>
                      <h2 className="dashboard__box-title" id="sebaran-title">Sebaran Jawaban per Instrumen</h2>
                    </div>
                  </div>
                  <SebaranJawabanChart
                    data={sebaran}
                    selectedKey={activeKey}
                    onSelect={setSelectedKey}
                    onOpenDetail={onOpenInstrument}
                  />
                </section>

                <section className="dashboard__box dashboard__box--right" aria-labelledby="statistik-title">
                  <div className="dashboard__box-head">
                    <div>
                      <p className="label-eyebrow">Analisis</p>
                      <h2 className="dashboard__box-title" id="statistik-title">Ringkasan Statistik & Rekomendasi</h2>
                    </div>
                  </div>
                  <StatistikPanel selectedKey={activeKey} dataset={dataset} onOpenDetail={onOpenInstrument} />
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
