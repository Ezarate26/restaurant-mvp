import type { ConversationMember } from '@/lib/model/types';
import { orderedMembers } from '@/lib/utils/chat-peer-label';

export function memberArrivalIndex(
  members: ConversationMember[],
  memberId: string
): number | null {
  const ordered = orderedMembers(members);
  const idx = ordered.findIndex((m) => m.id === memberId);
  if (idx < 0) return null;
  return idx + 1;
}

export function memberDisplayLabel(
  m: ConversationMember,
  arrivalIndex: number
): string {
  const name = m.display_name?.trim();
  if (name) return name;
  return `Participante ${arrivalIndex}`;
}
