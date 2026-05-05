'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, SessionUser } from '@/lib/model/types';

function isMissingIsActiveColumn(msg: string): boolean {
  const m = (msg ?? '').toLowerCase();
  return m.includes('is_active') && (m.includes('column') || m.includes('schema'));
}

/**
 * Asegura que el usuario actual (mesero/owner) tenga un registro `session_users`
 * activo en la sesión. Esto permite vincular `messages.session_user_id` correctamente.
 */
export function useEnsureSessionUser() {
  return useCallback(
    async (args: {
      sessionId: string;
      userId: string;
      profile: Profile | null;
    }): Promise<SessionUser> => {
      const sessionId = args.sessionId?.trim();
      const userId = args.userId?.trim();
      if (!sessionId || !userId) {
        throw new Error('ensureSessionUser: missing sessionId/userId');
      }

      const tryFetch = async (withIsActive: boolean) => {
        const q = supabase
          .from('session_users')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_identifier', userId)
          .eq('status', 'active');
        return withIsActive ? q.eq('is_active', true).maybeSingle() : q.maybeSingle();
      };

      // 1) Buscar si ya existe
      let existing: SessionUser | null = null;
      {
        const { data, error } = await tryFetch(true);
        if (error) {
          if (!isMissingIsActiveColumn(error.message ?? '')) {
            console.error('ensureSessionUser:fetch', error);
            throw error;
          }
          const { data: data2, error: error2 } = await tryFetch(false);
          if (error2) {
            console.error('ensureSessionUser:fetch-fallback', error2);
            throw error2;
          }
          existing = (data2 as SessionUser) ?? null;
        } else {
          existing = (data as SessionUser) ?? null;
        }
      }
      if (existing) return existing;

      // 2) Crear si no existe
      const insertRow: Record<string, unknown> = {
        session_id: sessionId,
        user_identifier: userId,
        device_id: null,
        display_name: args.profile?.full_name ?? null,
        username: args.profile?.email ?? null,
        email: args.profile?.email ?? null,
        language: args.profile?.language ?? 'es',
        status: 'active',
        is_profile_completed: true,
        registration_invited: false,
        is_active: true,
      };

      const tryInsert = async (withIsActive: boolean) => {
        const payload = { ...insertRow };
        if (!withIsActive) delete payload.is_active;
        return supabase.from('session_users').insert([payload]).select('*').single();
      };

      const { data: created, error: insErr } = await tryInsert(true);
      if (insErr) {
        if (isMissingIsActiveColumn(insErr.message ?? '')) {
          const { data: created2, error: insErr2 } = await tryInsert(false);
          if (insErr2) {
            console.error('ensureSessionUser:insert-fallback', insErr2);
            throw insErr2;
          }
          return created2 as SessionUser;
        }
        if (insErr.code === '23505') {
          const { data: raced, error: raceErr } = await tryFetch(false);
          if (!raceErr && raced) return raced as SessionUser;
        }
        console.error('ensureSessionUser:insert', insErr);
        throw insErr;
      }

      return created as SessionUser;
    },
    []
  );
}

