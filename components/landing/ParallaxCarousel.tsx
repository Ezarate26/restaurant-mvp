'use client';

import { useEffect, useRef, useState } from 'react';

export interface ParallaxSlide {
  id: string;
  title: string;
  subtitle: string;
  /** Color de fondo del slide (placeholder cuando no hay imagen). */
  hue: string;
  /** Opcional: ruta a /public/landing/<file>. Si no, se renderiza sólo el gradiente. */
  imageSrc?: string;
}

export interface ParallaxCarouselProps {
  slides: ParallaxSlide[];
}

/**
 * Carrusel parallax sin libs externas:
 *  - cada slide es full-bleed.
 *  - el track se desplaza suavemente al cambiar slide.
 *  - el contenido (title/subtitle) hace un parallax leve via translateY relativo al scroll del track.
 */
export function ParallaxCarousel({ slides }: ParallaxCarouselProps) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl bg-[#0F172A] shadow-xl"
      style={{ aspectRatio: '16/7' }}
      aria-roledescription="carrusel"
    >
      <div
        ref={trackRef}
        className="absolute inset-0 flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide) => (
          <article
            key={slide.id}
            className="relative h-full w-full shrink-0 overflow-hidden"
            style={{
              background: slide.imageSrc
                ? `linear-gradient(135deg, ${slide.hue}cc, #0F172Acc)`
                : `linear-gradient(135deg, ${slide.hue}, #0F172A)`,
            }}
          >
            {slide.imageSrc && (
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-[1500ms] ease-out"
                style={{
                  backgroundImage: `url(${slide.imageSrc})`,
                  transform: 'scale(1.08)',
                }}
              />
            )}

            <div className="relative z-10 flex h-full flex-col items-start justify-end gap-3 p-8 sm:p-12">
              <h3 className="max-w-2xl text-3xl font-semibold text-white drop-shadow sm:text-4xl">
                {slide.title}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {slide.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
