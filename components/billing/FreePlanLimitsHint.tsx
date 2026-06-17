'use client';

import Link from 'next/link';

type FreePlanLimitsHintProps = {
  variant?: 'create' | 'join';
  className?: string;
};

export function FreePlanLimitsHint({
  variant = 'create',
  className = '',
}: FreePlanLimitsHintProps) {
  const intro =
    variant === 'create'
      ? 'Plan Free: Español e Inglés, hasta 2 personas por sala (tú y un invitado).'
      : 'Plan Free: esta sala admite Español e Inglés y hasta 2 participantes.';

  return (
    <div
      className={`rounded-xl border border-[var(--app-primary)]/25 bg-[var(--app-primary)]/5 px-3 py-3 text-sm text-[var(--app-muted)] ${className}`}
    >
      <p>{intro}</p>
      <p className="mt-2">
        <strong className="font-semibold text-[var(--app-text)]">Pro</strong>{' '}
        desbloquea todos los idiomas y hasta{' '}
        <strong className="font-semibold text-[var(--app-text)]">10 invitados</strong>{' '}
        por sala.{' '}
        <Link
          href="/app/billing"
          className="font-medium text-[var(--app-primary)] underline-offset-2 hover:underline"
        >
          Ver planes
        </Link>
      </p>
    </div>
  );
}
