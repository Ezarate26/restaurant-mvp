'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  Message,
  Profile,
  Restaurant,
  ServicePoint,
  ServiceRequest,
  ServiceSession,
  SessionUser,
} from '@/lib/model/types';
import { isPresentSessionUser } from '@/lib/utils/session-user-presence';
import { OwnerRestaurantSummary } from './OwnerRestaurantSummary';
import { ServicePointQRCard } from './ServicePointQRCard';
import { ActiveSessionList } from './ActiveSessionList';

export interface OwnerDashboardViewProps {
  user: User | null;
  restaurant: Restaurant | null;
  servicePoints: ServicePoint[];
  sessions: ServiceSession[];
  /** Sesiones activas visibles (con clientes presentes o solicitud pendiente). */
  dashboardSessions: ServiceSession[];
  serviceRequests: ServiceRequest[];
  sessionUsers: SessionUser[];
  sessionUsersBySession: Record<string, SessionUser[]>;
  pendingBySession: Record<string, number>;
  profilesById: Map<string, Profile>;
  pointsById: Map<string, ServicePoint>;
  lastMessageBySession: Record<string, Message | null>;
  onLogout: () => void;
}

function usersForPoint(
  pointId: string,
  sessions: ServiceSession[],
  sessionUsers: SessionUser[]
): SessionUser[] {
  const sid = new Set(
    sessions
      .filter((s) => s.service_point_id === pointId)
      .map((s) => s.id)
  );
  return sessionUsers.filter(
    (u) => sid.has(u.session_id) && isPresentSessionUser(u)
  );
}

export function OwnerDashboardView({
  user,
  restaurant,
  servicePoints,
  sessions,
  dashboardSessions,
  serviceRequests,
  sessionUsers,
  sessionUsersBySession,
  pendingBySession,
  profilesById,
  pointsById,
  lastMessageBySession,
  onLogout,
}: OwnerDashboardViewProps) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  const dashboardSessionIds = useMemo(
    () => new Set(dashboardSessions.map((s) => s.id)),
    [dashboardSessions]
  );

  const pendingRequestsForActiveSessions = useMemo(
    () =>
      serviceRequests.filter(
        (r) =>
          r.service_session_id != null &&
          dashboardSessionIds.has(r.service_session_id as string)
      ),
    [serviceRequests, dashboardSessionIds]
  );

  const monitoring = useMemo(() => {
    const pool = dashboardSessions;
    const inService = pool.filter((s) => Boolean(s.assigned_to));
    const waiting = pool.filter(
      (s) =>
        !s.assigned_to &&
        ((sessionUsersBySession[s.id]?.length ?? 0) > 0 ||
          (pendingBySession[s.id] ?? 0) > 0)
    );
    return { inService, waiting };
  }, [dashboardSessions, sessionUsersBySession, pendingBySession]);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1F2937]">
              Panel del propietario
            </p>
            <p className="truncate text-xs text-[#6B7280]">
              {user?.email ?? ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-[#229ED9] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <OwnerRestaurantSummary restaurant={restaurant} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
            Puntos de servicio
          </h2>
          <div className="space-y-3">
            {servicePoints.length === 0 ? (
              <p className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280] shadow-sm">
                No hay puntos de servicio activos.
              </p>
            ) : (
              servicePoints.map((p) => (
                <ServicePointQRCard
                  key={p.id}
                  point={p}
                  sessions={sessions}
                  usersForPoint={usersForPoint(p.id, sessions, sessionUsers)}
                  origin={origin || 'http://localhost:3000'}
                />
              ))
            )}
          </div>
        </section>

        <ActiveSessionList
          sessions={dashboardSessions}
          pointsById={pointsById}
          profilesById={profilesById}
          sessionUsersBySession={sessionUsersBySession}
          lastMessageBySession={lastMessageBySession}
          pendingBySession={pendingBySession}
        />

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
            Monitoreo (solo lectura)
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[#374151]">
            <li>
              <span className="font-semibold text-[#1F2937]">
                {monitoring.inService.length}
              </span>{' '}
              sesión(es) con mesero asignado (en atención).
            </li>
            <li>
              <span className="font-semibold text-amber-800">
                {monitoring.waiting.length}
              </span>{' '}
              sesión(es) en espera de mesero (con clientes o solicitud).
            </li>
            <li>
              Solicitudes pendientes (sesiones activas):{' '}
              <span className="font-semibold text-[#1F2937]">
                {pendingRequestsForActiveSessions.length}
              </span>
            </li>
          </ul>
          {monitoring.inService.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#EEF0F3] bg-[#FAFBFC] p-3">
              <p className="text-[11px] font-semibold uppercase text-[#9CA3AF]">
                En atención ahora
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {monitoring.inService.map((s) => {
                  const w = s.assigned_to
                    ? profilesById.get(s.assigned_to)
                    : null;
                  const pt = s.service_point_id
                    ? pointsById.get(s.service_point_id)
                    : null;
                  return (
                    <li key={s.id} className="text-[#374151]">
                      <span className="font-medium">{pt?.name ?? 'Punto'}</span>
                      {' · '}
                      {w?.full_name ?? w?.email ?? s.assigned_to}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
