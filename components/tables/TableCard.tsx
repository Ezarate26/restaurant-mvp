'use client';

import type { TableView as Table } from '@/lib/adapters/table-view.types';

export interface TableCardProps {
  table: Table;
  currentUserId: string | undefined;
  unreadCount: number;
  isChatActive: boolean;
  onOpenChat: (tableId: string) => void;
}

export function TableCard({
  table,
  currentUserId,
  unreadCount,
  isChatActive,
  onOpenChat,
}: TableCardProps) {
  const assignedToMe = table.assigned_to === currentUserId;

  return (
    <div
      className={`relative rounded-xl border bg-[#FAFBFC] p-4 shadow-sm transition ${
        isChatActive
          ? 'border-[#229ED9] ring-1 ring-[#229ED9]/25'
          : 'border-[#E5E7EB] hover:border-[#229ED9]/30 hover:bg-[#F4F6F8]'
      }`}
    >
      {unreadCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white shadow-sm"
          aria-label={`${unreadCount} mensajes sin leer`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      <div className="min-w-0 pr-5">
        <p className="truncate font-semibold text-[#1F2937]">{table.name}</p>
        <p className="mt-0.5 text-xs capitalize text-[#6B7280]">{table.status}</p>
        {table.assigned_to_name && (
          <p className="mt-2 text-xs font-medium text-[#229ED9]">
            {table.assigned_to_name}
          </p>
        )}
      </div>

      {assignedToMe && (
        <button
          type="button"
          onClick={() => onOpenChat(table.id)}
          className="mt-3 w-full rounded-xl bg-[#E3F2FD] py-2 text-sm font-semibold text-[#229ED9] transition hover:bg-[#229ED9] hover:text-white"
        >
          Abrir chat
        </button>
      )}
    </div>
  );
}
