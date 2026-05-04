'use client';

import type { WizardResult } from '@/lib/viewmodels/useRegisterRestaurantViewModel';

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

const readOnlyClass =
  'w-full cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-[#F4F6F8] px-3 py-2.5 text-[15px] text-[#6B7280]';

export interface Step4OwnerAccountProps {
  email: string;
  result: WizardResult;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
}

export function Step4OwnerAccount({
  email,
  result,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
}: Step4OwnerAccountProps) {
  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1F2937]">
          Cuenta del propietario
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Crea tu acceso para administrar el restaurante. Podrás invitar meseros
          con el código <span className="font-mono font-semibold text-[#229ED9]">{result.inviteCode}</span>.
        </p>
      </header>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Correo
        </label>
        <input
          type="email"
          className={readOnlyClass}
          value={email}
          readOnly
          autoComplete="email"
          aria-readonly="true"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Contraseña
          </label>
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="text-[11px] font-semibold text-[#229ED9] hover:underline"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <input
          className={inputClass}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Confirmar contraseña
          </label>
          <button
            type="button"
            onClick={onToggleShowConfirmPassword}
            className="text-[11px] font-semibold text-[#229ED9] hover:underline"
          >
            {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <input
          className={inputClass}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          autoComplete="new-password"
          placeholder="Repite la contraseña"
        />
        {mismatch && (
          <p className="mt-1 text-xs font-medium text-red-600">
            Las contraseñas no coinciden.
          </p>
        )}
      </div>

      {result.inviteEmailSent ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          Código enviado a <span className="font-semibold">{result.email}</span>.
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {result.inviteEmailError
            ? `No se pudo enviar el correo (${result.inviteEmailError}). `
            : 'No se pudo enviar el correo. '}
          Guarda el código de invitación arriba.
        </p>
      )}
    </div>
  );
}
