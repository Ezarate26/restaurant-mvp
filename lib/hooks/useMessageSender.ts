'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  insertMessageAndRunTranslationPipeline,
  hydrateChatMessagesForViewer,
  type ChatOutboundInsertRow,
  type ConversationLanguagesRef,
  type OutboundPipelineResult,
} from '@/lib/messaging/outbound-message-pipeline';
import { insertVoiceMessageAndProcess } from '@/lib/messaging/voice-message-pipeline';
import type { Message } from '@/lib/model/types';

export function useMessageSender() {
  const handleSendMessage = useCallback(
    async (args: {
      insertRow: ChatOutboundInsertRow;
      latestLanguagesRef?: ConversationLanguagesRef;
    }): Promise<OutboundPipelineResult> => {
      return insertMessageAndRunTranslationPipeline(supabase, args.insertRow, {
        latestLanguagesRef: args.latestLanguagesRef,
      });
    },
    []
  );

  const handleSendVoiceMessage = useCallback(
    async (args: {
      conversation_id: string;
      member_id: string;
      blob: Blob;
      mimeType?: string;
      original_language?: string | null;
      duration_seconds?: number | null;
    }): Promise<{ message: Message; messages: Message[] }> => {
      return insertVoiceMessageAndProcess(supabase, args);
    },
    []
  );

  const hydrateViewerMessages = useCallback(
    async (args: {
      conversationId: string;
      viewerLanguage: string | null | undefined;
      latestLanguagesRef?: ConversationLanguagesRef;
    }): Promise<{ messages: Message[]; conversationLanguages: string[] }> => {
      return hydrateChatMessagesForViewer(
        supabase,
        args.conversationId,
        args.viewerLanguage,
        { latestLanguagesRef: args.latestLanguagesRef }
      );
    },
    []
  );

  return { handleSendMessage, handleSendVoiceMessage, hydrateViewerMessages };
}
