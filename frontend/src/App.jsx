import { useEffect, useState } from 'react';
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
import { getUser, getSession, logout } from './data/mock';
import { getSurveyUrl } from './data/surveyLinks';

export default function App() {
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
    return ['dashboard', 'instrumen-detail', 'survei'].includes(halaman) ? halaman : 'landing';
  });
  const [instrumenSlug, setInstrumenSlug] = useState(() => new URLSearchParams(window.location.search).get('instrumen'));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page === 'dashboard' || page === 'instrumen-detail' || page === 'survei') params.set('page', page);
    else params.delete('page');
    if (page === 'instrumen-detail' && instrumenSlug) params.set('instrumen', instrumenSlug);
    else params.delete('instrumen');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}${window.location.hash}`);
  }, [page, instrumenSlug]);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setPage(params.get('page') || 'landing');
      setInstrumenSlug(params.get('instrumen'));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const session = getSession();
  const role = session ? session.role : 'guest';

  const goMenu = (key) => {
    if (key === 'keluar') { logout(); return setPage('landing'); }
    if (key === 'beranda') return setPage('landing');
    if (key === 'dashboard') return setPage('dashboard');
    if (key === 'survei') return setPage('survei');
    if (key === 'pengaduan') return setPage(role === 'admin' ? 'kelola-pengaduan' : 'pengaduan');
    if (key === 'laporan') return setPage('laporan');
    if (key === 'profil') return setPage('profil');
  };

  const openInstrument = (slug) => { setInstrumenSlug(slug); setPage('instrumen-detail'); };

  if (page === 'auth') {
    return (
      <AuthPage
        onSuccess={() => setPage('dashboard')}
        onBack={() => setPage('landing')}
      />
    );
  }

  if (page === 'dashboard') {
    return (
      <Dashboard
        onBackToLanding={() => setPage('landing')}
        onNavigate={goMenu}
        onOpenInstrument={openInstrument}
      />
    );
  }

  if (page === 'survei') {
    return <SurveiPage onNavigate={goMenu} onOpenInstrument={openInstrument} />;
  }

  if (page === 'pengaduan') {
    return <PengaduanPage onNavigate={goMenu} />;
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
    const user = getUser();
    return (
      <div className="app-shell detail-shell">
        <Sidebar active="dashboard" onNavigate={goMenu} user={user} />
        <div className="app-main">
          <Topbar user={user} notifCount={3} onProfil={() => goMenu('profil')} />
          <main className="app-content">
            <InstrumentDetailPage slug={instrumenSlug} onBack={() => setPage('dashboard')} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <LandingPage
      onEnterDashboard={(tujuan) => {
        if (tujuan === 'pengaduan') {
          return setPage(session ? (session.role === 'admin' ? 'kelola-pengaduan' : 'pengaduan') : 'auth');
        }
        if (tujuan === 'survei') {
          return setPage(session ? 'survei' : 'auth');
        }
        return setPage(session ? 'dashboard' : 'auth');
      }}
      session={session}
    />
  );
}
