import type { ConversationMember } from '@/lib/model/types';

export function orderedMembers(
  members: ConversationMember[]
): ConversationMember[] {
  return [...members].sort((a, b) => {
    const ta = Date.parse(a.joined_at ?? '') || 0;
    const tb = Date.parse(b.joined_at ?? '') || 0;
    return ta - tb;
  });
}

export function memberDisplayLabel(m: ConversationMember): string {
  return m.display_name?.trim() || 'Participante';
}
