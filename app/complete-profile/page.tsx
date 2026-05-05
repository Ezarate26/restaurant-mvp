'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompleteProfileForm } from '@/components/customer/CompleteProfileForm';

function CompleteProfileInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim() ?? '';
  const returnPoint = searchParams.get('return_point')?.trim() ?? '';
  const returnSession = searchParams.get('return_session')?.trim() ?? '';
  const returnQr = searchParams.get('return_qr')?.trim() ?? '';

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Restaurant OS
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F2937]">
            Completar registro
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Mismo formulario si entras desde el correo o desde el botón del chat.
          </p>

          <div className="mt-8">
            <CompleteProfileForm
              initialEmail={email}
              resumeServicePointId={returnPoint || null}
              resumeSessionId={returnSession || null}
              resumeQrCode={returnQr || null}
            />
          </div>

          <Link
            href="/"
            className="mt-8 inline-block text-sm font-medium text-[#229ED9] hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#F4F6F8] text-sm text-[#6B7280]">
          Cargando…
        </div>
      }
    >
      <CompleteProfileInner />
    </Suspense>
  );
}
