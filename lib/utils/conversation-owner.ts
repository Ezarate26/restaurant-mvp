import type { ConversationMember } from '@/lib/model/types';

export function resolveOwnerDisplayName(
  members: ConversationMember[],
  ownerMemberId?: string | null
): string {
  const owner =
    (ownerMemberId
      ? members.find((m) => m.id === ownerMemberId)
      : undefined) ??
    members.find((m) => m.role === 'owner' && !m.left_at);

  return owner?.display_name?.trim() || 'el propietario';
}

export function resolveMemberDisplayName(
  members: ConversationMember[],
  memberId?: string | null,
  fallback = 'Alguien'
): string {
  if (!memberId) return fallback;
  const member = members.find((m) => m.id === memberId);
  return member?.display_name?.trim() || fallback;
}
