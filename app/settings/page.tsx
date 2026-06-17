'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { AppLanguageToggle } from '@/components/ui/AppLanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiCard,
  uiInput,
  uiLabel,
  uiSelectGlass,
  uiSuccess,
} from '@/components/ui/ui-classes';
import { LANGUAGES } from '@/constants/languages';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { useSettingsViewModel } from '@/lib/viewmodels/useSettingsViewModel';

export default function SettingsPage() {
  const { t } = useAppLanguage();
  const vm = useSettingsViewModel();

  return (
    <AppShell>
      <div className="space-y-4">
        <form className={uiCard} onSubmit={vm.handleSaveSettings}>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-[var(--form-text)] sm:text-2xl">
              {t.settings.title}
            </h1>
            <ThemeToggle compact />
          </div>

          <div className="mt-6">
            <ThemeSelector />
          </div>

          <div className="mt-6">
            <AppLanguageToggle />
          </div>

          <label className={`${uiLabel} mt-6`} htmlFor="settings-language">
            {t.settings.defaultLanguage}
          </label>
          <select
            id="settings-language"
            value={vm.defaultLanguage}
            onChange={(e) => vm.setDefaultLanguage(e.target.value)}
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
              checked={vm.notifications}
              onChange={(e) => vm.setNotifications(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--form-border)] accent-[var(--app-primary)]"
            />
            {t.settings.notificationsSoon}
          </label>

          {vm.settingsSaved ? (
            <p className={`${uiSuccess} mt-4`}>{t.settings.saved}</p>
          ) : null}

          <FormSubmitLabel
            id="settings-save"
            label={t.settings.saveSettings}
            className={`${uiBtnPrimary} mt-6`}
          />
        </form>

        {vm.isAuthenticated ? (
          <div className={uiCard}>
            <h2 className="text-sm font-bold text-[var(--form-text)]">
              {t.settings.bio}
            </h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              {t.settings.bioHint}
            </p>
            <textarea
              id="settings-bio"
              value={vm.bio}
              onChange={(e) => vm.setBio(e.target.value)}
              rows={4}
              className={`${uiInput} mt-3`}
            />
            {vm.bioSaved ? (
              <p className={`${uiSuccess} mt-3`}>{t.settings.bioSaved}</p>
            ) : null}
            <button
              type="button"
              disabled={vm.bioLoading}
              onClick={() => void vm.handleSaveBio()}
              className={`${uiBtnSecondary} mt-4 disabled:opacity-60`}
            >
              {vm.bioLoading ? t.common.loading : t.settings.saveBio}
            </button>
          </div>
        ) : null}

        {vm.isAuthenticated ? (
          <div className={uiCard}>
            <h2 className="text-sm font-bold text-[var(--form-text)]">
              {t.settings.changePassword}
            </h2>
            <label className={`${uiLabel} mt-4`} htmlFor="settings-new-password">
              {t.settings.newPassword}
            </label>
            <input
              id="settings-new-password"
              type="password"
              value={vm.newPassword}
              onChange={(e) => vm.setNewPassword(e.target.value)}
              className={uiInput}
              autoComplete="new-password"
            />
            <label
              className={`${uiLabel} mt-4`}
              htmlFor="settings-confirm-password"
            >
              {t.settings.confirmPassword}
            </label>
            <input
              id="settings-confirm-password"
              type="password"
              value={vm.confirmPassword}
              onChange={(e) => vm.setConfirmPassword(e.target.value)}
              className={uiInput}
              autoComplete="new-password"
            />
            {vm.passwordError ? (
              <p className="mt-3 text-sm text-[var(--app-danger)]">
                {vm.passwordError}
              </p>
            ) : null}
            {vm.passwordSaved ? (
              <p className={`${uiSuccess} mt-3`}>{t.settings.passwordUpdated}</p>
            ) : null}
            <button
              type="button"
              disabled={vm.passwordBusy}
              onClick={() => void vm.handleChangePassword()}
              className={`${uiBtnPrimary} mt-4 disabled:opacity-60`}
            >
              {vm.passwordBusy ? t.common.loading : t.settings.updatePassword}
            </button>
          </div>
        ) : null}

        <div className={uiCard}>
          <h2 className="text-sm font-bold text-[var(--form-text)]">
            {t.settings.account}
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {!vm.authLoading && vm.isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-muted)] hover:text-[var(--app-text)]"
                >
                  {t.settings.myProfile}
                </Link>
                <Link
                  href="/app/billing"
                  className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-primary)] hover:text-[var(--app-accent)]"
                >
                  {t.settings.billing}
                </Link>
                <button
                  type="button"
                  onClick={() => void vm.handleLogout()}
                  className="touch-target inline-flex min-h-[44px] items-center text-left text-[var(--app-danger)] hover:underline"
                >
                  {t.settings.logout}
                </button>
              </>
            ) : !vm.authLoading ? (
              <>
                <Link
                  href="/login"
                  className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-primary)] hover:text-[var(--app-accent)]"
                >
                  {t.settings.login}
                </Link>
                <Link
                  href="/register"
                  className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-primary)] hover:text-[var(--app-accent)]"
                >
                  {t.settings.register}
                </Link>
                <Link
                  href="/profile"
                  className="touch-target inline-flex min-h-[44px] items-center text-[var(--app-muted)] hover:text-[var(--app-text)]"
                >
                  {t.settings.myProfile}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
