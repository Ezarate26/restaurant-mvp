const KEY = 'conversationPlatform.showProInvite';

export function markShowProInvite() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, '1');
}

export function consumeShowProInvite(): boolean {
  if (typeof window === 'undefined') return false;
  const v = sessionStorage.getItem(KEY);
  if (v !== '1') return false;
  sessionStorage.removeItem(KEY);
  return true;
}
