/** El participante es owner si `role === 'owner'` o coincide con `owner_member_id`. */

export function isConversationOwner(
  ownerMemberId: string | null | undefined,
  memberId: string | null | undefined
): boolean {
  if (!ownerMemberId?.trim() || !memberId?.trim()) return false;
  return ownerMemberId.trim() === memberId.trim();
}
