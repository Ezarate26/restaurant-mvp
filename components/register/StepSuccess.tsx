'use client';

import { useRouter } from 'next/navigation';
import type { WizardResult } from '@/lib/viewmodels/useRegisterRestaurantViewModel';

export interface StepSuccessProps {
  result: WizardResult;
}

export function StepSuccess({ result }: StepSuccessProps) {
  const router = useRouter();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.inviteCode);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <header>
        <h2 className="text-xl font-semibold text-[#1F2937]">
          Restaurante creado
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
          Guarda el código de invitación. Lo necesitarás para registrar la
          cuenta del propietario y de los meseros.
        </p>
      </header>

      <div className="mx-auto w-full max-w-sm rounded-xl border border-[#E5E7EB] bg-[#F4F6F8] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Código de invitación
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-mono text-xl font-bold tracking-widest text-[#229ED9]">
            {result.inviteCode}
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] transition hover:bg-[#F4F6F8]"
          >
            Copiar
          </button>
        </div>
      </div>

      {result.inviteEmailSent ? (
        <p className="mx-auto max-w-sm rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          Te enviamos el código a <span className="font-semibold">{result.email}</span>.
        </p>
      ) : (
        <p className="mx-auto max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          No pudimos enviar el correo a {result.email}. Copia el código manualmente y
          guárdalo: lo necesitarás para registrar al propietario.
        </p>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="w-full max-w-sm rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90"
        >
          Ir a registrar al propietario
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-xs font-medium text-[#6B7280] hover:text-[#1F2937]"
        >
          Volver a la landing
        </button>
      </div>
    </div>
  );
}
