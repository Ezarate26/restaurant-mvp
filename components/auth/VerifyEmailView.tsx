'use client';

import Link from 'next/link';
import { useVerifyEmailViewModel } from '@/lib/viewmodels/useVerifyEmailViewModel';
import { TapButton } from '@/components/ui/TapButton';
import {
  uiBtnGhost,
  uiBtnPrimary,
  uiBtnSecondary,
  uiCard,
  uiError,
} from '@/components/ui/ui-classes';

export function VerifyEmailView() {
  const vm = useVerifyEmailViewModel();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[var(--app-bg)] px-3 py-10 sm:px-4">
      <div className={`${uiCard} w-full min-w-0 max-w-md text-center`}>
        <h1 className="text-2xl font-bold text-[var(--app-text)]">
          Verifica tu correo
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)]">
          Verifica tu correo para continuar. Te enviamos un enlace si hace falta
          confirmación.
        </p>

        {vm.error ? <p className={`${uiError} mt-4`}>{vm.error}</p> : null}

        {vm.provisionError ? (
          <p className="mt-4 rounded-md border border-[var(--app-warning)]/40 bg-[var(--app-warning)]/10 px-3 py-2 text-xs text-[var(--app-warning)]">
            {vm.provisionError}
          </p>
        ) : null}

        <TapButton
          onTap={() => void vm.onVerifiedClick()}
          disabled={vm.loading}
          className={`${uiBtnPrimary} mt-8`}
        >
          {vm.loading ? 'Comprobando…' : 'Correo verificado'}
        </TapButton>

        {vm.provisionError ? (
          <TapButton
            onTap={() => void vm.retryProvisioning()}
            disabled={vm.loading}
            className={`${uiBtnSecondary} mt-3`}
          >
            Reintentar
          </TapButton>
        ) : null}

        <Link href="/login" className={`${uiBtnGhost} mt-4 block w-full text-center`}>
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
