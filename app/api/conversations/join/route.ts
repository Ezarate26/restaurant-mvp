import { NextResponse } from 'next/server';
import { ensurePublicUserById } from '@/lib/auth/ensure-public-user';
import { resolveJoinDisplayNameForUser } from '@/lib/auth/resolve-join-display-name.server';
import { applyProJoinRoomBoost } from '@/lib/billing/apply-pro-join-room-boost';
import {
  getOrCreateBillingRow,
  resolveEffectiveTier,
} from '@/lib/billing/billing.repository';
import { getConversationRoomLimits } from '@/lib/billing/get-conversation-room-limits';
import {
  ActiveSessionConflictError,
  assertCanJoinConversation,
} from '@/lib/conversations/active-session.server';
import {
  assertLanguageAllowed,
  clampLanguageToFree,
} from '@/lib/billing/language-access';
import {
  fetchActiveMembersByConversation,
  insertConversationMember,
} from '@/lib/model/conversation-members.repository';
import {
  enforceConversationRoomTimer,
  setRoomTimerStartedAtIfNull,
} from '@/lib/billing/room-timer.server';
import { fetchConversationByInviteCode } from '@/lib/model/conversations-table.repository';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';
import { normalizeLanguageCode } from '@/constants/languages';

type JoinBody = {
  inviteCode?: string;
  deviceId?: string;
  displayName?: string | null;
  preferredLanguage?: string;
};

function conflictResponse(error: ActiveSessionConflictError) {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      activeSession: error.session,
    },
    { status: 409 }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JoinBody;
  const inviteCode = body.inviteCode?.trim().toUpperCase() || null;
  const deviceId = body.deviceId?.trim() || null;
  const bodyDisplayName = body.displayName?.trim() || null;
  const preferredLanguage = normalizeLanguageCode(
    body.preferredLanguage?.trim() || 'es'
  );

  if (!inviteCode) {
    return NextResponse.json(
      { error: 'Código de invitación no válido' },
      { status: 400 }
    );
  }

  if (!deviceId) {
    return NextResponse.json(
      {
        error:
          'No se pudo identificar tu dispositivo. Activa el almacenamiento local del navegador.',
      },
      { status: 400 }
    );
  }

  const userId = (await getUserIdFromRequest(request)) ?? null;

  if (!userId && !bodyDisplayName) {
    return NextResponse.json(
      { error: 'Ingresa tu nombre visible para unirte a la conversación.' },
      { status: 400 }
    );
  }

  const service = createSupabaseServiceRole();

  try {
    const conversation = await fetchConversationByInviteCode(service, inviteCode);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Código de invitación no válido o conversación cerrada' },
        { status: 404 }
      );
    }

    const timerStatus = await enforceConversationRoomTimer(conversation.id);
    if (timerStatus === 'closed' || timerStatus === 'already_closed') {
      return NextResponse.json(
        {
          error:
            'El tiempo de esta sala se agotó. Inicia un nuevo chat desde el inicio.',
          code: 'ROOM_TIME_EXPIRED',
        },
        { status: 410 }
      );
    }

    let joinerUserId: string | null = userId;
    if (joinerUserId) {
      await ensurePublicUserById(service, joinerUserId);
    }

    const displayName = joinerUserId
      ? bodyDisplayName ?? (await resolveJoinDisplayNameForUser(service, joinerUserId))
      : bodyDisplayName!;

    const limits = await getConversationRoomLimits(conversation.id);
    const activeMembers = await fetchActiveMembersByConversation(
      service,
      conversation.id
    );

    const existingMember = await assertCanJoinConversation(service, {
      conversationId: conversation.id,
      userId: joinerUserId,
      deviceId,
    });

    if (!existingMember && activeMembers.length >= limits.maxParticipants) {
      const msg =
        limits.maxParticipants <= 2
          ? 'Esta sala gratuita admite solo 2 participantes (tú y un invitado). Pro desbloquea hasta 10 invitados.'
          : `Esta sala ya tiene el máximo de ${limits.maxParticipants} participantes.`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const joinerAllowsAll = limits.allowAllLanguages && Boolean(joinerUserId);
    const language = joinerAllowsAll
      ? preferredLanguage
      : clampLanguageToFree(preferredLanguage);
    assertLanguageAllowed(language, joinerAllowsAll);

    const joiningNewMember = !existingMember;
    const member =
      existingMember ??
      (await insertConversationMember(service, {
        conversationId: conversation.id,
        deviceId,
        displayName,
        preferredLanguage: language,
        role: 'member',
        userId: joinerUserId,
      }));

    if (joiningNewMember && activeMembers.length === 1) {
      await setRoomTimerStartedAtIfNull(service, conversation.id);
    }

    if (joinerUserId) {
      try {
        const billing = await getOrCreateBillingRow(service, joinerUserId);
        if (resolveEffectiveTier(billing) === 'pro') {
          await applyProJoinRoomBoost(service, conversation.id);
        }
      } catch (e) {
        console.error('POST /api/conversations/join:proJoinBoost', e);
      }
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      member_id: member.id,
      invite_code: conversation.invite_code,
      member,
    });
  } catch (e) {
    if (e instanceof ActiveSessionConflictError) {
      return conflictResponse(e);
    }
    const message =
      e instanceof Error ? e.message : 'No se pudo unir a la conversación';
    console.error('POST /api/conversations/join', e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
