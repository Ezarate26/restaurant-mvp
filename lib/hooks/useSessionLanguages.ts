'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeLanguageCode } from '@/constants/languages';

function isMissingIsActiveColumn(msg: string): boolean {
  const m = (msg ?? '').toLowerCase();
  return m.includes('is_active') && (m.includes('column') || m.includes('schema'));
}

async function fetchLanguagesForSession(sessionId: string): Promise<string[]> {
  const sid = sessionId.trim();

  const buildUsersQuery = (withIsActive: boolean) => {
    const q = supabase
      .from('session_users')
      .select('language')
      .eq('session_id', sid)
      .eq('status', 'active');
    return withIsActive ? q.eq('is_active', true) : q;
  };

  let customerLangRows: { language: string | null }[] = [];
  try {
    const { data: d, error } = await buildUsersQuery(true);
    if (error) throw error;
    customerLangRows = (d as { language: string | null }[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (!isMissingIsActiveColumn(msg)) {
      console.error('useSessionLanguages:session_users', e);
      throw e;
    }
    const { data: d2, error: e2 } = await buildUsersQuery(false);
    if (e2) {
      console.error('useSessionLanguages:session_users-fallback', e2);
      throw e2;
    }
    customerLangRows = (d2 as { language: string | null }[]) ?? [];
  }

  const { data: sessionRow, error: sessErr } = await supabase
    .from('service_sessions')
    .select('assigned_to')
    .eq('id', sid)
    .maybeSingle();

  if (sessErr) {
    console.error('useSessionLanguages:service_sessions', sessErr);
  }

  const languages = new Set<string>();
  for (const u of customerLangRows) {
    if (u.language?.trim()) {
      languages.add(normalizeLanguageCode(u.language));
    }
  }

  const assignedTo = sessionRow?.assigned_to?.trim();
  if (assignedTo) {
    const { data: waiterProfile, error: profErr } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', assignedTo)
      .maybeSingle();

    if (profErr) {
      console.error('useSessionLanguages:profiles', profErr);
    } else if (waiterProfile?.language?.trim()) {
      languages.add(normalizeLanguageCode(waiterProfile.language));
    }
  }

  return [...languages];
}

/**
 * Idiomas activos de la sesión: participantes (`session_users`) + idioma del mesero
 * asignado (`service_sessions.assigned_to` → `profiles.language`).
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
      const uniq = await fetchLanguagesForSession(sid);
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
          event: 'UPDATE',
          schema: 'public',
          table: 'service_sessions',
          filter: `id=eq.${sid}`,
        },
        () => {
          void refresh();
        }
      )
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
    /** Alias explícito para tras `assigned_to` / tomar mesa. */
    refetchSessionLanguages: refresh,
    setLanguages,
  };
}
