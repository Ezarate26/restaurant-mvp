import type { ConversationMember } from '@/lib/model/types';
import { avatarColor, memberInitials } from '@/lib/utils/chat-avatar';

type ParticipantAvatarStackProps = {
  members: ConversationMember[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
};

export function ParticipantAvatarStack({
  members,
  maxVisible = 3,
  size = 'sm',
  className = '',
}: ParticipantAvatarStackProps) {
  const active = members.filter((m) => !m.left_at);
  const visible = active.slice(0, maxVisible);
  const extra = active.length - maxVisible;

  const dim = size === 'md' ? 'h-8 w-8 text-[11px]' : 'h-7 w-7 text-[10px]';

  if (active.length === 0) return null;

  return (
    <div className={`flex items-center ${className}`} aria-hidden>
      {visible.map((m, i) => {
        const name = m.display_name?.trim() || 'Participante';
        return (
          <div
            key={m.id}
            title={name}
            className={`${dim} relative flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--app-sidebar)] font-bold text-white`}
            style={{
              backgroundColor: avatarColor(m.id),
              marginLeft: i > 0 ? -10 : 0,
              zIndex: visible.length - i,
            }}
          >
            {memberInitials(name)}
          </div>
        );
      })}
      {extra > 0 ? (
        <span
          className="relative z-0 ml-1.5 text-xs font-semibold text-[var(--app-muted)]"
          title={`${extra} más`}
        >
          …
        </span>
      ) : null}
    </div>
  );
}
