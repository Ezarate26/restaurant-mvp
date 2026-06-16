'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { CompleteProfileForm } from '@/components/conversation/CompleteProfileForm';
import { uiBtnGhost, uiCard } from '@/components/ui/ui-classes';

function CompleteProfileInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim() ?? '';
  const returnConversation =
    searchParams.get('return_conversation')?.trim() ??
    searchParams.get('return_session')?.trim() ??
    '';

  return (
    <AppShell>
      <div className={uiCard}>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
          Conversa
        </p>
        <h1 className="mt-2 text-2xl font-bold">Completar registro</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Mismo formulario si entras desde el correo o desde el botón del chat.
        </p>

        <div className="mt-8">
          <CompleteProfileForm
            initialEmail={email}
            resumeConversationId={returnConversation || null}
          />
        </div>

        <Link href="/" className={`${uiBtnGhost} mt-8 inline-block`}>
          ← Volver al inicio
        </Link>
      </div>
    </AppShell>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Cargando…
        </div>
      }
    >
      <CompleteProfileInner />
    </Suspense>
  );
}
