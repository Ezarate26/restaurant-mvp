'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { GuestLoginModal } from '@/components/conversation/GuestLoginModal';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import { TapButton } from '@/components/ui/TapButton';
import {
  uiBtnGhost,
  uiBtnPrimary,
  uiCard,
  uiInput,
  uiLabel,
  uiSelect,
} from '@/components/ui/ui-classes';
import { LANGUAGES } from '@/constants/languages';

export interface JoinConversationViewProps {
  placeName: string;
  selectedLanguage: string | null;
  onSelectLanguage: (code: string) => void;
  onJoin: () => void;
  isConfirming: boolean;
  languageControlsDisabled?: boolean;
  createAccountHref: string;
  onSubmitLogin: (email: string, password: string) => Promise<void>;
  loginSubmitBusy?: boolean;
  autoOpenLogin?: boolean;
  loginInitialEmail?: string | null;
  loginIntroMessage?: string | null;
  displayName?: string;
  onDisplayNameChange?: (name: string) => void;
}

export function JoinConversationView({
  placeName,
  selectedLanguage,
  onSelectLanguage,
  onJoin,
  isConfirming,
  languageControlsDisabled,
  createAccountHref,
  onSubmitLogin,
  loginSubmitBusy = false,
  autoOpenLogin = false,
  loginInitialEmail = null,
  loginIntroMessage = null,
  displayName = '',
  onDisplayNameChange,
}: JoinConversationViewProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const canSubmit = Boolean(selectedLanguage) && !languageControlsDisabled;

  useEffect(() => {
    if (autoOpenLogin) setLoginOpen(true);
  }, [autoOpenLogin]);

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isConfirming) return;
    onJoin();
  };

  return (
    <AppShell>
      <form className={`${uiCard} min-w-0`} onSubmit={handleJoin}>
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-accent)]/20 text-2xl"
            aria-hidden
          >
            💬
          </div>
          <h1 className="text-xl font-bold sm:text-2xl">{placeName}</h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Selecciona tu idioma y únete a la conversación.
          </p>
        </div>

        {onDisplayNameChange && (
          <>
            <label className={uiLabel} htmlFor="join-display-name">
              Tu nombre (opcional)
            </label>
            <input
              id="join-display-name"
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Cómo te verán los demás"
              className={`${uiInput} mb-4`}
            />
          </>
        )}

        <label className={uiLabel} htmlFor="join-language">
          Idioma
        </label>
        <select
          id="join-language"
          disabled={languageControlsDisabled}
          value={selectedLanguage ?? ''}
          onChange={(e) => onSelectLanguage(e.target.value)}
          className={uiSelect}
        >
          <option value="" disabled>
            Elige un idioma
          </option>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        <FormSubmitLabel
          id="join-view-submit"
          label="Unirse a la conversación"
          busyLabel="Entrando…"
          busy={isConfirming}
          disabled={!canSubmit}
          className={`${uiBtnPrimary} mt-6`}
        />

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <TapButton
            onTap={() => setLoginOpen(true)}
            className={`${uiBtnGhost} w-full justify-center`}
          >
            Ya tengo cuenta
          </TapButton>
          <Link
            href={createAccountHref}
            className={`${uiBtnGhost} touch-target block min-h-[44px] w-full leading-[44px]`}
          >
            Crear cuenta gratuita
          </Link>
        </div>
      </form>

      <GuestLoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        introMessage={loginIntroMessage}
        busy={loginSubmitBusy}
        onSubmit={onSubmitLogin}
        initialEmail={loginInitialEmail}
      />
    </AppShell>
  );
}
