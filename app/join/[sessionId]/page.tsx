'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SwitchConversationModal } from '@/components/conversation/SwitchConversationModal';
import { FormSubmitLabel } from '@/components/ui/FormSubmitLabel';
import {
  uiBtnPrimary,
  uiCard,
  uiError,
  uiInput,
  uiLabel,
  uiSelect,
} from '@/components/ui/ui-classes';
import { joinConversation } from '@/lib/model/conversations.repository';
import {
  markAllMembersLeft,
  markMemberLeft,
} from '@/lib/model/conversation-members.repository';
import { closeConversationRecord } from '@/lib/model/conversations-table.repository';
import { LANGUAGES, normalizeLanguageCode } from '@/constants/languages';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import {
  clearActiveConversationSession,
  getActiveConversationSession,
} from '@/lib/utils/active-conversation-session';
import { supabase } from '@/lib/supabase';

export default function JoinConversationPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = ((params.sessionId as string) ?? '').trim().toUpperCase();
  const [language, setLanguage] = useState('es');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [switchIsOwner, setSwitchIsOwner] = useState(false);

  const performJoin = async () => {
    if (!inviteCode) {
      setError('Código de invitación no válido');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await joinConversation({
        invite_code: inviteCode,
        display_name: displayName.trim() || null,
        preferred_language: normalizeLanguageCode(language),
        device_id: getOrCreateCustomerIdentifier(),
      });

      router.push(
        `/c/${result.conversation_id}?member=${encodeURIComponent(result.member_id)}&lang=${encodeURIComponent(language)}`
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo unir a la conversación'
      );
    } finally {
      setBusy(false);
      setPendingJoin(false);
    }
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const active = getActiveConversationSession();
    if (active) {
      setSwitchIsOwner(active.isOwner);
      setSwitchOpen(true);
      setPendingJoin(true);
      return;
    }
    void performJoin();
  };

  const handleSwitchConfirm = async () => {
    const active = getActiveConversationSession();
    if (!active) {
      setSwitchOpen(false);
      if (pendingJoin) void performJoin();
      return;
    }
    setBusy(true);
    try {
      if (active.isOwner) {
        await markAllMembersLeft(supabase, active.conversationId);
        await closeConversationRecord(
          supabase,
          active.conversationId,
          active.memberId
        );
      } else {
        await markMemberLeft(supabase, active.memberId);
      }
      clearActiveConversationSession();
      setSwitchOpen(false);
      if (pendingJoin) await performJoin();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar de conversación');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <form
        className={`${uiCard} relative z-10 min-w-0`}
        onSubmit={handleJoin}
      >
        <h1 className="text-xl font-bold sm:text-2xl">Unirse a la conversación</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Código:{' '}
          <span className="font-mono font-bold text-[var(--app-text)]">
            {inviteCode || '—'}
          </span>
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

        <label className={`${uiLabel} mt-4`} htmlFor="join-language">
          Idioma
        </label>
        <select
          id="join-language"
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
          id="join-conversation-submit"
          label="Entrar a la conversación"
          busyLabel="Entrando…"
          busy={busy}
          disabled={!inviteCode}
          className={`${uiBtnPrimary} mt-6 w-full`}
        />
      </form>

      <SwitchConversationModal
        open={switchOpen}
        busy={busy}
        isOwner={switchIsOwner}
        onCancel={() => {
          setSwitchOpen(false);
          setPendingJoin(false);
        }}
        onConfirm={handleSwitchConfirm}
      />
    </AppShell>
  );
}
