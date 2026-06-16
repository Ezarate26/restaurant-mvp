'use client';

import type { ReactNode } from 'react';

type ModalBackdropProps = {
  onClose?: () => void;
};

function ModalBackdrop({ onClose }: ModalBackdropProps) {
  if (!onClose) {
    return (
      <div className="modal-overlay absolute inset-0 z-0" aria-hidden />
    );
  }

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Cerrar"
      className="modal-overlay absolute inset-0 z-0 block w-full cursor-pointer"
      onClick={() => onClose()}
    />
  );
}

type ModalFrameProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
  zClass?: string;
};

/**
 * Modal: contenedor pointer-events-none; solo backdrop y panel capturan toques.
 */
export function ModalFrame({
  open,
  onClose,
  children,
  labelledBy,
  className = '',
  zClass = 'z-modal',
}: ModalFrameProps) {
  if (!open) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 ${zClass} flex items-end justify-center p-3 sm:items-center sm:p-4 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="pointer-events-auto absolute inset-0">
        <ModalBackdrop onClose={onClose} />
      </div>
      <div className="pointer-events-auto relative z-10 w-full min-w-0 max-w-md">
        {children}
      </div>
    </div>
  );
}
