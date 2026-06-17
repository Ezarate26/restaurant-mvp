'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiCard,
  uiInput,
  uiLabel,
  uiSelect,
  uiSuccess,
} from '@/components/ui/ui-classes';
import { LANGUAGES } from '@/constants/languages';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { useProfileViewModel } from '@/lib/viewmodels/useProfileViewModel';

export default function ProfilePage() {
  const { t } = useAppLanguage();
  const vm = useProfileViewModel();

  if (vm.authLoading || vm.loading) {
    return (
      <AppShell>
        <div className={`${uiCard} text-sm text-[var(--app-muted)]`}>
          {t.common.loading}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <form
        className={`${uiCard} min-w-0`}
        onSubmit={(e) => {
          e.preventDefault();
          if (vm.isAuthenticated) void vm.handleSave();
        }}
      >
        <h1 className="text-xl font-bold sm:text-2xl">{t.profile.title}</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {vm.isAuthenticated
            ? t.profile.subtitleLoggedIn
            : t.profile.subtitleGuest}
        </p>

        {!vm.isAuthenticated ? (
          <p className="mt-4 rounded-lg bg-[var(--app-bg)] px-3 py-2 text-sm text-[var(--app-muted)] ring-1 ring-[var(--app-border)]">
            {t.profile.loginPrompt}{' '}
            <Link href="/login" className="font-semibold text-[var(--app-primary)]">
              {t.sidebar.login}
            </Link>{' '}
            ·{' '}
            <Link href="/register" className="font-semibold text-[var(--app-primary)]">
              {t.sidebar.register}
            </Link>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--app-hover-bg)] text-2xl font-bold text-[var(--app-muted)] ring-2 ring-[var(--app-border)]"
            aria-hidden={!vm.avatarUrl}
          >
            {vm.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vm.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              (vm.displayName.trim()[0] ?? '?').toUpperCase()
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!vm.isAuthenticated || vm.uploadingAvatar}
              onClick={vm.handleAvatarPick}
              className={`${uiBtnSecondary} disabled:opacity-40`}
            >
              {vm.uploadingAvatar ? t.common.loading : t.profile.uploadAvatar}
            </button>
            {vm.avatarUrl && vm.isAuthenticated ? (
              <button
                type="button"
                disabled={vm.uploadingAvatar}
                onClick={() => void vm.handleRemoveAvatar()}
                className={`${uiBtnSecondary} text-[var(--app-danger)] disabled:opacity-40`}
              >
                {t.profile.removeAvatar}
              </button>
            ) : null}
          </div>
          <input
            ref={vm.fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void vm.handleAvatarChange(file);
              e.target.value = '';
            }}
          />
        </div>

        <label className={`${uiLabel} mt-6`} htmlFor="profile-name">
          {t.profile.displayName}
        </label>
        <input
          id="profile-name"
          type="text"
          value={vm.displayName}
          onChange={(e) => vm.setDisplayName(e.target.value)}
          disabled={!vm.isAuthenticated}
          className={uiInput}
        />

        <label className={`${uiLabel} mt-4`} htmlFor="profile-phone">
          {t.profile.phone}
        </label>
        <input
          id="profile-phone"
          type="tel"
          value={vm.phone}
          onChange={(e) => vm.setPhone(e.target.value)}
          disabled={!vm.isAuthenticated}
          className={uiInput}
          autoComplete="tel"
        />

        <label className={`${uiLabel} mt-4`} htmlFor="profile-language">
          {t.profile.nativeLanguage}
        </label>
        <select
          id="profile-language"
          value={vm.nativeLanguage}
          onChange={(e) => vm.setNativeLanguage(e.target.value)}
          disabled={!vm.isAuthenticated}
          className={uiSelect}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        {vm.error ? (
          <p className="mt-4 text-sm text-[var(--app-danger)]">{vm.error}</p>
        ) : null}
        {vm.saved ? (
          <p className={`${uiSuccess} mt-4`}>{t.profile.saved}</p>
        ) : null}

        {vm.isAuthenticated ? (
          <FormSubmitLabel
            id="profile-save"
            label={vm.saving ? t.common.loading : t.profile.saveProfile}
            className={`${uiBtnPrimary} mt-6 disabled:opacity-60`}
            disabled={vm.saving}
          />
        ) : null}
      </form>
    </AppShell>
  );
}
