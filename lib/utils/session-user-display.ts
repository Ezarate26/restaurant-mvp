import type { ConversationMember } from '@/lib/model/types';

export function sortMembersByJoinedAt(
  members: ConversationMember[]
): ConversationMember[] {
  return [...members].sort((a, b) => {
    const ta = Date.parse(a.joined_at ?? '') || 0;
    const tb = Date.parse(b.joined_at ?? '') || 0;
    return ta - tb;
  });
}
