'use client';

import { useRouter } from 'next/navigation';
import { useRegisterRestaurantViewModel } from '@/lib/viewmodels/useRegisterRestaurantViewModel';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Address } from './Step2Address';
import { Step3BusinessMode } from './Step3BusinessMode';
import { Step4OwnerAccount } from './Step4OwnerAccount';

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Datos',
  2: 'Dirección',
  3: 'Operación',
  4: 'Cuenta',
};

export function RegisterRestaurantWizard() {
  const router = useRouter();
  const vm = useRegisterRestaurantViewModel();

  const isOwnerStep = vm.step === 4;
  const canNext =
    (vm.step === 1 && vm.canAdvanceFromStep1) ||
    (vm.step === 2 && vm.canAdvanceFromStep2);
  const isLastConfig = vm.step === 3;

  const handleOwnerSubmit = async () => {
    const out = await vm.submitOwnerAccount();
    if (out.ok) {
      router.push('/owner');
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
            {vm.step === 4 && vm.result && (
              <Step4OwnerAccount
                email={vm.basics.email.trim()}
                result={vm.result}
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
              />
            )}
          </div>

          {vm.error && !isOwnerStep && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {vm.error}
            </p>
          )}

          {isOwnerStep && vm.ownerError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {vm.ownerError}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={vm.goBack}
              disabled={
                vm.step === 1 ||
                vm.step === 4 ||
                vm.submitting ||
                vm.ownerSubmitting
              }
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F4F6F8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Atrás
            </button>

            {!isOwnerStep && !isLastConfig && (
              <button
                type="button"
                onClick={vm.goNext}
                disabled={!canNext || vm.submitting}
                className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
              </button>
            )}

            {!isOwnerStep && isLastConfig && (
              <button
                type="button"
                onClick={vm.submit}
                disabled={!vm.canSubmit || vm.submitting}
                className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {vm.submitting ? 'Creando…' : 'Crear restaurante'}
              </button>
            )}

            {isOwnerStep && (
              <button
                type="button"
                onClick={handleOwnerSubmit}
                disabled={!vm.canSubmitOwnerAccount || vm.ownerSubmitting}
                className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {vm.ownerSubmitting ? 'Entrando…' : 'Crear cuenta e ingresar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
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
