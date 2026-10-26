import { useReveal } from '../../lib/motion';

/* Pembungkus reveal berbasis IntersectionObserver.

   - `variant`: fade-up (default), fade-left, fade-right, scale-in
   - `delay`: tambahan jeda dalam ms (dipakai untuk stagger)
   - `as`: tag pembungkus, mis. 'section' atau 'li'

   State awal tersembunyi hanya berlaku saat <html> punya class "js",
   jadi konten tetap terlihat bila JavaScript gagal. */
export default function Reveal({
  as: Tag = 'div',
  variant = 'fade-up',
  delay = 0,
  className = '',
  style,
  children,
  ...rest
}) {
  const { ref, terlihat } = useReveal();

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={`reveal ${terlihat ? 'is-visible' : ''} ${className}`.trim()}
      style={{ ...style, ...(delay ? { '--reveal-delay': `${delay}ms` } : null) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
