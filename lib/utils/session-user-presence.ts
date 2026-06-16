import type { ConversationMember } from '@/lib/model/types';

export function isPresentMember(
  m: ConversationMember | null | undefined
): boolean {
  return Boolean(m && !m.left_at);
}
