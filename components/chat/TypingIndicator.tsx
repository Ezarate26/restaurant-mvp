'use client';

type TypingIndicatorProps = {
  label: string;
};

export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex items-center gap-1 rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-[#E5E7EB]">
        <span className="text-xs font-medium text-[#6B7280]">{label}</span>
        <span className="flex items-center gap-0.5 pl-1" aria-hidden>
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#229ED9]" />
          <span className="typing-dot typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-[#229ED9]" />
          <span className="typing-dot typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-[#229ED9]" />
        </span>
      </div>
    </div>
  );
}
