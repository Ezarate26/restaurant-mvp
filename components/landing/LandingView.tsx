'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { JoinByCodeModal } from '@/components/conversation/JoinByCodeModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import { uiBtnPrimary, uiInput } from '@/components/ui/ui-classes';

const DEMO_STEPS = [
  {
    flag: '🇺🇸',
    name: 'Usuario 1',
    lang: 'EN',
    text: 'Hello, how are you?',
  },
  {
    flag: '🇲🇽',
    name: 'Usuario 2',
    lang: 'ES',
    text: 'Hola, ¿cómo estás?',
  },
  {
    flag: '🇫🇷',
    name: 'Usuario 3',
    lang: 'FR',
    text: 'Bonjour, comment ça va ?',
  },
] as const;

export function LandingView() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  const handleJoin = () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinOpen(true);
      return;
    }
    router.push(`/join/${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      <section className="landing-nebula-bg relative min-h-[92vh] overflow-hidden">
        <div className="touch-decorative absolute inset-0 overflow-hidden">
          <div className="landing-nebula-blob landing-nebula-blob-1" />
          <div className="landing-nebula-blob landing-nebula-blob-2" />
          <div className="landing-nebula-blob landing-nebula-blob-3" />
          <video
            className="pointer-events-none h-full w-full object-cover opacity-25"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          >
            <source src="/hero.mp4" type="video/mp4" />
            <source src="/hero.webm" type="video/webm" />
          </video>
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-[2px]"
            style={{ background: 'var(--landing-overlay)' }}
          />
          <div
            className="hero-gradient-animate pointer-events-none absolute inset-0 opacity-50"
            style={{ background: 'var(--app-gradient)' }}
          />
        </div>

        <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="btn-gradient glow-purple grid h-11 w-11 place-items-center rounded-2xl text-lg font-bold">
              C
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight">Conversa</p>
              <p className="text-[11px] text-[var(--app-muted)]">
                IA · Traducción en tiempo real
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            <ThemeToggle compact />
            <Link
              href="/login"
              className="app-hover touch-target inline-flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:px-4"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="app-hover touch-target inline-flex min-h-[44px] items-center rounded-xl bg-[var(--app-card)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:px-4"
            >
              Registrarse
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:pt-20">
          <p
            className="animate-fade-in-up rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]/30"
            style={{ background: 'var(--app-hover-bg)' }}
          >
            Comunicación global con IA
          </p>
          <h1 className="animate-fade-in-up mt-6 max-w-4xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Habla con cualquier persona en cualquier idioma.
          </h1>
          <p className="animate-fade-in-up mt-5 max-w-xl text-base leading-relaxed text-[var(--app-muted)] sm:text-lg">
            Mensajes y voz traducidos por IA en tiempo real.
          </p>
          <div className="animate-fade-in-up mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Link
              href="/create"
              className="app-hover touch-target btn-gradient inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-semibold glow-purple sm:px-8"
            >
              Crear conversación
            </Link>
            <Link
              href="#join-panel"
              className="app-hover touch-target inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--app-card)] px-6 py-3.5 text-sm font-semibold ring-1 ring-[var(--app-border)] hover:bg-[var(--app-hover-bg)] sm:px-8"
            >
              Unirse a conversación
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
            Traducción instantánea, en vivo
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--app-muted)]">
            Cada participante lee y escucha en su idioma. La IA traduce texto y
            voz al momento.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md space-y-0">
          {DEMO_STEPS.map((step, i) => (
            <div key={step.lang}>
              <div className="app-hover rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 sm:p-5 transition duration-200 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {step.flag}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{step.name}</span>
                      <span className="badge-lang rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                        {step.lang}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--app-text)]">
                      {step.text}
                    </p>
                  </div>
                </div>
              </div>
              {i < DEMO_STEPS.length - 1 ? (
                <div
                  className="flex justify-center py-3 text-[var(--app-primary)]"
                  aria-hidden
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 16l-6-6h12l-6 6z" />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--app-border)] bg-[var(--app-card)] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Diseñado para conversaciones reales
            </h2>
            <p className="mt-3 text-[var(--app-muted)]">
              Voz original y traducida, indicadores de actividad en tiempo real,
              participantes conectados y códigos QR para invitar al instante.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--app-muted)]">
              {[
                'Traducción de texto y audio en tiempo real',
                'Whisper + TTS con caché inteligente',
                'Sin fricción: entra y habla en tu idioma',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--app-gradient)' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4 glow-purple sm:p-6">
            <div className="space-y-5">
              <div className="flex gap-3">
                <div
                  className="h-9 w-9 shrink-0 rounded-full"
                  style={{ background: 'var(--app-gradient)' }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">
                    John <span className="text-[var(--app-muted)]">· 12:35</span>{' '}
                    <span className="badge-lang ml-1 rounded px-1 py-0.5 text-[10px]">
                      EN
                    </span>
                  </p>
                  <p className="mt-1 text-sm">Hola, ¿cómo estás?</p>
                  <p className="mt-2 border-l-2 border-[var(--app-primary)]/40 pl-2 text-xs text-[var(--app-muted)]">
                    <span className="font-semibold text-[var(--app-text)]">
                      Original (EN)
                    </span>
                    <br />
                    Hello, how are you?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="join-panel"
        className="border-t border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-12 sm:px-6 sm:py-14"
      >
        <div className="mx-auto max-w-md min-w-0">
          <h2 className="text-xl font-bold">Unirse con código</h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Pega el código del enlace o escanea el QR compartido.
          </p>
          <form
            className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
          >
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej. ABC12345"
              className={`${uiInput} min-w-0 font-mono uppercase tracking-widest`}
            />
            <FormSubmitLabel
              id="landing-join-submit"
              label="Unirse"
              className={`${uiBtnPrimary} sm:w-auto sm:shrink-0 sm:px-8`}
            />
          </form>
        </div>
      </section>

      <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
