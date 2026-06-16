'use client';

import Link from 'next/link';
import { uiBtnPrimary } from '@/components/ui/ui-classes';

export interface CompleteProfileFormProps {
  initialEmail?: string;
  resumeConversationId?: string | null;
}

/** Redirige al flujo de registro estándar de Conversa. */
export function CompleteProfileForm({
  initialEmail = '',
  resumeConversationId = null,
}: CompleteProfileFormProps) {
  const params = new URLSearchParams();
  if (initialEmail.trim()) params.set('email', initialEmail.trim());
  if (resumeConversationId?.trim()) {
    params.set('return', resumeConversationId.trim());
  }
  const href = params.toString() ? `/register?${params}` : '/register';

  return (
    <div className="grid gap-4 text-sm text-[var(--app-muted)]">
      <p>
        Completa tu registro en la pantalla de crear cuenta. Podrás volver al chat
        después de verificar tu correo.
      </p>
      <Link href={href} className={uiBtnPrimary}>
        Ir a crear cuenta
      </Link>
    </div>
  );
}
