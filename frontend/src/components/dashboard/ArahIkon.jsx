/* Ikon arah perubahan. Bentuk garis tegas tanpa smoothing, mengikuti gaya
   ikon lain di aplikasi. Dipakai bersama oleh Delta dan heatmap. */

export function IkonNaik({ size = 12 }) {
  return (
    <svg
      className="arah-ikon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

export function IkonTurun({ size = 12 }) {
  return (
    <svg
      className="arah-ikon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

export function IkonStabil({ size = 12 }) {
  return (
    <svg
      className="arah-ikon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
