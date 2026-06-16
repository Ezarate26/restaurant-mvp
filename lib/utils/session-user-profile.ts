import type { ConversationMember } from '@/lib/model/types';

export type CompleteProfileLinkOpts = {
  conversationId?: string | null;
};

export function isRegisteredMember(
  member: ConversationMember | null | undefined
): boolean {
  return Boolean(member?.user_id?.trim());
}

export function completeProfileHrefForMember(
  member: ConversationMember | null | undefined,
  fallbackEmail?: string | null,
  opts?: CompleteProfileLinkOpts | null
): string | null {
  if (!member) return null;
  if (isRegisteredMember(member)) return null;
  const email = member.display_name?.trim() || fallbackEmail?.trim() || '';
  if (!email.includes('@')) return null;
  const q = new URLSearchParams();
  q.set('email', email);
  const cid = opts?.conversationId?.trim();
  if (cid) q.set('return_conversation', cid);
  return `/complete-profile?${q.toString()}`;
}

export function shouldPromptOptionalProfile(
  member: ConversationMember | null | undefined
): boolean {
  if (!member) return false;
  if (isRegisteredMember(member)) return false;
  return !member.display_name?.trim();
}
