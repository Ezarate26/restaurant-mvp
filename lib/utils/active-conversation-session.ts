import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchMemberById } from '@/lib/model/conversation-members.repository';
import { fetchConversationById } from '@/lib/model/conversations-table.repository';

const STORAGE_KEY = 'conversationPlatform.activeSession';

export type ActiveConversationSession = {
  conversationId: string;
  memberId: string;
  isOwner: boolean;
  lang?: string;
  title?: string | null;
};

export function getActiveConversationSession(): ActiveConversationSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ActiveConversationSession;
    if (!data.conversationId || !data.memberId) return null;
    return data;
  } catch {
    return null;
  }
}

export function setActiveConversationSession(
  session: ActiveConversationSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveConversationSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Elimina sesión local si la conversación cerró o el miembro ya salió. */
export async function resolveActiveConversationSession(
  client: SupabaseClient
): Promise<ActiveConversationSession | null> {
  const active = getActiveConversationSession();
  if (!active) return null;

  const [conv, mem] = await Promise.all([
    fetchConversationById(client, active.conversationId),
    fetchMemberById(client, active.memberId),
  ]);

  if (!conv || conv.status === 'closed' || !mem || mem.left_at) {
    clearActiveConversationSession();
    return null;
  }

  return active;
}
