'use client';

import type { Message } from '@/lib/model/types';

export interface RequestCardProps {
  request: Message;
  onTakeTable: (tableId: string) => void;
}

export function RequestCard({ request, onTakeTable }: RequestCardProps) {
  const isPriority =
    request.sender === 'system' || request.text.includes('🔔');

  return (
    <article className="relative rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4 shadow-sm transition hover:border-[#229ED9]/35 hover:bg-[#F4F6F8]">
      {isPriority && (
        <span
          className="absolute right-3 top-3 rounded-full bg-[#EF4444] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          title="Solicitud destacada"
        >
          Prioridad
        </span>
      )}

      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
        Mesa
      </p>
      <p className="font-mono text-sm font-semibold text-[#1F2937]">
        {request.table_id}
      </p>

      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#6B7280]">
        {request.text}
      </p>

      <button
        type="button"
        onClick={() => onTakeTable(request.table_id)}
        className="mt-4 w-full rounded-xl bg-[#229ED9] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c8ec6] active:brightness-95"
      >
        Tomar mesa
      </button>
    </article>
  );
}
