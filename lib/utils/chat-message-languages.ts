import type { ConversationMember } from '@/lib/model/types';

function arrivalMs(m: ConversationMember): number {
  const raw = m.joined_at ?? '';
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export function resolveAudienceLanguage(
  members: ConversationMember[],
  fallback?: string | null
): string {
  const active = members.filter((m) => !m.left_at);
  const sorted = [...active].sort((a, b) => arrivalMs(a) - arrivalMs(b));
  const first = sorted.find((m) => m.preferred_language?.trim())
    ?.preferred_language?.trim();
  return first || fallback || 'es';
}
