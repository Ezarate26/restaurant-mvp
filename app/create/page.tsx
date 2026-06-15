'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
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
import { LANGUAGES, normalizeLanguageCode } from '@/constants/languages';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import { getActiveConversationSession } from '@/lib/utils/active-conversation-session';

export default function CreateConversationPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('es');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const active = getActiveConversationSession();
    if (active) {
      router.replace(
        `/c/${active.conversationId}?member=${encodeURIComponent(active.memberId)}${active.lang ? `&lang=${encodeURIComponent(active.lang)}` : ''}`
      );
    }
  }, [router]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await createConversation({
        display_name: displayName.trim() || null,
        preferred_language: normalizeLanguageCode(language),
        device_id: getOrCreateCustomerIdentifier(),
      });

      router.push(
        `/c/${result.conversation_id}?member=${encodeURIComponent(result.member_id)}&lang=${encodeURIComponent(language)}`
      );
    } catch (err) {
      console.error('createConversation', err);
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la conversación'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <form
        className={`${uiCard} min-w-0`}
        onSubmit={(e) => void handleCreate(e)}
      >
        <h1 className="text-xl font-bold sm:text-2xl">Nueva conversación</h1>
        <p className="mt-2 text-sm text-[var(--modal-muted)]">
          Solo necesitas tu nombre y tu idioma para empezar.
        </p>

        <label className={`${uiLabel} mt-6`} htmlFor="display-name">
          Nombre visible
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Cómo te verán los demás"
          className={uiInput}
        />

        <label className={`${uiLabel} mt-4`} htmlFor="create-language">
          Idioma
        </label>
        <select
          id="create-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={uiSelect}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        {error ? <p className={`${uiError} mt-4`}>{error}</p> : null}

        <FormSubmitLabel
          id="create-conversation-submit"
          label="Crear conversación"
          busyLabel="Creando…"
          busy={busy}
          className={`${uiBtnPrimary} mt-6 w-full`}
        />

        <Link href="/" className={`${uiBtnGhost} mt-3 block w-full text-center`}>
          Volver al inicio
        </Link>
      </form>
    </AppShell>
  );
}
