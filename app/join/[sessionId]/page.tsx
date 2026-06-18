'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreePlanLimitsHint } from '@/components/billing/FreePlanLimitsHint';
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
import { ActiveSessionConflictClientError } from '@/lib/billing/conversation-create-client';
import { ActiveSessionBlockedNotice } from '@/components/conversation/ActiveSessionBlockedNotice';
import {
  markAllMembersLeft,
  markMemberLeft,
  fetchActiveMembersByConversation,
} from '@/lib/model/conversation-members.repository';
import { closeConversationRecord, fetchConversationByInviteCode } from '@/lib/model/conversations-table.repository';
import { fetchConversationRoomLimits } from '@/lib/billing/conversation-room-limits-client';
import type { BillingUiMode } from '@/lib/billing/billing-state';
import { getJoinLanguageOptions } from '@/lib/billing/language-access';
import { shouldShowFreePlanLimitsHint } from '@/lib/billing/show-free-plan-hint';
import { usePlan } from '@/lib/billing/PlanProvider';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { normalizeLanguageCode } from '@/constants/languages';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';
import {
  clearActiveConversationSession,
  getActiveConversationSession,
  resolveActiveConversationSession,
} from '@/lib/utils/active-conversation-session';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils/supabase-errors';

export default function JoinConversationPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useSupabaseAuth();
  const { tier } = usePlan();
  const inviteCode = ((params.sessionId as string) ?? '').trim().toUpperCase();
  const [language, setLanguage] = useState('es');
  const [languageOptions, setLanguageOptions] = useState(
    getJoinLanguageOptions(false, false)
  );
  const [roomFull, setRoomFull] = useState(false);
  const [roomMaxParticipants, setRoomMaxParticipants] = useState(2);
  const [roomUiMode, setRoomUiMode] = useState<BillingUiMode | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [switchIsOwner, setSwitchIsOwner] = useState(false);
  const [remoteActiveBlock, setRemoteActiveBlock] = useState<{
    inviteCode: string;
  } | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;
    void (async () => {
      const conversation = await fetchConversationByInviteCode(
        supabase,
        inviteCode
      );
      if (cancelled || !conversation) return;

      const [limits, members] = await Promise.all([
        fetchConversationRoomLimits(conversation.id),
        fetchActiveMembersByConversation(supabase, conversation.id),
      ]);
      if (cancelled) return;

      setRoomFull(members.length >= limits.maxParticipants);
      setRoomMaxParticipants(limits.maxParticipants);
      setRoomUiMode(limits.uiMode);
      const options = getJoinLanguageOptions(
        limits.allowAllLanguages,
        isAuthenticated
      );
      setLanguageOptions(options);
      setLanguage((prev) =>
        options.some((l) => l.code === prev) ? prev : 'es'
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteCode, isAuthenticated]);

  const performJoin = async () => {
    if (!inviteCode) {
      setError('Código de invitación no válido');
      return;
    }
    if (!displayName.trim()) {
      setError('Ingresa tu nombre visible para unirte a la conversación.');
      return;
    }
    if (roomFull) {
      setError(
        roomMaxParticipants <= 2
          ? 'Esta sala gratuita admite solo 2 participantes (tú y un invitado). Pro desbloquea hasta 10 invitados.'
          : `Esta sala ya tiene el máximo de ${roomMaxParticipants} participantes.`
      );
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
      if (e instanceof ActiveSessionConflictClientError) {
        setRemoteActiveBlock({ inviteCode: e.activeSession.inviteCode });
        setError(e.message);
        return;
      }
      setError(getErrorMessage(e, 'unirte a la conversación'));
    } finally {
      setBusy(false);
      setPendingJoin(false);
    }
  };

  const showFreeHint =
    roomUiMode != null &&
    shouldShowFreePlanLimitsHint({ userTier: tier, roomUiMode });

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    const active = await resolveActiveConversationSession(supabase);
    if (active) {
      setSwitchIsOwner(active.isOwner);
      setSwitchOpen(true);
      setPendingJoin(true);
      return;
    }
    void performJoin();
  };

  const handleSwitchConfirm = async () => {
    const active =
      (await resolveActiveConversationSession(supabase)) ??
      getActiveConversationSession();
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
      setError(getErrorMessage(e, 'cambiar de conversación'));
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

        {showFreeHint ? (
          <FreePlanLimitsHint variant="join" className="mt-4" />
        ) : null}

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
          {languageOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        {remoteActiveBlock ? (
          <ActiveSessionBlockedNotice
            inviteCode={remoteActiveBlock.inviteCode}
            className="mt-4"
          />
        ) : null}

        {roomFull ? (
          <p className="mt-4 text-sm text-[var(--app-error)]">
            {roomMaxParticipants <= 2
              ? 'Esta sala gratuita ya tiene 2 participantes. Pro desbloquea hasta 10 invitados.'
              : `Esta sala ya tiene el máximo de ${roomMaxParticipants} participantes.`}
          </p>
        ) : null}

        {error ? <p className={`${uiError} mt-4`}>{error}</p> : null}

        <FormSubmitLabel
          id="join-conversation-submit"
          label="Entrar a la conversación"
          busyLabel="Entrando…"
          busy={busy}
          disabled={!inviteCode || roomFull || remoteActiveBlock != null}
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
