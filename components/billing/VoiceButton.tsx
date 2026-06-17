'use client';

import { TapButton } from '@/components/ui/TapButton';

type VoiceButtonProps = {
  allowed: boolean;
  disabled?: boolean;
  onStart: () => void;
  onUpgradeRequest?: () => void;
};

export function VoiceButton({
  allowed,
  disabled = false,
  onStart,
  onUpgradeRequest,
}: VoiceButtonProps) {
  if (!allowed) {
    return (
      <div className="group relative z-20 shrink-0 overflow-visible">
        <TapButton
          type="button"
          disabled
          aria-label="Voz disponible en Pro"
          title="La voz está disponible en Pro"
          className="app-touchable touch-target relative flex h-11 w-11 items-center justify-center rounded-full text-lg text-[var(--app-muted)] opacity-50"
        >
          🎤
        </TapButton>
        <button
          type="button"
          onClick={() => onUpgradeRequest?.()}
          className="absolute inset-0 z-10 cursor-pointer rounded-full"
          aria-label="Actualizar a Pro para hablar"
        />
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-[100] w-max max-w-[min(calc(100vw-2rem),16rem)] rounded-lg bg-[var(--app-card)] px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-[var(--app-text)] opacity-0 shadow-lg ring-1 ring-[var(--app-border)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:text-xs"
        >
          Voz disponible en Pro
        </span>
      </div>
    );
  }

  return (
    <TapButton
      onTap={onStart}
      disabled={disabled}
      aria-label="Grabar mensaje de voz"
      className="app-touchable touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-[var(--app-muted)] transition hover:text-[var(--app-primary)] disabled:opacity-40"
    >
      🎤
    </TapButton>
  );
}
