'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import { TapButton } from '@/components/ui/TapButton';
import {
  uiBtnGhost,
  uiBtnPrimary,
  uiCard,
  uiError,
  uiInput,
  uiLabel,
} from '@/components/ui/ui-classes';

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
  formError: string | null;
  registerPasswordMismatch: boolean;
  onSubmit: () => void;
}

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
  formError,
  registerPasswordMismatch,
  onSubmit,
}: LoginViewProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[var(--app-bg)] px-3 py-10 sm:px-4">
      <div className="pointer-events-none absolute right-3 top-3 z-app-header sm:right-4 sm:top-4">
        <div className="pointer-events-auto">
          <ThemeToggle compact />
        </div>
      </div>
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--app-accent)] text-sm font-bold text-white">
          C
        </span>
        <span className="font-bold text-[var(--app-text)]">Conversa</span>
      </Link>

      <div className={`${uiCard} relative z-10 w-full min-w-0 max-w-md`}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--app-text)]">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {isLogin
              ? 'Accede con tu correo y contraseña'
              : 'Regístrate para guardar tu perfil entre conversaciones'}
          </p>
        </div>

        {formError ? <p className={`${uiError} mb-4`}>{formError}</p> : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label className={uiLabel}>Nombre completo</label>
              <input
                className={uiInput}
                placeholder="Opcional"
                value={fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className={uiLabel}>Correo</label>
            <input
              className={uiInput}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className={uiLabel}>Contraseña</label>
              <TapButton
                type="button"
                onTap={onToggleShowPassword}
                className={`${uiBtnGhost} min-h-[44px] w-auto px-2`}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </TapButton>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className={uiInput}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {!isLogin && (
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className={uiLabel}>Confirmar contraseña</label>
                <TapButton
                  type="button"
                  onTap={onToggleShowConfirmPassword}
                  className={`${uiBtnGhost} min-h-[44px] w-auto px-2`}
                >
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </TapButton>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={uiInput}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                autoComplete="new-password"
              />
              {registerPasswordMismatch && (
                <p className="mt-1 text-xs text-[var(--app-danger)]">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>
          )}
        </div>

        <FormSubmitLabel
          id="auth-submit"
          label={isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          className={`${uiBtnPrimary} mt-6`}
        />
        </form>

        <TapButton
          onTap={onToggleMode}
          className={`${uiBtnGhost} mt-4 w-full justify-center`}
        >
          {isLogin ? '¿No tienes cuenta? Crear una' : 'Ya tengo una cuenta'}
        </TapButton>
      </div>
    </div>
  );
}
