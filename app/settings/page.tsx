'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiCard,
  uiLabel,
  uiSelectGlass,
  uiSuccess,
} from '@/components/ui/ui-classes';
import { LANGUAGES } from '@/constants/languages';

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('es');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('conversationPlatform.settings');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        defaultLanguage?: string;
        notifications?: boolean;
      };
      if (data.defaultLanguage) setDefaultLanguage(data.defaultLanguage);
      if (typeof data.notifications === 'boolean') {
        setNotifications(data.notifications);
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'conversationPlatform.settings',
      JSON.stringify({ defaultLanguage, notifications })
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <form className={uiCard} onSubmit={handleSave}>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-[var(--form-text)] sm:text-2xl">
              Ajustes
            </h1>
            <ThemeToggle compact />
          </div>

          <div className="mt-6">
            <ThemeSelector />
          </div>

          <label className={`${uiLabel} mt-6`} htmlFor="settings-language">
            Idioma por defecto
          </label>
          <select
            id="settings-language"
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className={uiSelectGlass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>

          <label className="mt-4 flex min-h-[44px] items-center gap-3 text-sm text-[var(--form-text)]">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--form-border)] accent-[var(--app-primary)]"
            />
            Notificaciones (próximamente)
          </label>

          {saved ? (
            <p className={`${uiSuccess} mt-4`}>Ajustes guardados</p>
          ) : null}

          <FormSubmitLabel
            id="settings-save"
            label="Guardar ajustes"
            className={`${uiBtnPrimary} mt-6`}
          />
        </form>

        <div className={uiCard}>
          <h2 className="text-sm font-bold text-[var(--form-text)]">Cuenta</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link
              href="/login"
              className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-primary)] hover:text-[var(--app-accent)]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-primary)] hover:text-[var(--app-accent)]"
            >
              Crear cuenta
            </Link>
            <Link
              href="/profile"
              className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              Mi perfil
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
