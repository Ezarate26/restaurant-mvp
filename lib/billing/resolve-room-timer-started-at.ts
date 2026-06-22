import type { ConversationMember } from '@/lib/model/types';

/** Momento en que la sala alcanza 2 participantes activos (joined_at del 2.º). */
export function resolveRoomTimerStartedAt(
  members: Pick<ConversationMember, 'joined_at' | 'left_at'>[]
): string | null {
  const active = members
    .filter((m) => !m.left_at)
    .sort((a, b) => {
      const ta = Date.parse(a.joined_at ?? '') || 0;
      const tb = Date.parse(b.joined_at ?? '') || 0;
      return ta - tb;
    });

  if (active.length < 2) return null;

  const secondJoinedAt = active[1]?.joined_at;
  if (!secondJoinedAt) return null;
  const parsed = Date.parse(secondJoinedAt);
  if (!Number.isFinite(parsed)) return null;
  return secondJoinedAt;
}
