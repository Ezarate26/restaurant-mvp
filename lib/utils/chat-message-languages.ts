import { normalizeLanguageCode } from '@/constants/languages';
import type { SessionUser } from '@/lib/model/types';

export function resolveCustomerOutgoingLanguages(args: {
  sessionUserLanguage: string | null | undefined;
  selectedLanguage: string | null | undefined;
  waiterLanguage: string | null | undefined;
  restaurantDefaultLanguage: string | null | undefined;
}): { original: string; target: string } {
  const original = normalizeLanguageCode(
    args.sessionUserLanguage || args.selectedLanguage
  );
  const target = normalizeLanguageCode(
    args.waiterLanguage || args.restaurantDefaultLanguage
  );
  return { original, target };
}

function arrivalMs(u: SessionUser): number {
  const raw = u.joined_at ?? '';
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/** Idioma del público cliente en mesa (primer participante activo con idioma o fallback). */
export function resolveAudienceCustomerLanguage(
  sessionUsers: SessionUser[],
  sessionLanguage: string | null | undefined,
  restaurantDefaultLanguage: string | null | undefined
): string {
  const active = sessionUsers.filter((u) => u.status !== 'left');
  const sorted = [...active].sort((a, b) => arrivalMs(a) - arrivalMs(b));
  const first = sorted.find((u) => u.language?.trim())?.language?.trim();
  return normalizeLanguageCode(
    first || sessionLanguage || restaurantDefaultLanguage
  );
}

export function resolveWaiterOutgoingLanguages(args: {
  waiterLanguage: string | null | undefined;
  sessionUsers: SessionUser[];
  sessionLanguage: string | null | undefined;
  restaurantDefaultLanguage: string | null | undefined;
}): { original: string; target: string } {
  const original = normalizeLanguageCode(args.waiterLanguage);
  const target = resolveAudienceCustomerLanguage(
    args.sessionUsers,
    args.sessionLanguage,
    args.restaurantDefaultLanguage
  );
  return { original, target };
}
