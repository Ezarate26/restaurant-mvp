'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  fetchMessagesByTableId,
  fetchRequestSourceMessagesByRestaurantId,
  insertMessage,
} from '@/lib/model/messages.repository';
import {
  assignTableToWaiter,
  fetchTablesByRestaurant,
} from '@/lib/model/tables.repository';
import { fetchProfileByUserId } from '@/lib/model/profiles.repository';
import { REALTIME_CHANNEL_RESTAURANT } from '@/lib/model/realtime.constants';
import type {
  Message,
  PendingTableRequest,
  Profile,
  Table,
} from '@/lib/model/types';

export function useWaiterDashboardViewModel() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [tables, setTables] = useState<Table[]>([]);
  const tablesSnapshotRef = useRef<Table[]>([]);
  const [requestSourceMessages, setRequestSourceMessages] = useState<Message[]>(
    []
  );

  const [activeTable, setActiveTable] = useState<string | null>(null);
  const activeTableRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    activeTableRef.current = activeTable;
  }, [activeTable]);

  useEffect(() => {
    tablesSnapshotRef.current = tables;
  }, [tables]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push('/login');
        return;
      }

      if (cancelled) return;
      setUser(auth.user);

      const prof = await fetchProfileByUserId(supabase, auth.user.id);
      if (!prof) return;

      if (cancelled) return;
      setProfile(prof);

      const [tbls, reqs] = await Promise.all([
        fetchTablesByRestaurant(supabase, prof.restaurant_id),
        fetchRequestSourceMessagesByRestaurantId(
          supabase,
          prof.restaurant_id
        ),
      ]);

      if (cancelled) return;
      setTables(tbls);
      setRequestSourceMessages(reqs);
    };

    void init();

    const channel = supabase
      .channel(REALTIME_CHANNEL_RESTAURANT)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          const row = payload.new as Table | undefined;
          if (!row?.id) return;

          setTables((prev) => {
            const idx = prev.findIndex((t) => t.id === row.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...row };
              return copy;
            }
            return [row, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          const isActiveConversation = msg.table_id === activeTableRef.current;

          if (isActiveConversation) {
            setMessages((prev) => [...prev, msg]);
            setUnread((prev) => ({
              ...prev,
              [msg.table_id]: 0,
            }));
            return;
          }

          if (msg.sender === 'waiter') return;

          setUnread((prev) => ({
            ...prev,
            [msg.table_id]: (prev[msg.table_id] || 0) + 1,
          }));

          const tbl = tablesSnapshotRef.current.find(
            (t) => t.id === msg.table_id
          );
          if (
            (msg.sender === 'customer' || msg.sender === 'system') &&
            !tbl?.assigned_to
          ) {
            setRequestSourceMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  const openChat = useCallback(async (tableId: string) => {
    activeTableRef.current = tableId;
    setActiveTable(tableId);

    setUnread((prev) => ({
      ...prev,
      [tableId]: 0,
    }));

    const data = await fetchMessagesByTableId(supabase, tableId);
    if (activeTableRef.current !== tableId) return;
    setMessages(data);
  }, []);

  const takeTable = useCallback(
    async (tableId: string) => {
      if (!profile || !user) return;

      await assignTableToWaiter(supabase, {
        tableId,
        userId: user.id,
        fullName: profile.full_name,
      });

      await openChat(tableId);
    },
    [profile, user, openChat]
  );

  const sendMessage = useCallback(async () => {
    if (!activeTable || !text.trim() || !profile) return;

    await insertMessage(supabase, {
      table_id: activeTable,
      restaurant_id: profile.restaurant_id,
      sender: 'waiter',
      text,
    });

    setText('');
  }, [activeTable, text, profile]);

  /** Una card por mesa sin asignar; contador = interacciones cliente + llamada mesero. */
  const pendingRequests = useMemo((): PendingTableRequest[] => {
    const unassignedIds = new Set(
      tables.filter((t) => !t.assigned_to).map((t) => t.id)
    );

    const agg = new Map<string, { count: number; oldest: string }>();

    for (const m of requestSourceMessages) {
      if (m.sender !== 'customer' && m.sender !== 'system') continue;
      if (!unassignedIds.has(m.table_id)) continue;

      const created = m.created_at ?? '';
      const cur = agg.get(m.table_id);
      if (!cur) {
        agg.set(m.table_id, { count: 1, oldest: created });
      } else {
        cur.count += 1;
        if (created && (!cur.oldest || created < cur.oldest)) {
          cur.oldest = created;
        }
      }
    }

    return Array.from(agg.entries())
      .map(([table_id, v]) => ({
        table_id,
        request_count: v.count,
        created_at: v.oldest || new Date(0).toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }, [requestSourceMessages, tables]);

  return {
    user,
    profile,
    tables,
    pendingRequests,
    activeTable,
    messages,
    text,
    setText,
    unread,
    handleLogout,
    takeTable,
    openChat,
    sendMessage,
  };
}
