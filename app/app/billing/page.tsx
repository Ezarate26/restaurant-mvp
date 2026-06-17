import { Suspense } from 'react';
import { BillingPageClient } from '@/app/app/billing/BillingPageClient';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Cargando planes…
        </div>
      }
    >
      <BillingPageClient />
    </Suspense>
  );
}
