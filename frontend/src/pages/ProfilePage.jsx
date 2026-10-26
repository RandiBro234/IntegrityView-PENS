import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { getUser, getProfilDetail, formatTanggalWaktu } from '../data/mock';
import './ProfilePage.css';

export default function ProfilePage({ onNavigate }) {
  const user = getUser();
  const profil = getProfilDetail();
  const [tab, setTab] = useState('aktivitas'); // 'aktivitas' | 'keamanan'

  const handleMenu = (key) => onNavigate && onNavigate(key);

  return (
    <div className="app-shell">
      <Sidebar active="profil" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} notifCount={0} onProfil={() => handleMenu('profil')} />
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
                <span className="pf-stat__value">{profil.statistik.laporanDibuat}</span>
                <span className="pf-stat__label">Laporan dibuat</span>
              </div>
              <div className="pf-stat">
                <span className="pf-stat__value">{profil.sejak}</span>
                <span className="pf-stat__label">Bergabung sejak</span>
              </div>
              <div className="pf-stat">
                <span className={`pf-stat__value ${user.role === 'admin' ? 'pf-stat__value--ok' : ''}`}>
                  {user.role === 'admin' ? 'Admin' : 'Aktif'}
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
                    <li><span>Sesi dimulai</span><span>{formatTanggalWaktu(profil.bergabung)}</span></li>
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
                  profil.laporanUser.length === 0 ? (
                    <p className="pf-empty">Belum ada laporan yang Anda buat. Buka kanal Pengaduan untuk menyampaikan laporan.</p>
                  ) : (
                    <ul className="pf-aktivitas">
                      {profil.laporanUser.map((l) => (
                        <li key={l.id}>
                          <span className="pf-aktivitas__dot" aria-hidden="true" />
                          <div>
                            <p className="pf-aktivitas__teks">{l.judul}</p>
                            <p className="pf-aktivitas__waktu">{formatTanggalWaktu(l.waktuLapor)} · {l.status}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <ul className="pf-info">
                    <li>
                      <strong>Anonimitas laporan terjaga.</strong> Untuk laporan anonim, nama, kontak, dan hubungan tidak disimpan di sistem.
                    </li>
                    <li>
                      <strong>Sesi berakhir otomatis.</strong> Anda keluar otomatis saat menutup peramban karena sesi disimpan sementara.
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
