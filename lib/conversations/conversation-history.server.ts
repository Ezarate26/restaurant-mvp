import type { SupabaseClient } from '@supabase/supabase-js';
import type { Conversation } from '@/lib/model/types';
import { fetchConversationById } from '@/lib/model/conversations-table.repository';

export type ConversationHistoryItem = {
  conversationId: string;
  roomName: string;
  inviteCode: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  languages: string[];
  participantCount: number;
  durationMs: number;
  lastActivityAt: string | null;
  memberId: string;
};

function formatLang(code: string | null | undefined): string | null {
  if (!code?.trim()) return null;
  return code.trim().toUpperCase();
}

function computeDurationMs(
  conv: Conversation,
  lastActivityAt: string | null
): number {
  const start = conv.created_at ? Date.parse(conv.created_at) : Date.now();
  const end =
    conv.status === 'closed' && conv.closed_at
      ? Date.parse(conv.closed_at)
      : lastActivityAt
        ? Date.parse(lastActivityAt)
        : Date.now();
  return Math.max(0, end - start);
}

export async function fetchConversationHistoryForUser(
  client: SupabaseClient,
  userId: string,
  args?: {
    search?: string;
    from?: string;
    to?: string;
  }
): Promise<ConversationHistoryItem[]> {
  const { data: memberships, error } = await client
    .from('conversation_members')
    .select('id, conversation_id, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('fetchConversationHistoryForUser:members', error);
    throw new Error('No se pudo cargar el historial');
  }

  const seen = new Set<string>();
  const items: ConversationHistoryItem[] = [];

  for (const membership of memberships ?? []) {
    const conversationId = membership.conversation_id as string;
    if (seen.has(conversationId)) continue;
    seen.add(conversationId);

    const conv = await fetchConversationById(client, conversationId);
    if (!conv) continue;

    const { data: members } = await client
      .from('conversation_members')
      .select('preferred_language')
      .eq('conversation_id', conversationId);

    const { data: lastMessage } = await client
      .from('messages')
      .select('created_at')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const languages = [
      ...new Set(
        (members ?? [])
          .map((m) => formatLang((m as { preferred_language: string }).preferred_language))
          .filter((l): l is string => Boolean(l))
      ),
    ];

    const roomName =
      conv.title?.trim() || `Sala ${conv.invite_code}`;
    const createdAt = conv.created_at ?? membership.joined_at ?? new Date().toISOString();
    const lastActivityAt =
      (lastMessage as { created_at: string } | null)?.created_at ?? conv.closed_at ?? createdAt;

    if (args?.from) {
      const fromMs = Date.parse(args.from);
      if (!Number.isNaN(fromMs) && Date.parse(createdAt) < fromMs) continue;
    }
    if (args?.to) {
      const toMs = Date.parse(args.to);
      if (!Number.isNaN(toMs) && Date.parse(createdAt) > toMs + 86_400_000) continue;
    }
    if (args?.search?.trim()) {
      const q = args.search.trim().toLowerCase();
      const haystack = `${roomName} ${conv.invite_code}`.toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    items.push({
      conversationId: conv.id,
      roomName,
      inviteCode: conv.invite_code,
      status: conv.status,
      createdAt,
      closedAt: conv.closed_at ?? null,
      languages,
      participantCount: members?.length ?? 0,
      durationMs: computeDurationMs(conv, lastActivityAt),
      lastActivityAt,
      memberId: membership.id as string,
    });
  }

  return items.sort(
    (a, b) => Date.parse(b.lastActivityAt ?? b.createdAt) - Date.parse(a.lastActivityAt ?? a.createdAt)
  );
}
