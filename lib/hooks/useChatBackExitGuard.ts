'use client';

import { useEffect, useRef } from 'react';

type UseChatBackExitGuardOptions = {
  enabled: boolean;
  onBackAttempt: () => void;
};

/**
 * Intercepta el gesto / botón «atrás» del navegador mientras el chat está activo.
 * Empuja un estado en el historial para que el primer «atrás» dispare el modal
 * en lugar de abandonar la sala sin cerrar la sesión del participante.
 */
export function useChatBackExitGuard({
  enabled,
  onBackAttempt,
}: UseChatBackExitGuardOptions) {
  const onBackAttemptRef = useRef(onBackAttempt);
  onBackAttemptRef.current = onBackAttempt;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const pushTrap = () => {
      window.history.pushState(
        { __chatExitGuard: true },
        '',
        window.location.href
      );
    };

    pushTrap();

    const onPopState = () => {
      pushTrap();
      onBackAttemptRef.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);
}
