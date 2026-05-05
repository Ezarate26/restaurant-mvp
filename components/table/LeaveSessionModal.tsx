'use client';

type LeaveSessionModalProps = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function LeaveSessionModal({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: LeaveSessionModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-chat-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
        <h2
          id="leave-chat-title"
          className="text-lg font-semibold text-[#1F2937]"
        >
          Cerrar sesión de la mesa
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
          Estás por cerrar la sesión de la mesa. Esto finalizará la conversación
          para todos los participantes.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy}
            className="rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:opacity-50"
          >
            {busy ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

