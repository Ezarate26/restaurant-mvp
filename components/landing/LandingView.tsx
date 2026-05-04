'use client';

import { useRouter } from 'next/navigation';
import { ParallaxCarousel, type ParallaxSlide } from './ParallaxCarousel';

const SLIDES: ParallaxSlide[] = [
  {
    id: 'hero-1',
    hue: '#229ED9',
    title: 'Lorem ipsum dolor sit amet',
    subtitle:
      'Consectetur adipiscing elit. Donec euismod, nisi vel consectetur interdum, nisl nunc egestas nunc, vitae tincidunt nisl nunc euismod nunc.',
  },
  {
    id: 'hero-2',
    hue: '#7C3AED',
    title: 'Suspendisse potenti, integer eget',
    subtitle:
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; nam non posuere arcu.',
  },
  {
    id: 'hero-3',
    hue: '#059669',
    title: 'Curabitur convallis nisl ac purus',
    subtitle:
      'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Praesent at risus arcu.',
  },
];

const FEATURE_CARDS: { title: string; body: string }[] = [
  {
    title: 'Lorem ipsum dolor',
    body: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
  },
  {
    title: 'Consectetur adipiscing',
    body: 'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute.',
  },
  {
    title: 'Tempor incididunt',
    body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
  },
];

export function LandingView() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#229ED9] text-base font-bold">
            R
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">Restaurant MVP</p>
            <p className="text-[11px] uppercase tracking-widest text-white/60">
              Lorem ipsum
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
        >
          Iniciar sesión
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-24 pt-2 sm:pt-6">
        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#229ED9]">
              Lorem ipsum dolor sit
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Sed do eiusmod tempor incididunt ut labore.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/75">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/register-restaurant')}
                className="rounded-xl bg-[#229ED9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#229ED9]/25 transition hover:brightness-110 active:brightness-95"
              >
                Registrar restaurante
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Soy empleado
              </button>
            </div>
          </div>

          <ParallaxCarousel slides={SLIDES} />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:bg-white/[0.07]"
            >
              <h3 className="text-base font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#229ED9]/15 via-transparent to-[#7C3AED]/15 p-8 sm:p-12">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Lorem ipsum dolor sit amet consectetur
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/75">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa
                qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/register-restaurant')}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0B1220] shadow-lg transition hover:bg-white/90 active:brightness-95"
            >
              Registrar restaurante
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0A111E]">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-white/50">
          © {new Date().getFullYear()} Restaurant MVP — Lorem ipsum dolor sit
          amet.
        </div>
      </footer>
    </div>
  );
}
