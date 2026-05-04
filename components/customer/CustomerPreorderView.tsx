'use client';

const chipBase =
  'rounded-xl border px-4 py-3 text-left text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[#229ED9]/40';

export interface CustomerPreorderViewProps {
  placeName: string;
  selectedLanguage: string | null;
  onSelectLanguage: (code: string) => void;
  onOrderNow: () => void;
  isConfirming: boolean;
  /** Deshabilita chips hasta tener session_user en DB */
  languageControlsDisabled?: boolean;
}

const LANGUAGES: { code: string; label: string; hint: string }[] = [
  { code: 'es', label: 'Español', hint: 'Mensajes y menú en español' },
  { code: 'en', label: 'English', hint: 'Messages and menu in English' },
  { code: 'pt', label: 'Português', hint: 'Mensagens em português' },
];

export function CustomerPreorderView({
  placeName,
  selectedLanguage,
  onSelectLanguage,
  onOrderNow,
  isConfirming,
  languageControlsDisabled,
}: CustomerPreorderViewProps) {
  const canSubmit = Boolean(selectedLanguage) && !languageControlsDisabled;

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ED9]/12 text-2xl"
              aria-hidden
            >
              🍽️
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
              {placeName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Elige tu idioma y entra al chat con el equipo del restaurante.
            </p>
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Idioma
          </p>
          <div className="grid gap-2" role="radiogroup" aria-label="Idioma">
            {LANGUAGES.map((lang) => {
              const selected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={languageControlsDisabled}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`${chipBase} ${
                    selected
                      ? 'border-[#229ED9] bg-[#E3F2FD] text-[#0D47A1]'
                      : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:border-[#CBD5E1]'
                  } ${languageControlsDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span className="block">{lang.label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-[#6B7280]">
                    {lang.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!canSubmit || isConfirming}
            onClick={onOrderNow}
            className="mt-8 w-full rounded-xl bg-[#229ED9] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? 'Abriendo chat…' : 'Ordenar ahora'}
          </button>

          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            Tu mesa o punto ya está asignado por el código QR.
          </p>
        </div>
      </div>
    </div>
  );
}
