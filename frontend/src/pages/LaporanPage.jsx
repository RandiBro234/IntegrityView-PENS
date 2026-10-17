import { useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import {
  getUser, isAdmin, getSemuaSurveiUntukLaporan, getRingkasanPengaduan,
  getPengaduan, formatAngka
} from '../data/mock';
import { useSurveiData } from '../data/api';
import './LaporanPage.css';

export default function LaporanPage({ onNavigate }) {
  const user = getUser();
  const admin = isAdmin();
  const { dataset } = useSurveiData();
  const [periode, setPeriode] = useState('Agu 2026');

  const rekap = useMemo(
    () => (admin && dataset ? getSemuaSurveiUntukLaporan(dataset) : []),
    [admin, dataset]
  );
  const ringkasAduan = useMemo(() => getRingkasanPengaduan(), []);
  const pengaduan = useMemo(() => getPengaduan(), []);

  const rekapKategori = useMemo(() => {
    const peta = {};
    pengaduan.forEach((p) => {
      if (!peta[p.kategori]) peta[p.kategori] = { Baru: 0, Diproses: 0, Selesai: 0 };
      peta[p.kategori][p.status] = (peta[p.kategori][p.status] || 0) + 1;
    });
    return Object.entries(peta)
      .map(([kategori, v]) => ({ kategori, ...v, total: v.Baru + v.Diproses + v.Selesai }))
      .sort((a, b) => b.total - a.total);
  }, [pengaduan]);

  if (!admin) {
    return (
      <div className="app-shell">
        <Sidebar active="laporan" onNavigate={onNavigate} user={user} />
        <div className="app-main">
          <Topbar user={user} notifCount={0} onProfil={() => handleMenu('profil')} />
          <main className="app-content">
            <div className="lpr-guard">
              <h2>Halaman ini untuk admin Zona Integritas</h2>
              <p>Rekap laporan memuat data yang menyangkut integritas dan hanya dapat dibaca setelah login sebagai admin.</p>
              <button type="button" className="btn btn-primary" onClick={() => onNavigate && onNavigate('beranda')}>
                Kembali ke Beranda
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleMenu = (key) => onNavigate && onNavigate(key);

  const rataSkor = rekap.length
    ? rekap.reduce((a, r) => a + r.skor, 0) / rekap.length
    : 0;


  const ekspor = () => {
    const baris = [['Instrumen', 'Nama Lengkap', 'Skor', 'Benchmark', 'Status', 'Responden']];
    rekap.forEach((r) => {
      baris.push([r.nama, r.namaPanjang, r.skor + '%', r.benchmark + '%', r.status, r.responden]);
    });
    const csv = baris.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-zi-${periode.replace(/\s/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <Sidebar active="laporan" onNavigate={handleMenu} user={user} />
      <div className="app-main">
        <Topbar user={user} notifCount={ringkasAduan.Baru} onProfil={() => handleMenu('profil')} />
        <main className="app-content">
          <header className="lpr-head">
            <div>
              <p className="label-eyebrow">Laporan · Admin</p>
              <h1 className="lpr-head__title">Rekap Capaian Zona Integritas</h1>
              <p className="lpr-head__sub">Ringkasan skor seluruh instrumen dan pengaduan untuk periode terpilih.</p>
            </div>
            <div className="lpr-head__actions">
              <select value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Periode laporan">
                <option>Agu 2026</option>
                <option>Jul 2026</option>
                <option>Jun 2026</option>
              </select>
              <button type="button" className="btn btn-primary" onClick={ekspor}>Ekspor CSV</button>
            </div>
          </header>

          <div className="lpr-kpi">
            <Kpi label="Instrumen Terpantau" value={rekap.length} />
            <Kpi label="Rata-rata Skor" value={formatAngka(rataSkor) + '%'} />
            <Kpi label="Total Laporan" value={ringkasAduan.total} />
            <Kpi label="Laporan Baru" value={ringkasAduan.Baru} tone="warn" />
          </div>

          <section className="lpr-block">
            <h2 className="lpr-block__title">Rekap skor per instrumen</h2>
            <div className="lpr-table-wrap">
              <table className="lpr-table">
                <thead>
                  <tr><th>Instrumen</th><th>Nama</th><th>Skor</th><th>Benchmark</th><th>Status</th><th>Responden</th></tr>
                </thead>
                <tbody>
                  {rekap.map((r) => {
                    const diAtas = r.skor >= r.benchmark;
                    return (
                      <tr key={r.key}>
                        <td className="lpr-id">{r.nama}</td>
                        <td>{r.namaPanjang}</td>
                        <td className="lpr-id">{formatAngka(r.skor)}%</td>
                        <td className="lpr-muted">{r.benchmark}%</td>
                        <td>
                          <span className={`badge badge-status ${diAtas ? 'badge-status-selesai' : 'badge-status-diproses'}`}>
                            {diAtas ? 'Di atas target' : 'Di bawah target'}
                          </span>
                        </td>
                        <td className="lpr-muted">{r.responden.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="lpr-block">
            <h2 className="lpr-block__title">Ringkasan pengaduan per kategori</h2>
            <div className="lpr-table-wrap">
              <table className="lpr-table">
                <thead>
                  <tr><th>Kategori</th><th>Baru</th><th>Diproses</th><th>Selesai</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {rekapKategori.map((k) => (
                    <tr key={k.kategori}>
                      <td>{k.kategori}</td>
                      <td>{k.Baru}</td>
                      <td>{k.Diproses}</td>
                      <td>{k.Selesai}</td>
                      <td className="lpr-id">{k.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = '' }) {
  return (
    <div className={`lpr-kpi__card ${tone ? 'lpr-kpi__card--' + tone : ''}`}>
      <span className="lpr-kpi__label">{label}</span>
      <span className="lpr-kpi__value">{value}</span>
    </div>
  );
}
