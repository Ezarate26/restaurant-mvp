'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppLanguage } from '@/lib/i18n/AppLanguageProvider';
import { getOrCreateCustomerIdentifier } from '@/lib/utils/customerIdentifier';

type DashboardStats = {
  tier: string;
  planLabel: string;
  hoursRemaining: string;
  chatsUsedToday: number;
  chatsLimitToday: number | null;
  timeAvailable: string;
};

type DashboardStatsCardsProps = {
  tier: string;
};

export function DashboardStatsCards({ tier }: DashboardStatsCardsProps) {
  const { t } = useAppLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) return;

        const deviceId = getOrCreateCustomerIdentifier();
        const qs = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
        const res = await fetch(`/api/user/dashboard-stats${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as DashboardStats;
        if (!cancelled) setStats(data);
      } catch (e) {
        console.error('DashboardStatsCards', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tier]);

  const formatHours = (value: string) => {
    if (value === 'unlimited') return t.home.stats.unlimited;
    if (value === 'per_room') return t.home.stats.perRoom;
    return value;
  };

  const formatTime = (value: string) => {
    if (value === 'unlimited') return t.home.stats.unlimited;
    if (value === 'room_pass') return t.home.stats.perRoom;
    return value;
  };

  const cards = [
    {
      label: t.home.stats.currentPlan,
      value: stats?.planLabel ?? (tier === 'pro' ? t.home.planPro : t.home.planFree),
    },
    {
      label: t.home.stats.hoursRemaining,
      value: loading
        ? '…'
        : stats
          ? formatHours(stats.hoursRemaining)
          : t.home.stats.notAvailable,
    },
    {
      label: t.home.stats.chatsToday,
      value: loading
        ? '…'
        : stats?.chatsLimitToday != null
          ? `${stats.chatsUsedToday} / ${stats.chatsLimitToday}`
          : t.home.stats.unlimited,
    },
    {
      label: t.home.stats.timeAvailable,
      value: loading
        ? '…'
        : stats
          ? formatTime(stats.timeAvailable)
          : t.home.stats.notAvailable,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 text-left shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] sm:text-xs">
            {card.label}
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-[var(--app-text)] sm:text-xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
