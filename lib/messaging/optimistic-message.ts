import type { Message } from '@/lib/model/types';

export function createOptimisticTextMessage(args: {
  conversationId: string;
  memberId: string;
  content: string;
  originalLanguage: string;
  displayName?: string | null;
}): Message {
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    conversation_id: args.conversationId,
    member_id: args.memberId,
    message_type: 'text',
    content: args.content,
    original_language: args.originalLanguage,
    translation_status: 'pending',
    created_at: new Date().toISOString(),
    conversation_members: {
      display_name: args.displayName ?? null,
      preferred_language: args.originalLanguage,
    },
  };
}

export function isOptimisticMessageId(id: string): boolean {
  return id.startsWith('optimistic-');
}
