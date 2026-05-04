'use client';

import { useRouter } from 'next/navigation';
import { useVerifyEmailViewModel } from '@/lib/viewmodels/useVerifyEmailViewModel';

export function VerifyEmailView() {
  const router = useRouter();
  const vm = useVerifyEmailViewModel();

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            Verifica tu correo
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
            Verifica tu correo para continuar. Te enviamos un enlace si hace falta
            confirmación.
          </p>

          {vm.error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {vm.error}
            </p>
          )}

          {vm.provisionError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              {vm.provisionError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void vm.onVerifiedClick()}
            disabled={vm.loading}
            className="mt-8 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vm.loading ? 'Comprobando…' : 'Correo verificado'}
          </button>

          {vm.provisionError && (
            <button
              type="button"
              onClick={() => void vm.retryProvisioning()}
              disabled={vm.loading}
              className="mt-3 w-full rounded-xl border border-[#E5E7EB] bg-white py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition hover:bg-[#F4F6F8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reintentar
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-[#6B7280] transition hover:text-[#1F2937]"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
