'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeLanguageCode } from '@/constants/languages';

function isMissingIsActiveColumn(msg: string): boolean {
  const m = (msg ?? '').toLowerCase();
  return m.includes('is_active') && (m.includes('column') || m.includes('schema'));
}

export function useSessionLanguages(sessionId: string | null) {
  const [languages, setLanguages] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const sid = sessionId?.trim() ?? '';
    if (!sid) {
      setLanguages([]);
      return [];
    }

    const run = async (withIsActive: boolean) => {
      const q = supabase
        .from('session_users')
        .select('language')
        .eq('session_id', sid)
        .eq('status', 'active');
      return withIsActive ? q.eq('is_active', true) : q;
    };

    let data: { language: string | null }[] | null = null;
    try {
      const { data: d, error } = await run(true);
      if (error) throw error;
      data = (d as { language: string | null }[]) ?? [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (!isMissingIsActiveColumn(msg)) {
        console.error('useSessionLanguages:fetch', e);
        throw e;
      }
      const { data: d2, error: e2 } = await run(false);
      if (e2) {
        console.error('useSessionLanguages:fetch-fallback', e2);
        throw e2;
      }
      data = (d2 as { language: string | null }[]) ?? [];
    }

    const uniq = [
      ...new Set(
        (data ?? [])
          .map((u) => u.language)
          .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
          .map((x) => normalizeLanguageCode(x))
      ),
    ];
    setLanguages(uniq);
    return uniq;
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { languages, refresh, setLanguages };
}

