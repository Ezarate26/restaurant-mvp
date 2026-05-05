'use client';

type ChatComposerProps = {
  message: string;
  disabled?: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  message,
  disabled = false,
  onMessageChange,
  onSend,
}: ChatComposerProps) {
  return (
    <div className="shrink-0 border-t border-[#E5E7EB] bg-white p-3">
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35 disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
          placeholder="Escribe un mensaje…"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          aria-label="Mensaje"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="shrink-0 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

