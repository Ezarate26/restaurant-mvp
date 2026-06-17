'use client';

import { useEffect, useState } from 'react';
import { ActivitySpinner } from '@/components/ui/ActivitySpinner';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type QRSharePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string | null;
  shareUrl: string | null;
  title: string;
};

export function QRSharePanel({
  open,
  onOpenChange,
  inviteCode,
  shareUrl,
  title,
}: QRSharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  const resolvedUrl =
    shareUrl ??
    (inviteCode && typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : null);

  const qrSrc = resolvedUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(resolvedUrl)}`
    : null;

  useEffect(() => {
    if (open) {
      setQrLoading(Boolean(qrSrc));
      setQrError(false);
      setCopied(false);
    }
  }, [open, qrSrc]);

  const handleCopy = async () => {
    if (!resolvedUrl) return;
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <ModalFrame open={open} labelledBy="qr-share-title" onClose={() => onOpenChange(false)}>
      <div className={uiModalPanel}>
        <h2 id="qr-share-title" className={uiModalTitle}>
          Compartir sala
        </h2>
        <p className={uiModalText}>{title}</p>

        {inviteCode ? (
          <p className="mt-4 text-center font-mono text-lg font-bold tracking-widest text-[var(--app-primary)]">
            {inviteCode}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col items-center gap-4">
          {qrSrc ? (
            <div className="relative grid h-[220px] w-[220px] place-items-center rounded-2xl bg-white p-3 ring-1 ring-[var(--app-border)]">
              {qrLoading ? (
                <ActivitySpinner className="absolute text-[var(--app-muted)]" />
              ) : null}
              {qrError ? (
                <p className="px-4 text-center text-xs text-[var(--app-muted)]">
                  No se pudo cargar el QR
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt={`Código QR para unirse a ${title}`}
                  width={200}
                  height={200}
                  className={qrLoading ? 'opacity-0' : 'opacity-100'}
                  onLoad={() => setQrLoading(false)}
                  onError={() => {
                    setQrLoading(false);
                    setQrError(true);
                  }}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--app-muted)]">Sin código de invitación</p>
          )}

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!resolvedUrl}
              className={uiBtnSecondary}
            >
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={uiBtnPrimary}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
