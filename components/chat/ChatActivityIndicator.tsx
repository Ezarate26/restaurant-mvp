'use client';

type ChatActivityIndicatorProps = {
  label: string;
  variant?: 'typing' | 'recording' | 'processing';
};

export function ChatActivityIndicator({
  label,
  variant = 'typing',
}: ChatActivityIndicatorProps) {
  return (
    <div className="flex items-center gap-2 border-t border-[var(--app-border)] bg-[var(--app-sidebar)] px-4 py-2">
      {variant === 'recording' ? (
        <span className="text-sm" aria-hidden>
          🎤
        </span>
      ) : null}
      <span className="text-xs font-medium text-[var(--app-muted)]">
        {label}
      </span>
      <span className="flex items-center gap-0.5" aria-hidden>
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--app-primary)]" />
        <span className="typing-dot typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />
        <span className="typing-dot typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />
      </span>
    </div>
  );
}
