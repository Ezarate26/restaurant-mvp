'use client';

import type { PendingTableRequestView as PendingTableRequest } from '@/lib/adapters/types';

export interface RequestCardProps {
  request: PendingTableRequest;
  tableLabel: string;
  onTakeTable: (tableId: string) => void;
}

export function RequestCard({
  request,
  tableLabel,
  onTakeTable,
}: RequestCardProps) {
  const count = request.request_count;
  const label =
    count === 1 ? '1 interacción del cliente' : `${count} interacciones del cliente`;

  return (
    <article className="relative rounded-xl border border-green-300 bg-green-50 p-4 pl-3 shadow-sm transition hover:border-green-400 hover:bg-green-100/90">
      <span
        className="absolute -right-1 -top-1 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-[#DC2626] px-2 text-xs font-bold text-white shadow-md ring-2 ring-white"
        aria-label={`${count} solicitudes para esta mesa`}
      >
        {count > 99 ? '99+' : count}
      </span>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-green-800">
        Mesa
      </p>
      <p className="font-mono text-sm font-semibold text-green-950">{tableLabel}</p>

      <p className="mt-2 text-xs font-medium text-green-900">{label}</p>

      <button
        type="button"
        onClick={() => onTakeTable(request.table_id)}
        className="mt-4 w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:brightness-95"
      >
        Tomar mesa
      </button>
    </article>
  );
}
