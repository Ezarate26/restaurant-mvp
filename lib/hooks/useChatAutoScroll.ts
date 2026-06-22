'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Message } from '@/lib/model/types';

/** Distancia al fondo (px) para considerar que el usuario sigue la conversación. */
const NEAR_BOTTOM_PX = 96;

function isNearBottom(el: HTMLDivElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
}

function isOptimisticMessage(message: Message | undefined): boolean {
  return Boolean(message?.id.startsWith('optimistic-'));
}

/**
 * Autoscroll del chat — un solo punto de control.
 * Desplaza al fondo solo al enviar (optimistic) o al recibir mensajes estando cerca del final.
 */
export function useChatAutoScroll(messages: Message[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const prevTailIdRef = useRef<string | null>(null);
  const didInitialScrollRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    nearBottomRef.current = isNearBottom(el);
  }, []);

  useEffect(() => {
    const tail = messages[messages.length - 1];
    const tailId = tail?.id ?? null;

    if (!didInitialScrollRef.current && messages.length > 0) {
      didInitialScrollRef.current = true;
      prevTailIdRef.current = tailId;
      scrollToBottom('auto');
      nearBottomRef.current = true;
      return;
    }

    if (tailId === prevTailIdRef.current) return;
    prevTailIdRef.current = tailId;

    const shouldScroll =
      isOptimisticMessage(tail) || nearBottomRef.current;

    if (shouldScroll) {
      scrollToBottom('smooth');
      nearBottomRef.current = true;
    }
  }, [messages, scrollToBottom]);

  return { containerRef, handleScroll, scrollToBottom };
}
