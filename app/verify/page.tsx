'use client';

import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            Verifica tu correo
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
            Te enviamos un enlace de verificación a tu correo. Debes confirmarlo
            antes de iniciar sesión.
          </p>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-8 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90"
          >
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
