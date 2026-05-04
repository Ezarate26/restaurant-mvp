'use client';

import { useRouter } from 'next/navigation';
import { useRegisterRestaurantViewModel } from '@/lib/viewmodels/useRegisterRestaurantViewModel';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Address } from './Step2Address';
import { Step3BusinessMode } from './Step3BusinessMode';

const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Datos',
  2: 'Dirección',
  3: 'Operación',
};

export function RegisterRestaurantWizard() {
  const router = useRouter();
  const vm = useRegisterRestaurantViewModel();

  const isSubmitStep = vm.step === 3;
  const canContinue =
    (vm.step === 1 && vm.canAdvanceFromStep1) ||
    (vm.step === 2 && vm.canAdvanceFromStep2);

  const handleSubmitRegistration = async () => {
    const out = await vm.submitRegistration();
    if (!out.ok) return;
    if (out.skipVerify) {
      router.push('/owner');
    } else {
      router.push('/verify-email');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-4 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
        >
          ← Volver
        </button>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-10">
          <ProgressBar current={vm.step} />

          <div className="mt-6">
            {vm.step === 1 && (
              <Step1BasicInfo
                value={vm.basics}
                onChange={vm.setBasics}
                password={vm.ownerPassword}
                confirmPassword={vm.ownerConfirmPassword}
                showPassword={vm.showOwnerPassword}
                showConfirmPassword={vm.showOwnerConfirmPassword}
                onPasswordChange={vm.setOwnerPassword}
                onConfirmPasswordChange={vm.setOwnerConfirmPassword}
                onToggleShowPassword={() =>
                  vm.setShowOwnerPassword((v) => !v)
                }
                onToggleShowConfirmPassword={() =>
                  vm.setShowOwnerConfirmPassword((v) => !v)
                }
                passwordMismatch={vm.passwordMismatch}
              />
            )}
            {vm.step === 2 && (
              <Step2Address
                value={vm.address}
                onChange={vm.setAddress}
              />
            )}
            {vm.step === 3 && (
              <Step3BusinessMode
                value={vm.business}
                onChange={vm.setBusiness}
              />
            )}
          </div>

          {vm.ownerError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {vm.ownerError}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={vm.goBack}
              disabled={vm.step === 1 || vm.ownerSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F4F6F8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Atrás
            </button>

            {!isSubmitStep && (
              <button
                type="button"
                onClick={vm.goNext}
                disabled={!canContinue}
                className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
              </button>
            )}

            {isSubmitStep && (
              <button
                type="button"
                onClick={() => void handleSubmitRegistration()}
                disabled={!vm.canSubmitRegistration || vm.ownerSubmitting}
                className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {vm.ownerSubmitting ? 'Registrando…' : 'Registrar restaurante'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current }: { current: 1 | 2 | 3 }) {
  const steps: (1 | 2 | 3)[] = [1, 2, 3];
  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Progreso del wizard">
      {steps.map((n, i) => {
        const active = n === current;
        const done = n < current;
        return (
          <li key={n} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                done
                  ? 'bg-green-500 text-white'
                  : active
                  ? 'bg-[#229ED9] text-white'
                  : 'bg-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span
              className={`hidden min-w-0 truncate text-[10px] font-semibold uppercase tracking-wide sm:inline ${
                active ? 'text-[#229ED9]' : 'text-[#6B7280]'
              }`}
            >
              {STEP_LABELS[n]}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`h-px min-w-[8px] flex-1 transition ${
                  done ? 'bg-green-500' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
