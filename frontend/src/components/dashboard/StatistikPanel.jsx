import { useLayoutEffect, useRef, useState } from 'react';
import './StatistikPanel.css';
import RecommendationList from '../instrumen/RecommendationList';
import RecommendationPanel from '../instrumen/RecommendationPanel';
import Delta from './Delta';
import CountUp from '../motion/CountUp';
import { formatAngka } from '../../data/mock';

export default function StatistikPanel({ selectedKey, laporan, onOpenDetail }) {
  if (!selectedKey) {
    return <p className="spanel spanel--empty">Pilih satu instrumen untuk melihat ringkasan statistik dan rekomendasi.</p>;
  }

  const hasil = laporan?.instrumen.find((s) => s.info.key === selectedKey);
  const st = hasil?.aktif;

  if (!st) {
    return <p className="spanel spanel--empty">Belum ada responden untuk instrumen ini pada periode terpilih.</p>;
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
        <Stat label="Responden (n)" angka={st.n} desimal={0} />
        <Stat label="Rata-rata skor" angka={st.indeks} desimal={1} suffix="%" delta={hasil.delta} />
        <Stat label="Median skor" angka={st.median} desimal={1} suffix="%" />
        <Stat label="Simpangan baku" angka={st.sd} desimal={2} />
        <Stat
          label="Setuju + Sangat Setuju"
          angka={st.setuju}
          desimal={1}
          suffix="%"
          delta={sebelumnya ? st.setuju - sebelumnya.setuju : null}
        />
        <Stat
          label="Cronbach's alpha"
          angka={st.alpha}
          desimal={2}
          kosong="—"
          note={st.alphaCatatan}
        />
      </div>

      <div className="spanel__divider" />

      <RekomendasiPanel
        items={hasil.rekomendasi}
        butirTerendah={st.butirTerendah}
        onOpenDetail={() => onOpenDetail && onOpenDetail(selectedKey)}
      />
    </div>
  );
}

function Stat({ label, angka, desimal = 0, suffix = '', kosong = null, delta, note }) {
  const isi = angka == null
    ? (kosong || '—')
    : <CountUp value={angka} desimal={desimal} suffix={suffix} />;

  return (
    <div className="spanel__stat">
      <span className="spanel__stat-value">{isi}</span>
      <span className="spanel__stat-label">{label}</span>
      {delta != null && <Delta value={delta} compact />}
      {note && <span className="spanel__stat-note">{note}</span>}
    </div>
  );
}

function RekomendasiPanel({ items, butirTerendah, onOpenDetail }) {
  const areaRef = useRef(null);
  const [muat, setMuat] = useState(3);

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

  const kosong = !items.length;
  const jumlah = Math.min(muat, items.length);

  return (
    <div className="spanel__rek" ref={areaRef}>
      <div className="spanel__rek-head">
        <p className="spanel__eyebrow">Rekomendasi Otomatis</p>
        {!kosong && <RecommendationPanel items={items} />}
      </div>

      {kosong ? (
        <div className="spanel__rek-netral">
          <p>Butir dengan skor terendah: {butirTerendah.label} (rata-rata {formatAngka(butirTerendah.rata, 2)})</p>
          <p className="spanel__rek-netral-note">Tidak ada butir yang perlu perhatian khusus pada periode ini.</p>
        </div>
      ) : (
        <>
          <RecommendationList items={items} max={jumlah} />
          {items.length > jumlah && (
            <button type="button" className="spanel__more" onClick={onOpenDetail}>
              Lihat semua rekomendasi
            </button>
          )}
        </>
      )}
    </div>
  );
}
