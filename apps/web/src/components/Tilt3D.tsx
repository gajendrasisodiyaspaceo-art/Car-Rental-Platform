import { useRef, useCallback, type ReactNode, type CSSProperties } from 'react';

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Tilt3D({ children, className, style }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const rotateY = Math.max(-8, Math.min(8, (dx / (rect.width / 2)) * 8));
      const rotateX = Math.max(-8, Math.min(8, -(dy / (rect.height / 2)) * 8));
      ref.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    },
    [reduced],
  );

  const handleMouseLeave = useCallback(() => {
    if (reduced || !ref.current) return;
    ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onMouseMove={reduced ? undefined : handleMouseMove}
      onMouseLeave={reduced ? undefined : handleMouseLeave}
    >
      {children}
    </div>
  );
}
