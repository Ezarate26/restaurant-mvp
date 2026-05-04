'use client';

import type {
  Message,
  Profile,
  ServicePoint,
  ServiceSession,
  SessionUser,
} from '@/lib/model/types';

export interface ActiveSessionListProps {
  sessions: ServiceSession[];
  pointsById: Map<string, ServicePoint>;
  profilesById: Map<string, Profile>;
  sessionUsersBySession: Record<string, SessionUser[]>;
  lastMessageBySession: Record<string, Message | null>;
  pendingBySession: Record<string, number>;
}

function chatStatusLabel(args: {
  session: ServiceSession;
  last: Message | null;
  pending: number;
}): string {
  if (args.pending > 0) return 'Solicitud pendiente';
  if (args.last?.sender === 'waiter') return 'Último: mesero';
  if (args.last?.sender === 'customer') return 'Último: cliente';
  if (args.last?.sender === 'system') return 'Último: sistema';
  if (args.last) return 'Hay mensajes';
  return 'Sin mensajes aún';
}

function fmtIso(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ActiveSessionList({
  sessions,
  pointsById,
  profilesById,
  sessionUsersBySession,
  lastMessageBySession,
  pendingBySession,
}: ActiveSessionListProps) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
          Sesiones activas
        </h2>
        <p className="mt-3 text-sm text-[#6B7280]">No hay sesiones activas.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
        Sesiones activas
      </h2>
      <ul className="mt-4 space-y-3">
        {sessions.map((s) => {
          const point = s.service_point_id
            ? pointsById.get(s.service_point_id)
            : null;
          const users = sessionUsersBySession[s.id] ?? [];
          const last = lastMessageBySession[s.id] ?? null;
          const pending = pendingBySession[s.id] ?? 0;
          const waiter = s.assigned_to
            ? profilesById.get(s.assigned_to)
            : null;

          return (
            <li
              key={s.id}
              className="rounded-xl border border-[#EEF0F3] bg-[#FAFBFC] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-semibold text-[#9CA3AF]">
                    session_id
                  </p>
                  <p className="break-all font-mono text-xs text-[#1F2937]">{s.id}</p>
                </div>
                <span className="rounded-full bg-[#E8F7FD] px-2 py-0.5 text-[10px] font-bold uppercase text-[#229ED9]">
                  {s.status}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-[#9CA3AF]">Punto</dt>
                  <dd className="font-medium text-[#374151]">
                    {point?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Idioma</dt>
                  <dd className="text-[#374151]">{s.language ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Usuarios conectados</dt>
                  <dd className="font-semibold text-[#1F2937]">{users.length}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Mesero asignado</dt>
                  <dd className="text-[#374151]">
                    {waiter?.full_name ?? waiter?.email ?? '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#9CA3AF]">Estado del chat</dt>
                  <dd className="text-[#374151]">
                    {chatStatusLabel({ session: s, last, pending })}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#9CA3AF]">Actividad reciente</dt>
                  <dd className="text-[#374151]">
                    {fmtIso(s.last_activity_at ?? s.started_at ?? s.created_at)}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
