'use client';

import { useLandingLanguage } from '@/lib/hooks/useLandingLanguage';

const MOCK_MESSAGES = [
  {
    name: 'Alex',
    lang: 'EN',
    flag: '🇺🇸',
    text: 'Hello! Nice to meet you.',
    translated: '¡Hola! Encantado de conocerte.',
    align: 'left' as const,
  },
  {
    name: 'María',
    lang: 'ES',
    flag: '🇲🇽',
    text: '¡Hola! ¿De dónde eres?',
    translated: 'Hi! Where are you from?',
    align: 'right' as const,
  },
  {
    name: 'Alex',
    lang: 'EN',
    flag: '🇺🇸',
    text: "I'm from New York. And you?",
    translated: 'Soy de Nueva York. ¿Y tú?',
    align: 'left' as const,
  },
];

export function HeroChatMockup() {
  const { t } = useLandingLanguage();

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-60 blur-2xl"
        style={{ background: 'var(--app-gradient)' }}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)]/95 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--app-success)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--app-success)]" />
            </span>
            <span className="text-xs font-semibold text-[var(--app-text)]">
              Live · Traducción en tiempo real
            </span>
          </div>
          <span className="rounded-md bg-[var(--app-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--app-primary)]">
            IA
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {MOCK_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.align === 'right' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ background: 'var(--app-gradient)' }}
                aria-hidden
              >
                {msg.flag}
              </div>
              <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.align === 'right'
                    ? 'rounded-tr-sm bg-[var(--app-primary)]/15'
                    : 'rounded-tl-sm bg-[var(--app-bg)] ring-1 ring-[var(--app-border)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{msg.name}</span>
                  <span className="badge-lang rounded px-1 py-0.5 text-[9px] font-bold">
                    {msg.lang}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--app-text)]">
                  {msg.text}
                </p>
                <p className="mt-2 border-l-2 border-[var(--app-primary)]/40 pl-2 text-xs text-[var(--app-muted)]">
                  <span className="font-medium text-[var(--app-primary)]">↳</span>{' '}
                  {msg.translated}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--app-border)] bg-[var(--app-bg)]/80 px-4 py-3 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--app-muted)]">
          {t.chatOriginal} → {t.chatTranslated.split(' ').slice(0, 2).join(' ')}…
        </div>
      </div>
    </div>
  );
}
