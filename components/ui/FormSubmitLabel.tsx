'use client';

type FormSubmitLabelProps = {
  /** Opcional: id del botón submit */
  id?: string;
  label: string;
  busy?: boolean;
  busyLabel?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Envío de formulario con botón submit nativo (fiable en Android/iOS).
 */
export function FormSubmitLabel({
  id,
  label,
  busy = false,
  busyLabel,
  className = '',
  disabled = false,
}: FormSubmitLabelProps) {
  const text = busy ? (busyLabel ?? label) : label;

  return (
    <button
      type="submit"
      id={id}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      className={className}
    >
      {text}
    </button>
  );
}
