import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SurveiPage from './pages/SurveiPage';
import InstrumentDetailPage from './pages/InstrumentDetailPage';
import PengaduanPage from './pages/PengaduanPage';
import KelolaPengaduanPage from './pages/KelolaPengaduanPage';
import LaporanPage from './pages/LaporanPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import IvyWidget from './components/ivy/IvyWidget';
import { useAuth } from './auth/AuthProvider';
import { getSurveyUrl } from './data/surveyLinks';
import { dukungViewTransition, prefersReducedMotion } from './lib/motion';

const DURASI_KELUAR = 150;
const DURASI_MASUK = 260;

const HALAMAN = new Set([
  'dashboard',
  'instrumen-detail',
  'survei',
  'pengaduan',
  'kelola-pengaduan',
  'laporan',
  'profil'
]);

const HALAMAN_ADMIN = new Set(['kelola-pengaduan', 'laporan']);

const TAMU = { nama: 'Tamu', role: 'guest', inisial: 'TM' };

export default function App() {
  const { session, user, loading, signOut } = useAuth();
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const halaman = params.get('page');
    /* Route lama pengisian survei (/?page=survei-form&survei=<slug>,
       ?survei=<slug>, ?slug=<slug>, #/survei/<slug>) dialihkan ke Google Form
       instrumen terkait. Slug tak dikenal jatuh ke Pusat Survei, bukan 404. */
    const slugLama = params.get('survei') || params.get('slug')
      || (halaman === 'survei-form' ? params.get('instrumen') : null)
      || (window.location.hash.match(/^#\/?survei\/([^/?#]+)/) || [])[1];
    if (halaman === 'survei-form' || slugLama) {
      const url = slugLama ? getSurveyUrl(slugLama) : null;
      if (url) window.location.replace(url);
      return 'survei';
    }
    return HALAMAN.has(halaman) ? halaman : 'landing';
  });
  const [instrumenSlug, setInstrumenSlug] = useState(() => new URLSearchParams(window.location.search).get('instrumen'));
  /* Tab awal halaman WBS: 'buat' atau 'lacak'. */
  const [pengaduanTab, setPengaduanTab] = useState('buat');
  const [keluar, setKeluar] = useState(false);
  const [lembut, setLembut] = useState(false);

  /* Transisi konten antar halaman. Sidebar dan topbar tetap diam karena
     hanya area konten yang dianimasikan. View Transitions dipakai bila ada.
     Perpindahan ke/dari landing memakai fade seluruh halaman agar shell
     dashboard dan landing tidak saling memotong. */
  const pindah = useCallback((aksi, { fade = false } = {}) => {
    if (typeof aksi !== 'function') return;
    if (prefersReducedMotion()) { aksi(); return; }

    if (fade) {
      setLembut(true);
      setKeluar(true);
      window.setTimeout(() => {
        window.scrollTo(0, 0);
        aksi();
        setKeluar(false);
      }, DURASI_KELUAR);
      window.setTimeout(() => setLembut(false), DURASI_KELUAR + DURASI_MASUK);
      return;
    }

    if (dukungViewTransition()) {
      document.startViewTransition(() => { flushSync(aksi); });
      return;
    }
    setKeluar(true);
    window.setTimeout(() => { aksi(); setKeluar(false); }, DURASI_KELUAR);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page !== 'landing' && page !== 'auth') params.set('page', page);
    else params.delete('page');
    if (page === 'instrumen-detail' && instrumenSlug) params.set('instrumen', instrumenSlug);
    else params.delete('instrumen');
    const query = params.toString();
    const alamat = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, '', alamat);
  }, [page, instrumenSlug]);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const halaman = params.get('page') || 'landing';
      setPage(HALAMAN.has(halaman) ? halaman : 'landing');
      setInstrumenSlug(params.get('instrumen'));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  /* Route guard: semua halaman selain landing dan form login wajib sesi. */
  useEffect(() => {
    if (loading) return;
    if (page !== 'landing' && page !== 'auth' && !session) {
      setPage('auth');
      return;
    }
    if (HALAMAN_ADMIN.has(page) && user?.role !== 'admin') setPage('dashboard');
  }, [loading, page, session, user]);

  const role = user ? user.role : 'guest';
  const shellUser = user || TAMU;

  const goMenu = (key) => {
    if (key === 'keluar') {
      void signOut().finally(() => pindah(() => setPage('landing'), { fade: true }));
      return;
    }
    if (key === 'beranda') return pindah(() => setPage('landing'), { fade: true });
    if (key === 'dashboard') return pindah(() => setPage('dashboard'));
    if (key === 'survei') return pindah(() => setPage('survei'));
    if (key === 'pengaduan') return pindah(() => setPage(role === 'admin' ? 'kelola-pengaduan' : 'pengaduan'));
    if (key === 'laporan') return pindah(() => setPage('laporan'));
    if (key === 'profil') return pindah(() => setPage('profil'));
  };

  const openInstrument = (slug) => pindah(() => { setInstrumenSlug(slug); setPage('instrumen-detail'); });

  const renderHalaman = () => {
    if (page === 'auth') {
      return (
        <AuthPage
          onSuccess={() => pindah(() => setPage('dashboard'), { fade: true })}
          onBack={() => pindah(() => setPage('landing'), { fade: true })}
        />
      );
    }

    if (page === 'dashboard') {
      return (
        <Dashboard
          onBackToLanding={() => pindah(() => setPage('landing'), { fade: true })}
          onNavigate={goMenu}
          onOpenInstrument={openInstrument}
        />
      );
    }

    if (page === 'survei') {
      return <SurveiPage onNavigate={goMenu} onOpenInstrument={openInstrument} />;
    }

    if (page === 'pengaduan') {
      return <PengaduanPage onNavigate={goMenu} initialTab={pengaduanTab} />;
    }

    if (page === 'kelola-pengaduan') {
      return <KelolaPengaduanPage onNavigate={goMenu} />;
    }

    if (page === 'laporan') {
      return <LaporanPage onNavigate={goMenu} />;
    }

    if (page === 'profil') {
      return <ProfilePage onNavigate={goMenu} />;
    }

    if (page === 'instrumen-detail') {
      return (
        <div className="app-shell detail-shell">
          <Sidebar active="dashboard" onNavigate={goMenu} user={shellUser} />
          <div className="app-main">
            <Topbar user={shellUser} onProfil={() => goMenu('profil')} onNavigate={goMenu} />
            <main className="app-content">
              <InstrumentDetailPage slug={instrumenSlug} onBack={() => pindah(() => setPage('dashboard'))} />
            </main>
          </div>
        </div>
      );
    }

    return (
      <LandingPage
        onEnterDashboard={(tujuan, tab) => {
          if (tujuan === 'pengaduan') {
            setPengaduanTab(tab || 'buat');
            return pindah(() => setPage(user ? (user.role === 'admin' ? 'kelola-pengaduan' : 'pengaduan') : 'auth'), { fade: true });
          }
          if (tujuan === 'survei') {
            return pindah(() => setPage(user ? 'survei' : 'auth'), { fade: true });
          }
          return pindah(() => setPage(user ? 'dashboard' : 'auth'), { fade: true });
        }}
        onKeluar={() => {
          void signOut().finally(() => pindah(() => setPage('landing'), { fade: true }));
        }}
        session={user}
      />
    );
  };

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <span className="app-loading__mark">IV</span>
        <p>Memuat sesi…</p>
      </div>
    );
  }

  return (
    <>
      <div
        key={page === 'instrumen-detail' ? `${page}-${instrumenSlug}` : page}
        className={`page-transition ${lembut ? 'page-transition--fade' : ''} ${keluar ? 'is-out' : ''}`.trim()}
      >
        {renderHalaman()}
      </div>
      {/* Di luar wadah transisi: state percakapan tidak ikut reset saat pindah halaman. */}
      <IvyWidget instrumen={page === 'instrumen-detail' ? instrumenSlug : null} />
    </>
  );
}
