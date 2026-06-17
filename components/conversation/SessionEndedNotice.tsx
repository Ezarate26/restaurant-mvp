'use client';

import { useEffect, useState } from 'react';
import { consumeSessionEndedByTime } from '@/lib/utils/session-ended-flash.storage';

const MESSAGE = 'La sesión de chat finalizó por el tiempo de la sala.';

type SessionEndedNoticeProps = {
  className?: string;
};

export function SessionEndedNotice({ className = '' }: SessionEndedNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consumeSessionEndedByTime()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`border-b border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--app-warning)] ${className}`}
    >
      {MESSAGE}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-3 text-xs underline opacity-80 hover:opacity-100"
      >
        Cerrar
      </button>
    </div>
  );
}
