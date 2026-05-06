'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  insertMessageAndRunTranslationPipeline,
  hydrateChatMessagesForViewer,
  type ChatOutboundInsertRow,
  type OutboundPipelineResult,
  type SessionLanguagesRef,
} from '@/lib/messaging/outbound-message-pipeline';
import type { Message } from '@/lib/model/types';

/**
 * Envío de mensajes chat (customer / waiter): insert + traducciones solo para ese mensaje.
 */
export function useMessageSender() {
  const handleSendMessage = useCallback(
    async (args: {
      insertRow: ChatOutboundInsertRow;
      latestLanguagesRef?: SessionLanguagesRef;
    }): Promise<OutboundPipelineResult> => {
      return insertMessageAndRunTranslationPipeline(supabase, args.insertRow, {
        latestLanguagesRef: args.latestLanguagesRef,
      });
    },
    []
  );

  const hydrateViewerMessages = useCallback(
    async (args: {
      sessionId: string;
      viewerLanguage: string | null | undefined;
      latestLanguagesRef?: SessionLanguagesRef;
    }): Promise<{ messages: Message[]; sessionLanguages: string[] }> => {
      return hydrateChatMessagesForViewer(
        supabase,
        args.sessionId,
        args.viewerLanguage,
        { latestLanguagesRef: args.latestLanguagesRef }
      );
    },
    []
  );

  return { handleSendMessage, hydrateViewerMessages };
}
