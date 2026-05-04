'use client';

import type { ServicePoint } from '@/lib/model/types';
import type { ServiceSession } from '@/lib/model/types';
import type { SessionUser } from '@/lib/model/types';

export type PointOperationalStatus = 'idle' | 'waiting' | 'in_service';

function resolvePointStatus(args: {
  point: ServicePoint;
  sessions: ServiceSession[];
}): PointOperationalStatus {
  const sid = args.point.id;
  const active = args.sessions.filter((s) => s.service_point_id === sid);
  if (active.length === 0) return 'idle';
  const anyAssigned = active.some((s) => Boolean(s.assigned_to));
  if (anyAssigned) return 'in_service';
  return 'waiting';
}

function statusLabel(s: PointOperationalStatus): string {
  switch (s) {
    case 'idle':
      return 'Listo';
    case 'waiting':
      return 'En espera';
    case 'in_service':
      return 'En uso';
  }
}

function statusClass(s: PointOperationalStatus): string {
  switch (s) {
    case 'idle':
      return 'bg-[#E8F7FD] text-[#229ED9]';
    case 'waiting':
      return 'bg-amber-50 text-amber-800';
    case 'in_service':
      return 'bg-green-50 text-green-800';
  }
}

export interface ServicePointQRCardProps {
  point: ServicePoint;
  sessions: ServiceSession[];
  usersForPoint: SessionUser[];
  origin: string;
}

export function ServicePointQRCard({
  point,
  sessions,
  usersForPoint,
  origin,
}: ServicePointQRCardProps) {
  const code = (point.qr_code?.trim() || point.id) as string;
  const url = `${origin}/qr/${encodeURIComponent(code)}`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    url
  )}`;
  const op = resolvePointStatus({ point, sessions });
  const activeFlag = point.is_active;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:flex-row sm:items-stretch sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-[#1F2937]">
            {point.name ?? 'Punto'}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              activeFlag ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {activeFlag ? 'Activo' : 'Inactivo'}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(
              op
            )}`}
          >
            {statusLabel(op)}
          </span>
        </div>
        <p className="break-all font-mono text-xs text-[#6B7280]">{code}</p>
        <p className="text-xs text-[#6B7280]">
          Usuarios conectados en este punto:{' '}
          <span className="font-semibold text-[#1F2937]">
            {usersForPoint.length}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 sm:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImg}
          alt=""
          width={120}
          height={120}
          className="rounded-lg border border-[#E5E7EB] bg-white"
        />
        <span className="max-w-[140px] truncate text-[10px] text-[#9CA3AF]">
          Escanear abre el chat
        </span>
      </div>
    </article>
  );
}
