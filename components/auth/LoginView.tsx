'use client';

import { APP_LANGUAGE_OPTIONS } from '@/lib/model/language-options';

const selectClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export interface LoginViewProps {
  isLogin: boolean;
  onToggleMode: () => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  showConfirmPassword: boolean;
  onToggleShowConfirmPassword: () => void;
  fullName: string;
  onFullNameChange: (value: string) => void;
  employeeNumber: string;
  onEmployeeNumberChange: (value: string) => void;
  waiterPhone: string;
  onWaiterPhoneChange: (value: string) => void;
  restaurantCode: string;
  onRestaurantCodeChange: (value: string) => void;
  waiterLanguage: string;
  onWaiterLanguageChange: (value: string) => void;
  formError: string | null;
  registerPasswordMismatch: boolean;
  onSubmit: () => void;
}

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export function LoginView({
  isLogin,
  onToggleMode,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showPassword,
  onToggleShowPassword,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  fullName,
  onFullNameChange,
  employeeNumber,
  onEmployeeNumberChange,
  waiterPhone,
  onWaiterPhoneChange,
  restaurantCode,
  onRestaurantCodeChange,
  waiterLanguage,
  onWaiterLanguageChange,
  formError,
  registerPasswordMismatch,
  onSubmit,
}: LoginViewProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              {isLogin
                ? 'Accede con tu correo de mesero'
                : 'Regístrate con el código de tu restaurante'}
            </p>
          </div>

          {formError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </p>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <>
                <input
                  className={inputClass}
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => onFullNameChange(e.target.value)}
                />

                <input
                  className={inputClass}
                  placeholder="Número de empleado (opcional)"
                  value={employeeNumber}
                  onChange={(e) => onEmployeeNumberChange(e.target.value)}
                />
              </>
            )}

            <input
              className={inputClass}
              placeholder="Correo"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
            />

            {!isLogin && (
              <input
                className={inputClass}
                placeholder="Teléfono"
                value={waiterPhone}
                onChange={(e) => onWaiterPhoneChange(e.target.value)}
                autoComplete="tel"
              />
            )}

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                  Contraseña
                </span>
                <button
                  type="button"
                  onClick={onToggleShowPassword}
                  className="text-[11px] font-semibold text-[#229ED9] hover:underline"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className={inputClass}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                    Confirmar contraseña
                  </span>
                  <button
                    type="button"
                    onClick={onToggleShowConfirmPassword}
                    className="text-[11px] font-semibold text-[#229ED9] hover:underline"
                  >
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={inputClass}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  autoComplete="new-password"
                />
                {registerPasswordMismatch && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                    Tu idioma
                  </label>
                  <select
                    className={selectClass}
                    value={waiterLanguage}
                    onChange={(e) => onWaiterLanguageChange(e.target.value)}
                    aria-label="Idioma del mesero"
                  >
                    {APP_LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className={inputClass}
                  placeholder="Código del restaurante"
                  value={restaurantCode}
                  onChange={(e) => onRestaurantCodeChange(e.target.value)}
                />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            className="mt-6 w-full rounded-xl bg-[#229ED9] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90"
          >
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={onToggleMode}
            className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-[#229ED9] transition hover:bg-[#E3F2FD]"
          >
            {isLogin ? '¿No tienes cuenta? Crear una' : 'Ya tengo una cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
