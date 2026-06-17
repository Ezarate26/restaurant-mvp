import {
  markAllMembersLeft,
  markMemberLeft,
} from '@/lib/model/conversation-members.repository';
import { closeConversationRecord } from '@/lib/model/conversations-table.repository';
import { supabase } from '@/lib/supabase';
import { LANDING_PATH } from '@/lib/constants/routes';
import {
  clearActiveConversationSession,
  type ActiveConversationSession,
} from '@/lib/utils/active-conversation-session';

export async function leaveActiveConversationSession(
  session: ActiveConversationSession
): Promise<void> {
  if (session.isOwner) {
    await markAllMembersLeft(supabase, session.conversationId);
    await closeConversationRecord(
      supabase,
      session.conversationId,
      session.memberId
    );
  } else {
    await markMemberLeft(supabase, session.memberId);
  }
  clearActiveConversationSession();
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearActiveConversationSession();
}

/** Cierra sesión y recarga el landing (evita carreras con guards de /app/*). */
export async function logoutAndReturnToLanding(): Promise<void> {
  await signOutUser();
  if (typeof window !== 'undefined') {
    window.location.assign(LANDING_PATH);
  }
}
