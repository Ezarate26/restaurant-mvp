'use client';

import { useEffect, useState } from 'react';

/** Distancia desde el borde inferior del layout hasta el borde inferior del viewport visible (teclado). */
export function useVisualViewportOffset(enabled = true): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOffset(0);
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, Math.round(gap)));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  return offset;
}
