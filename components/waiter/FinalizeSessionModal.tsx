'use client';

import type { SessionUser } from '@/lib/model/types';
import {
  sessionUserDisplayLabel,
  sortSessionUsersByJoinedAt,
} from '@/lib/utils/session-user-display';

export interface FinalizeSessionModalProps {
  open: boolean;
  tableName: string | null;
  sessionUsers: SessionUser[];
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function FinalizeSessionModal({
  open,
  tableName,
  sessionUsers,
  confirming,
  onCancel,
  onConfirm,
}: FinalizeSessionModalProps) {
  if (!open) return null;

  const ordered = sortSessionUsersByJoinedAt(sessionUsers);
  const tableLabel = tableName?.trim() || 'esta mesa';

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finalize-session-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
        <h2
          id="finalize-session-title"
          className="text-lg font-semibold text-[#1F2937]"
        >
          Finalizar conversación
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
          Estás por cerrar la conversación de la mesa{' '}
          <span className="font-semibold text-[#1F2937]">{tableLabel}</span>.
          Esto finalizará la atención y los clientes deberán iniciar una nueva
          sesión.
        </p>

        {ordered.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Usuarios en la mesa
            </p>
            <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-sm text-[#374151]">
              {ordered.map((u, i) => (
                <li key={u.id}>{sessionUserDisplayLabel(u, i + 1)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#6B7280]">No hay usuarios activos listados.</p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={confirming}
            className="rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:opacity-50"
          >
            {confirming ? 'Cerrando…' : 'Confirmar cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}
