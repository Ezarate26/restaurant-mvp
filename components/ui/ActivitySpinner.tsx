type ActivitySpinnerProps = {
  className?: string;
  label?: string;
};

export function ActivitySpinner({
  className = 'h-8 w-8',
  label = 'Cargando…',
}: ActivitySpinnerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className={`inline-block animate-spin rounded-full border-2 border-[var(--app-primary)] border-t-transparent ${className}`}
        aria-hidden
      />
      <span className="text-xs text-[var(--app-muted)]">{label}</span>
    </div>
  );
}
