'use client';

import type { SessionUser } from '@/lib/model/types';

export interface SessionUsersListProps {
  sessionUsers: SessionUser[];
  /** Identificador del cliente actual para resaltar "Tú". */
  currentUserIdentifier?: string | null;
}

function shortLabel(u: SessionUser, idx: number): string {
  const id = u.user_identifier ?? '';
  if (id.length > 0) {
    const tail = id.slice(-4).toUpperCase();
    return `Cliente ${tail}`;
  }
  return `Cliente ${idx + 1}`;
}

export function SessionUsersList({
  sessionUsers,
  currentUserIdentifier,
}: SessionUsersListProps) {
  const total = sessionUsers.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2 text-xs text-[#6B7280]">
        Aún no hay clientes en la sesión.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Clientes conectados
        </p>
        <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[10px] font-bold text-[#229ED9]">
          {total}
        </span>
      </div>

      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {sessionUsers.map((u, i) => {
          const isMe =
            currentUserIdentifier != null &&
            u.user_identifier === currentUserIdentifier;
          return (
            <li
              key={u.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isMe
                  ? 'bg-[#229ED9] text-white'
                  : 'bg-[#F4F6F8] text-[#1F2937]'
              }`}
            >
              {isMe ? 'Tú' : shortLabel(u, i)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
