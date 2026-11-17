import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../auth/AuthProvider';
import { formatTanggalWaktu, getPengaduan, getPengaduanLokal, simpanPengaduanLokal } from '../data/mock';
import { ambilLaporanSaya, laporanApiSiap } from '../data/laporanApi';
import './ProfilePage.css';

export default function ProfilePage({ onNavigate }) {
  const { user } = useAuth();
  const [laporanUser, setLaporanUser] = useState(() => getPengaduanLokal());
  const [memuat, setMemuat] = useState(() => Boolean(user && laporanApiSiap));
  const [error, setError] = useState('');
  const [tersalin, setTersalin] = useState('');
  const [tab, setTab] = useState('aktivitas'); // 'aktivitas' | 'keamanan'

  useEffect(() => {
    let aktif = true;
    const lokal = user?.demo ? getPengaduan() : getPengaduanLokal();
    setLaporanUser(lokal);
    if (!user || !laporanApiSiap || user.demo) {
      setMemuat(false);
      return undefined;
    }

    const muatLaporan = (awal = false) => {
      if (awal) setMemuat(true);
      ambilLaporanSaya()
        .then((rows) => {
          if (!aktif) return;
          const gabung = new Map(getPengaduanLokal().map((laporan) => [laporan.id, laporan]));
          rows.forEach((laporan) => gabung.set(laporan.id, laporan));
          const terbaru = [...gabung.values()].sort((a, b) => new Date(b.waktuLapor) - new Date(a.waktuLapor));
          terbaru.forEach((laporan) => simpanPengaduanLokal(laporan));
          setLaporanUser(terbaru);
          setError('');
        })
        .catch((err) => {
          if (aktif) setError(err.message || 'Gagal memuat laporan Anda.');
        })
        .finally(() => {
          if (aktif && awal) setMemuat(false);
        });
    };

    muatLaporan(true);
    const interval = window.setInterval(() => muatLaporan(), 30000);
    return () => {
      aktif = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const salinKode = async (kode) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(kode);
      setTersalin(kode);
      window.setTimeout(() => setTersalin(''), 2200);
    } catch {
      setTersalin('');
    }
  };

  const handleMenu = (key) => onNavigate && onNavigate(key);

  const profil = {
    nama: user?.nama || 'Tamu',
    inisial: user?.inisial || 'TM',
    roleLabel: user?.roleLabel || 'Pengunjung',
    email: user?.email || '—',
    nip: user?.nip || '—',
    unit: user?.unit || '—',
    jabatan: user?.jabatan || '—',
    sejak: user?.sejak || '—',
    bergabung: user?.bergabung || null,
    laporanUser
  };

  return (
    <div className="app-shell">
      <Sidebar active="profil" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} onProfil={() => handleMenu('profil')} onNavigate={handleMenu} />
        <main className="app-content">
          <div className="pf-shell">
            {/* Kartu identitas */}
            <section className="pf-hero">
              <div className="pf-hero__avatar" aria-hidden="true">{profil.inisial}</div>
              <div className="pf-hero__main">
                <p className="label-eyebrow">{profil.roleLabel}</p>
                <h1 className="pf-hero__name">{profil.nama}</h1>
                <p className="pf-hero__meta">{profil.jabatan} · {profil.unit}</p>
              </div>
              <button type="button" className="btn btn-outline-navy pf-hero__keluar" onClick={() => handleMenu('keluar')}>
                Keluar
              </button>
            </section>

            {/* Statistik personal */}
            <section className="pf-stats">
              <div className="pf-stat">
                <span className="pf-stat__value">{laporanUser.length}</span>
                <span className="pf-stat__label">Laporan dibuat</span>
              </div>
              <div className="pf-stat">
                <span className="pf-stat__value">{profil.sejak}</span>
                <span className="pf-stat__label">Bergabung sejak</span>
              </div>
              <div className="pf-stat">
                <span className={`pf-stat__value ${user?.role === 'admin' ? 'pf-stat__value--ok' : ''}`}>
                  {user?.role === 'admin' ? 'Admin' : 'Aktif'}
                </span>
                <span className="pf-stat__label">Status akun</span>
              </div>
            </section>

            <div className="pf-grid">
              {/* Data akun */}
              <section className="pf-card">
                <h2 className="pf-card__title">Data Akun</h2>
                <ul className="pf-dl">
                  <li><span>Email institusi</span><span>{profil.email}</span></li>
                  <li><span>NIP / NIK</span><span>{profil.nip}</span></li>
                  <li><span>Unit / Jurusan</span><span>{profil.unit}</span></li>
                  <li><span>Jabatan</span><span>{profil.jabatan}</span></li>
                  {profil.bergabung && (
                    <li><span>Akun dibuat</span><span>{formatTanggalWaktu(profil.bergabung)}</span></li>
                  )}
                </ul>
              </section>

              {/* Aktivitas & keamanan */}
              <section className="pf-card">
                <div className="pf-card__tabs">
                  <button
                    type="button"
                    className={`pf-card__tab ${tab === 'aktivitas' ? 'is-active' : ''}`}
                    onClick={() => setTab('aktivitas')}
                  >
                    Aktivitas
                  </button>
                  <button
                    type="button"
                    className={`pf-card__tab ${tab === 'keamanan' ? 'is-active' : ''}`}
                    onClick={() => setTab('keamanan')}
                  >
                    Keamanan &amp; Privasi
                  </button>
                </div>

                {tab === 'aktivitas' ? (
                  memuat ? (
                    <p className="pf-empty">Memuat laporan Anda…</p>
                  ) : error ? (
                    <p className="pf-empty">{error}</p>
                  ) : laporanUser.length === 0 ? (
                    <p className="pf-empty">Belum ada laporan yang Anda buat. Buka kanal WBS untuk menyampaikan laporan.</p>
                  ) : (
                    <div className="pf-aktivitas" role="list">
                      <div className="pf-aktivitas__head" aria-hidden="true">
                        <span>Kode</span>
                        <span>Jenis laporan</span>
                        <span>Waktu</span>
                        <span>Status</span>
                        <span>Aksi</span>
                      </div>
                      {laporanUser.map((l) => (
                        <div className="pf-aktivitas__row" key={l.id} role="listitem">
                          <strong className="pf-aktivitas__kode">{l.id}</strong>
                          <span className="pf-aktivitas__teks">{l.judul}</span>
                          <span className="pf-aktivitas__waktu">{formatTanggalWaktu(l.waktuLapor)}</span>
                          <span className={`badge badge-status pf-aktivitas__status badge-status-${l.status.toLowerCase()}`}>
                            <span className="pf-aktivitas__status-dot" aria-hidden="true" />
                            {l.status}
                          </span>
                          <button type="button" className="btn btn-outline-navy pf-aktivitas__copy" onClick={() => salinKode(l.id)}>
                            {tersalin === l.id ? 'Tersalin' : 'Salin kode'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <ul className="pf-info">
                    <li>
                      <strong>Anonimitas laporan terjaga.</strong> Untuk laporan anonim, nama, kontak, dan hubungan tidak disimpan. Laporan tetap tertaut ke akun Anda secara internal agar muncul di Laporan Saya; data akun pelapor tidak ditampilkan ke admin.
                    </li>
                    <li>
                      <strong>Sesi disimpan di perangkat.</strong> Anda tetap masuk sampai menekan Keluar.
                    </li>
                    <li>
                      <strong>Survei diisi lewat Google Form.</strong> Aplikasi hanya menampilkan hasil agregat, tanpa menampilkan identitas responden.
                    </li>
                  </ul>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
