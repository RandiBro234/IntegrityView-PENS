import { useCountUp, useReveal } from '../../lib/motion';

/* Angka yang berhitung naik saat elemen terlihat. Format Indonesia
   (koma desimal, titik ribuan). Nilai akhir selalu benar bila animasi
   dilewati (reduced motion atau tanpa requestAnimationFrame). */
export default function CountUp({
  value,
  desimal = 0,
  suffix = '',
  prefix = '',
  langsung = false,
  className = ''
}) {
  const { ref, terlihat } = useReveal({ threshold: 0.2 });
  const nilai = useCountUp(value, { desimal, aktif: langsung || terlihat });
  const teks = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal
  }).format(nilai);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${teks}${suffix}`}>
      {prefix}{teks}{suffix}
    </span>
  );
}
