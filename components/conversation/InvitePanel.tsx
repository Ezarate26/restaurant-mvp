'use client';

import { useEffect, useState } from 'react';
import { resolveJoinShareUrl } from '@/lib/brand/site-url';
import { ActivitySpinner } from '@/components/ui/ActivitySpinner';
import { ModalFrame } from '@/components/ui/ModalFrame';
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiModalPanel,
  uiModalText,
  uiModalTitle,
} from '@/components/ui/ui-classes';

type InvitePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string | null;
  shareUrl: string | null;
  title: string;
};

export function InvitePanel({
  open,
  onOpenChange,
  inviteCode,
  shareUrl,
  title,
}: InvitePanelProps) {
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  const resolvedShareUrl = resolveJoinShareUrl(inviteCode, shareUrl);

  const qrSrc = resolvedShareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resolvedShareUrl)}`
    : null;

  useEffect(() => {
    if (open) {
      setQrLoading(Boolean(qrSrc));
      setQrError(false);
      setCopied(false);
    }
  }, [open, qrSrc]);

  const handleCopy = async () => {
    const url = resolvedShareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <ModalFrame
      open={open}
      labelledBy="invite-title"
      onClose={() => onOpenChange(false)}
    >
      <div className={uiModalPanel}>
        <h2 id="invite-title" className={uiModalTitle}>
          Invitar con QR
        </h2>
        <p className={uiModalText}>
          Escanea el código o comparte el enlace para que otros se unan.
        </p>

        {inviteCode ? (
          <p className="invite-code-display mt-4 rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest">
            {inviteCode}
          </p>
        ) : null}

        {qrSrc ? (
          <div className="relative mt-4 flex min-h-[200px] items-center justify-center">
            {qrLoading ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <ActivitySpinner label="Generando QR…" />
              </div>
            ) : null}
            {qrError ? (
              <p className="text-center text-sm text-[var(--app-danger)]">
                No se pudo cargar el QR. Usa el código o comparte el enlace.
              </p>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrSrc}
                alt={`Código QR para unirse a ${title}`}
                width={200}
                height={200}
                className={`rounded-xl border border-[var(--modal-border)] transition-opacity duration-200 ${qrLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setQrLoading(false)}
                onError={() => {
                  setQrLoading(false);
                  setQrError(true);
                }}
              />
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className={uiBtnPrimary}
            onClick={() => onOpenChange(false)}
          >
            Listo
          </button>
          <button
            type="button"
            className={uiBtnSecondary}
            onClick={() => void handleCopy()}
          >
            {copied ? 'Enlace copiado' : 'Compartir enlace'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
