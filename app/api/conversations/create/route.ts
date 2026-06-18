import { NextResponse } from 'next/server';
import { ensurePublicUserById } from '@/lib/auth/ensure-public-user';
import { assertCanCreateFreeConversation } from '@/lib/billing/free-daily-limit.server';
import { resolveCreatorAllowAllLanguagesServer } from '@/lib/billing/creator-language-access.server';
import {
  assertLanguageAllowed,
  clampLanguageToFree,
} from '@/lib/billing/language-access';
import { bootstrapConversationWithOwner } from '@/lib/model/conversation-members.repository';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';
import { normalizeLanguageCode } from '@/constants/languages';

type CreateBody = {
  deviceId?: string;
  displayName?: string | null;
  preferredLanguage?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateBody;
  const deviceId = body.deviceId?.trim() || null;
  const displayName = body.displayName?.trim() || null;
  const preferredLanguage = normalizeLanguageCode(
    body.preferredLanguage?.trim() || 'es'
  );

  if (!deviceId) {
    return NextResponse.json(
      {
        error:
          'No se pudo identificar tu dispositivo. Activa el almacenamiento local del navegador.',
      },
      { status: 400 }
    );
  }

  if (!displayName) {
    return NextResponse.json(
      { error: 'Ingresa tu nombre visible para iniciar la conversación.' },
      { status: 400 }
    );
  }

  const userId = (await getUserIdFromRequest(request)) ?? null;
  const service = createSupabaseServiceRole();

  try {
    await assertCanCreateFreeConversation(service, { userId, deviceId });

    let ownerUserId: string | null = userId;
    if (ownerUserId) {
      await ensurePublicUserById(service, ownerUserId);
    }

    const creatorAllowsAll = await resolveCreatorAllowAllLanguagesServer(
      service,
      ownerUserId
    );
    const language = creatorAllowsAll
      ? preferredLanguage
      : clampLanguageToFree(preferredLanguage);
    assertLanguageAllowed(language, creatorAllowsAll);

    const result = await bootstrapConversationWithOwner(service, {
      deviceId,
      displayName,
      preferredLanguage: language,
      userId: ownerUserId,
    });

    return NextResponse.json({
      conversation_id: result.conversationId,
      member_id: result.memberId,
      invite_code: result.inviteCode,
      member: result.member,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'No se pudo crear la conversación';
    const status =
      message.includes('límite') || message.includes('Límite') ? 429 : 400;
    console.error('POST /api/conversations/create', e);
    return NextResponse.json({ error: message }, { status });
  }
}
