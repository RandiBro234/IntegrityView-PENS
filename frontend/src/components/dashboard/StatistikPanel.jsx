import { useLayoutEffect, useRef, useState } from 'react';
import './StatistikPanel.css';
import RecommendationList from '../instrumen/RecommendationList';
import RecommendationPanel from '../instrumen/RecommendationPanel';
import Delta from './Delta';
import { formatAngka } from '../../data/mock';

export default function StatistikPanel({ selectedKey, laporan, onOpenDetail }) {
  if (!selectedKey) {
    return <p className="spanel spanel--empty">Belum ada data untuk kombinasi filter ini.</p>;
  }

  const hasil = laporan?.instrumen.find((s) => s.info.key === selectedKey);
  const st = hasil?.aktif;

  if (!st) {
    return <p className="spanel spanel--empty">Belum ada data untuk kombinasi filter ini (n kurang dari 5).</p>;
  }

  const sebelumnya = hasil.pembanding;

  return (
    <div className="spanel">
      <div className="spanel__head">
        <div className="spanel__head-main">
          <p className="spanel__eyebrow">Analisis</p>
          <h3 className="spanel__title">Ringkasan Statistik &amp; Rekomendasi {hasil.info.nama}</h3>
        </div>
        <div className="spanel__head-right">
          <button type="button" className="spanel__full-link" onClick={() => onOpenDetail && onOpenDetail(selectedKey)}>
            Lihat Dashboard Lengkap
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </button>
        </div>
      </div>

      <div className="spanel__grid">
        <Stat
          label="Responden (n)"
          value={st.jumlahResponden.toLocaleString('id-ID')}
          delta={sebelumnya ? st.jumlahResponden - sebelumnya.jumlahResponden : null}
          unit="responden"
        />
        <Stat label="Rata-rata skor" value={`${formatAngka(st.skor)}%`} delta={hasil.delta} />
        <Stat
          label="Setuju + Sangat Setuju"
          value={`${formatAngka(st.persenSetuju)}%`}
          delta={sebelumnya ? st.persenSetuju - sebelumnya.persenSetuju : null}
        />
        <Stat
          label="Median skor"
          value={`${formatAngka(st.median)}%`}
          delta={sebelumnya ? st.median - sebelumnya.median : null}
        />
        <Stat label="Simpangan baku" value={formatAngka(st.simpanganBaku, 2)} />
        <Stat
          label="Cronbach's alpha"
          value={formatAngka(st.alpha, 2)}
          delta={sebelumnya ? st.alpha - sebelumnya.alpha : null}
          unit="nilai"
          desimal={2}
        />
      </div>

      <div className="spanel__divider" />

      <RekomendasiPanel
        items={hasil.rekomendasi}
        onOpenDetail={() => onOpenDetail && onOpenDetail(selectedKey)}
      />
    </div>
  );
}

function Stat({ label, value, delta, unit, desimal }) {
  return (
    <div className="spanel__stat">
      <span className="spanel__stat-value">{value}</span>
      <span className="spanel__stat-label">{label}</span>
      {delta != null && <Delta value={delta} unit={unit} desimal={desimal} compact />}
    </div>
  );
}

function RekomendasiPanel({ items, onOpenDetail }) {
  const areaRef = useRef(null);
  const [muat, setMuat] = useState(3);

  /* Sembunyikan item yang tidak muat utuh: tiap item butuh ±70px
     (judul + dasar data) dan 52px untuk judul section + tautan. */
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const hitung = () => {
      const tersedia = area.clientHeight - 52;
      setMuat(Math.max(1, Math.min(3, Math.floor(tersedia / 70))));
    };
    hitung();
    const ro = new ResizeObserver(hitung);
    ro.observe(area);
    return () => ro.disconnect();
  }, []);

  const jumlah = Math.min(muat, items.length);

  return (
    <div className="spanel__rek" ref={areaRef}>
      <div className="spanel__rek-head">
        <p className="spanel__eyebrow">Rekomendasi Otomatis</p>
        <RecommendationPanel items={items} />
      </div>
      <RecommendationList items={items} max={jumlah} />
      {items.length > jumlah && (
        <button type="button" className="spanel__more" onClick={onOpenDetail}>
          Lihat semua rekomendasi
        </button>
      )}
    </div>
  );
}
