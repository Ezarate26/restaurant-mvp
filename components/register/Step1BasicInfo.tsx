'use client';

import type { BasicInfoState } from '@/lib/viewmodels/useRegisterRestaurantViewModel';
import { APP_LANGUAGE_OPTIONS } from '@/lib/model/language-options';

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

const selectClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export interface Step1BasicInfoProps {
  value: BasicInfoState;
  onChange: (value: BasicInfoState) => void;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  passwordMismatch: boolean;
}

export function Step1BasicInfo({
  value,
  onChange,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  passwordMismatch,
}: Step1BasicInfoProps) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1F2937]">
          Datos del restaurante
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Información básica, cuenta y idioma del local.
        </p>
      </header>

      <input
        className={inputClass}
        placeholder="Nombre del restaurante"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Nombre del propietario"
        value={value.ownerName}
        onChange={(e) => onChange({ ...value, ownerName: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Teléfono"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        autoComplete="tel"
      />
      <input
        className={inputClass}
        type="email"
        placeholder="Correo"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        autoComplete="email"
      />

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
        {passwordMismatch && (
          <p className="mt-1 text-xs font-medium text-red-600">
            Las contraseñas no coinciden.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Idioma preferido del restaurante
        </label>
        <select
          className={selectClass}
          value={value.defaultLanguage}
          onChange={(e) =>
            onChange({ ...value, defaultLanguage: e.target.value })
          }
          aria-label="Idioma del restaurante"
        >
          {APP_LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
