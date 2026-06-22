'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { uiBtnPrimary, uiInput } from '@/components/ui/ui-classes';

export type HistoryItem = {
  conversationId: string;
  roomName: string;
  inviteCode: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  languages: string[];
  participantCount: number;
  durationMs: number;
  lastActivityAt: string | null;
  memberId: string;
};

type ConversationHistorySectionProps = {
  isPro: boolean;
};

function formatDuration(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60_000));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ConversationHistorySection({ isPro }: ConversationHistorySectionProps) {
  const router = useRouter();
  const { t } = useAppLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(isPro);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [proBlocked, setProBlocked] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isPro) return;
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/conversations/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.status === 403) {
        setProBlocked(true);
        setItems([]);
        return;
      }

      if (!res.ok) return;
      const data = (await res.json()) as { items: HistoryItem[] };
      setItems(data.items ?? []);
      setProBlocked(false);
    } catch (e) {
      console.error('ConversationHistorySection', e);
    } finally {
      setLoading(false);
    }
  }, [isPro, search, from, to]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => items, [items]);

  if (!isPro || proBlocked) {
    return (
      <section className="w-full max-w-4xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 text-center">
        <h2 className="text-lg font-bold">{t.history.title}</h2>
        <p className="mt-3 text-sm text-[var(--app-muted)]">{t.history.proOnly}</p>
        <Link href="/app/billing" className={`${uiBtnPrimary} mt-5 inline-flex`}>
          {t.history.upgradeCta}
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-4xl">
      <h2 className="text-lg font-bold sm:text-xl">{t.history.title}</h2>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.history.searchPlaceholder}
          className={`${uiInput} min-w-0 flex-1`}
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label={t.history.filterFrom}
          className={`${uiInput} sm:w-auto`}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label={t.history.filterTo}
          className={`${uiInput} sm:w-auto`}
        />
      </div>

      {loading ? (
        <p className="mt-6 text-center text-sm text-[var(--app-muted)]">
          {t.history.loading}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--app-muted)]">
          {t.history.empty}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--app-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--app-border)] bg-[var(--app-sidebar)] text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              <tr>
                <th className="px-4 py-3">{t.history.roomName}</th>
                <th className="px-4 py-3">{t.history.date}</th>
                <th className="px-4 py-3">{t.history.languages}</th>
                <th className="px-4 py-3">{t.history.duration}</th>
                <th className="px-4 py-3">{t.history.participants}</th>
                <th className="px-4 py-3">{t.history.lastActivity}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)] bg-[var(--app-card)]">
              {filtered.map((item) => {
                const isActive = item.status === 'active';
                return (
                  <tr key={item.conversationId} className="hover:bg-[var(--app-hover-bg)]">
                    <td className="px-4 py-3 font-medium">
                      {item.roomName}
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--app-muted)]">
                        {item.inviteCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {item.languages.length > 0
                        ? item.languages.join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{formatDuration(item.durationMs)}</td>
                    <td className="px-4 py-3">{item.participantCount}</td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">
                      {item.lastActivityAt
                        ? formatDate(item.lastActivityAt)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/c/${item.conversationId}?member=${encodeURIComponent(item.memberId)}`
                            )
                          }
                          className="rounded-lg bg-[var(--app-primary)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--app-primary)] hover:bg-[var(--app-primary)]/25"
                        >
                          {t.history.reopen}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--app-muted)]">
                          {t.history.closed}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
