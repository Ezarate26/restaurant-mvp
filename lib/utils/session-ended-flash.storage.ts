const STORAGE_KEY = 'conversationPlatform.sessionEndedByTime';

export function markSessionEndedByTime(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function consumeSessionEndedByTime(): boolean {
  if (typeof window === 'undefined') return false;
  const value = sessionStorage.getItem(STORAGE_KEY);
  if (value !== '1') return false;
  sessionStorage.removeItem(STORAGE_KEY);
  return true;
}
