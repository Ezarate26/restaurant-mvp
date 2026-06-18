import { CONVERSA_SITE_URL } from '@/lib/brand/constants';

const LOCAL_DEV_URL = 'http://localhost:3000';

/** Base pública del sitio (env → ventana → producción → localhost). */
export function getSiteUrlBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.NODE_ENV === 'production') {
    return CONVERSA_SITE_URL;
  }

  return LOCAL_DEV_URL;
}

export function siteUrl(path = ''): string {
  const base = getSiteUrlBase();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function joinInviteUrl(inviteCode: string): string {
  return siteUrl(`/join/${inviteCode.trim().toUpperCase()}`);
}

export function resolveJoinShareUrl(
  inviteCode: string | null | undefined,
  shareUrl?: string | null
): string | null {
  const explicit = shareUrl?.trim();
  if (explicit) return explicit;
  const code = inviteCode?.trim();
  if (!code) return null;
  return joinInviteUrl(code);
}
