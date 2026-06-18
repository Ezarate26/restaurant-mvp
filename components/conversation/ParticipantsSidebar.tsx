'use client';

import {
  languageDisplayName,
  normalizeLanguageCode,
} from '@/constants/languages';
import type { ConversationMember } from '@/lib/model/types';
import { ExpelMemberModal } from '@/components/conversation/ExpelMemberModal';
import { IconHitboxButton } from '@/components/ui/IconHitboxButton';
import { TapButton } from '@/components/ui/TapButton';
import { avatarColor, memberInitials } from '@/lib/utils/chat-avatar';
import { useEffect, useState } from 'react';

export type ParticipantsSidebarProps = {
  open: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentMemberId?: string | null;
  isOwner?: boolean;
  canManage?: boolean;
  expelBusy?: boolean;
  onExpelMember?: (memberId: string) => Promise<void>;
  embedded?: boolean;
};

export function ParticipantsSidebar({
  open,
  onClose,
  members,
  currentMemberId = null,
  isOwner = false,
  canManage = true,
  expelBusy = false,
  onExpelMember,
  embedded = false,
}: ParticipantsSidebarProps) {
  const [expelTarget, setExpelTarget] = useState<ConversationMember | null>(
    null
  );
  const active = members.filter((m) => !m.left_at);

  useEffect(() => {
    if (embedded || !open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [embedded, open, onClose]);

  const list = (
    <ul className="flex-1 overflow-y-auto p-2 app-scrollbar">
      {active.length === 0 ? (
        <li className="px-3 py-8 text-center text-sm text-[var(--app-muted)]">
          No hay participantes activos.
        </li>
      ) : (
        active.map((m) => {
          const isMe = currentMemberId != null && m.id === currentMemberId;
          const name = m.display_name?.trim() || 'Participante';
          const isTargetOwner = m.role === 'owner';
          const lang = m.preferred_language
            ? languageDisplayName(normalizeLanguageCode(m.preferred_language))
            : '—';
          const displayName = isMe ? 'Tú' : name;
          const canExpel =
            isOwner &&
            canManage &&
            !isMe &&
            !isTargetOwner &&
            Boolean(onExpelMember);

          return (
            <li
              key={m.id}
              className="app-hover group mb-0.5 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-[var(--app-panel-hover)]"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: avatarColor(m.id) }}
              >
                {memberInitials(name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                  {isTargetOwner ? '👑 ' : '👤 '}
                  {displayName}
                </p>
                <p className="truncate text-xs text-[var(--app-muted)]">
                  {lang}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--app-success)]">
                  🟢 En línea
                </p>
              </div>
              {canExpel ? (
                <TapButton
                  disabled={expelBusy}
                  onTap={() => setExpelTarget(m)}
                  className="app-hover min-h-[44px] shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-[var(--app-danger)] opacity-100 hover:bg-[var(--app-danger)]/10 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  Expulsar
                </TapButton>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );

  const modals = (
    <ExpelMemberModal
      open={Boolean(expelTarget)}
      busy={expelBusy}
      memberName={expelTarget?.display_name?.trim() || 'Participante'}
      onCancel={() => setExpelTarget(null)}
      onConfirm={async () => {
        if (!expelTarget || !onExpelMember) return;
        try {
          await onExpelMember(expelTarget.id);
          setExpelTarget(null);
        } catch {
          /* VM muestra error */
        }
      }}
    />
  );

  if (embedded) {
    return (
      <>
        {list}
        {modals}
      </>
    );
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar panel"
        onClick={() => onClose()}
        className="z-drawer-backdrop fixed inset-0 block w-full cursor-pointer bg-black/60 md:hidden"
      />
      <aside
        className="z-drawer-panel fixed inset-y-0 right-0 flex w-full max-w-[min(280px,88vw)] flex-col bg-[var(--app-sidebar)] shadow-2xl md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Participantes"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--app-text)]">
              Participantes
            </h2>
            <p className="text-xs text-[var(--app-muted)]">
              {active.length} en línea
            </p>
          </div>
          <IconHitboxButton
            aria-label="Cerrar"
            className="touch-target rounded-xl px-3 py-2 text-sm text-[var(--app-muted)]"
            onAction={onClose}
          >
            Cerrar
          </IconHitboxButton>
        </div>
        {list}
      </aside>
      {modals}
    </>
  );
}
