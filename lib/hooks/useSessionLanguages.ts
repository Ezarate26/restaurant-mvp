'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchActiveSessionLanguages } from '@/lib/model/session-languages.repository';

/**
 * Idiomas activos de la sesión: solo `session_users` (`is_active`, idioma no nulo).
 */
export function useSessionLanguages(sessionId: string | null) {
  const [languages, setLanguages] = useState<string[]>([]);
  const channelIdRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );

  const refresh = useCallback(async (): Promise<string[]> => {
    const sid = sessionId?.trim() ?? '';
    if (!sid) {
      setLanguages([]);
      return [];
    }
    try {
      const uniq = await fetchActiveSessionLanguages(supabase, sid);
      setLanguages(uniq);
      return uniq;
    } catch {
      setLanguages([]);
      return [];
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const sid = sessionId?.trim() ?? '';
    if (!sid) return;

    const channel = supabase
      .channel(`session-languages:${sid}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_users',
          filter: `session_id=eq.${sid}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return {
    languages,
    refresh,
    /** Alias explícito tras cambios de participantes. */
    refetchSessionLanguages: refresh,
    setLanguages,
  };
}
