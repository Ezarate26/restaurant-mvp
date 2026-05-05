'use client';

import type { SessionUser } from '@/lib/model/types';
import { orderedSessionUsers } from '@/lib/utils/chat-peer-label';
import {
  sessionUserArrivalIndex,
  sessionUserDisplayLabel,
} from '@/lib/utils/session-user-display-name';

export interface SessionUsersListProps {
  sessionUsers: SessionUser[];
  /** Preferir id de `session_user` para marcar "Tú". */
  currentSessionUserId?: string | null;
  /** @deprecated usar currentSessionUserId */
  currentUserIdentifier?: string | null;
}

export function SessionUsersList({
  sessionUsers,
  currentSessionUserId = null,
  currentUserIdentifier = null,
}: SessionUsersListProps) {
  const orderedUsers = orderedSessionUsers(sessionUsers);
  const total = orderedUsers.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2 text-xs text-[#6B7280]">
        Aún no hay clientes en la sesión.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Clientes conectados
        </p>
        <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[10px] font-bold leading-none text-[#229ED9]">
          {total}
        </span>
      </div>

      <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {orderedUsers.map((u) => {
          const idx = sessionUserArrivalIndex(sessionUsers, u.id) ?? 1;
          const label = sessionUserDisplayLabel(u, idx);
          const isMe =
            (currentSessionUserId != null && u.id === currentSessionUserId) ||
            (currentUserIdentifier != null &&
              u.user_identifier === currentUserIdentifier);
          return (
            <li
              key={u.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isMe
                  ? 'bg-[#229ED9] text-white'
                  : 'bg-[#F4F6F8] text-[#1F2937]'
              }`}
            >
              {isMe ? 'Tú' : label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
