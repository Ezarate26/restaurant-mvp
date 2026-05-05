'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CustomerLoginModal } from '@/components/customer/CustomerLoginModal';

const chipBase =
  'rounded-xl border px-4 py-3 text-left text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[#229ED9]/40';

export interface CustomerPreorderViewProps {
  placeName: string;
  selectedLanguage: string | null;
  onSelectLanguage: (code: string) => void;
  onOrderNow: () => void;
  isConfirming: boolean;
  languageControlsDisabled?: boolean;
  createAccountHref: string;
  onSubmitLogin: (email: string, password: string) => Promise<void>;
  loginSubmitBusy?: boolean;
  autoOpenLogin?: boolean;
  loginInitialEmail?: string | null;
  loginIntroMessage?: string | null;
}

const LANGUAGES: { code: string; label: string; hint: string }[] = [
  { code: 'es', label: 'Español', hint: 'Mensajes y menú en español' },
  { code: 'en', label: 'English', hint: 'Messages and menu in English' },
  { code: 'pt', label: 'Português', hint: 'Mensagens em português' },
];

export function CustomerPreorderView({
  placeName,
  selectedLanguage,
  onSelectLanguage,
  onOrderNow,
  isConfirming,
  languageControlsDisabled,
  createAccountHref,
  onSubmitLogin,
  loginSubmitBusy = false,
  autoOpenLogin = false,
  loginInitialEmail = null,
  loginIntroMessage = null,
}: CustomerPreorderViewProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  const canSubmit = Boolean(selectedLanguage) && !languageControlsDisabled;

  useEffect(() => {
    if (autoOpenLogin) setLoginOpen(true);
  }, [autoOpenLogin]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ED9]/12 text-2xl"
              aria-hidden
            >
              🍽️
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
              {placeName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Regístrate para una experiencia mas personalizada.
            </p>
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Idioma
          </p>
          <div className="grid gap-2" role="radiogroup" aria-label="Idioma">
            {LANGUAGES.map((lang) => {
              const selected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={languageControlsDisabled}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`${chipBase} ${
                    selected
                      ? 'border-[#229ED9] bg-[#E3F2FD] text-[#0D47A1]'
                      : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:border-[#CBD5E1]'
                  } ${languageControlsDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span className="block">{lang.label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-[#6B7280]">
                    {lang.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={!canSubmit || isConfirming}
              onClick={onOrderNow}
              className="w-full rounded-xl bg-[#229ED9] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConfirming ? 'Abriendo chat…' : 'Ordenar ahora'}
            </button>
            <button
              type="button"
              disabled={languageControlsDisabled}
              onClick={() => setLoginOpen(true)}
              className="w-full rounded-xl border border-[#229ED9]/40 bg-[#E3F2FD]/60 py-3.5 text-sm font-semibold text-[#0D47A1] shadow-sm transition hover:bg-[#E3F2FD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Iniciar sesión
            </button>
            <Link
              href={createAccountHref}
              className="text-center text-xs font-medium text-[#229ED9] underline-offset-2 transition hover:underline"
            >
              Crea cuenta
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            Tu mesa o punto ya está asignado por el código QR.
          </p>
        </div>
      </div>

      <CustomerLoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        introMessage={loginIntroMessage}
        initialEmail={loginInitialEmail}
        busy={loginSubmitBusy}
        onSubmit={onSubmitLogin}
      />
    </div>
  );
}
