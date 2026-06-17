const PENDING_ROOM_PASS_EXT_KEY = 'conversationPlatform.pendingRoomPassExtension';

export function markPendingRoomPassExtension(conversationId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_ROOM_PASS_EXT_KEY, conversationId);
}

export function consumePendingRoomPassExtension(
  conversationId: string
): boolean {
  if (typeof window === 'undefined') return false;
  const pending = sessionStorage.getItem(PENDING_ROOM_PASS_EXT_KEY);
  if (pending !== conversationId) return false;
  sessionStorage.removeItem(PENDING_ROOM_PASS_EXT_KEY);
  return true;
}
