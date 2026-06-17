'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreePlanLimitsHint } from '@/components/billing/FreePlanLimitsHint';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiBtnGhost,
  uiCard,
  uiError,
  uiInput,
  uiLabel,
  uiSelect,
} from '@/components/ui/ui-classes';
import { createConversation } from '@/lib/model/conversations.repository';
import { assertCanCreateConversationClient, fetchFreeCreateEligibility } from '@/lib/billing/conversation-create-client';
import { getCreateLanguageOptions } from '@/lib/billing/language-access';
import { shouldShowFreePlanLimitsHint } from '@/lib/billing/show-free-plan-hint';
import { usePlan } from '@/lib/billing/PlanProvider';
import { fetchUserById } from '@/lib/model/profiles.repository';
import { normalizeLanguageCode } from '@/constants/languages';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import { resolveActiveConversationSession } from '@/lib/utils/active-conversation-session';
import { resolveAccountDisplayName } from '@/lib/utils/account-display-name';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { formatMessage } from '@/lib/i18n/messages';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';
import { getErrorMessage } from '@/lib/utils/supabase-errors';
import { supabase } from '@/lib/supabase';

export default function CreateConversationPage() {
  const router = useRouter();
  const { t } = useAppLanguage();
  const { tier } = usePlan();
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [language, setLanguage] = useState('es');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyHint, setDailyHint] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const prefilledNameRef = useRef(false);
  const languageOptions = useMemo(
    () => getCreateLanguageOptions(tier === 'pro'),
    [tier]
  );

  useEffect(() => {
    if (languageOptions.some((l) => l.code === language)) return;
    setLanguage('es');
  }, [languageOptions, language]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const active = await resolveActiveConversationSession(supabase);
      if (cancelled || !active) return;
      router.replace(
        `/c/${active.conversationId}?member=${encodeURIComponent(active.memberId)}${active.lang ? `&lang=${encodeURIComponent(active.lang)}` : ''}`
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || prefilledNameRef.current) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const profile = await fetchUserById(supabase, user.id);
        if (cancelled) return;

        const name = resolveAccountDisplayName(user, profile);
        if (name) {
          setDisplayName(name);
          prefilledNameRef.current = true;
        }
      } catch (e) {
        console.error('CreateConversationPage:prefill', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;
    const deviceId = getOrCreateCustomerIdentifier();
    void fetchFreeCreateEligibility(deviceId)
      .then((usage) => {
        if (cancelled || usage.unlimited) {
          setCanCreate(true);
          return;
        }
        setCanCreate(usage.canCreate);
        if (!usage.canCreate) {
          setDailyHint(usage.message);
          return;
        }
        setDailyHint(
          `Plan Free: te quedan ${usage.remaining} de ${usage.limit} conversaciones en las próximas 24 h (desde tu primera charla del período).`
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!displayName.trim()) {
      setError('Ingresa tu nombre visible para iniciar la conversación.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const deviceId = getOrCreateCustomerIdentifier();
      await assertCanCreateConversationClient(deviceId);
      const result = await createConversation({
        display_name: displayName.trim() || null,
        preferred_language: normalizeLanguageCode(language),
        device_id: deviceId,
      });

      router.push(
        `/c/${result.conversation_id}?member=${encodeURIComponent(result.member_id)}&lang=${encodeURIComponent(language)}`
      );
    } catch (err) {
      console.error('createConversation', err);
      setError(getErrorMessage(err, 'iniciar la conversación'));
    } finally {
      setBusy(false);
    }
  };

  const trimmedName = displayName.trim();
  const showNameHint = isAuthenticated && trimmedName.length > 0;
  const showFreeHint = shouldShowFreePlanLimitsHint({ userTier: tier });

  return (
    <AppShell>
      <form
        className={`${uiCard} min-w-0`}
        onSubmit={(e) => void handleCreate(e)}
      >
        <h1 className="text-xl font-bold sm:text-2xl">{t.create.title}</h1>
        <p className="mt-2 text-sm text-[var(--modal-muted)]">
          {t.create.subtitle}
        </p>

        {showFreeHint ? (
          <FreePlanLimitsHint variant="create" className="mt-4" />
        ) : null}

        <label className={`${uiLabel} mt-6`} htmlFor="display-name">
          {t.create.displayName}
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t.create.displayNamePlaceholder}
          className={uiInput}
        />
        {showNameHint ? (
          <p className="mt-2 text-sm text-[var(--modal-muted)]">
            {formatMessage(t.create.displayNameHint, { name: trimmedName })}
          </p>
        ) : null}

        <label className={`${uiLabel} mt-4`} htmlFor="create-language">
          {t.create.language}
        </label>
        <select
          id="create-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={uiSelect}
        >
          {languageOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        {error ? <p className={`${uiError} mt-4`}>{error}</p> : null}

        {dailyHint ? (
          <p
            className={`mt-4 text-sm ${error ? 'text-[var(--app-error)]' : 'text-[var(--app-muted)]'}`}
          >
            {dailyHint}
          </p>
        ) : null}

        <FormSubmitLabel
          id="create-conversation-submit"
          label={t.create.submit}
          busyLabel={t.create.submitBusy}
          busy={busy}
          disabled={!canCreate}
          className={`${uiBtnPrimary} mt-6 w-full`}
        />

        <Link
          href={isAuthenticated ? AUTH_HOME_PATH : '/'}
          className={`${uiBtnGhost} mt-3 block w-full text-center`}
        >
          {t.create.backHome}
        </Link>
      </form>
    </AppShell>
  );
}
