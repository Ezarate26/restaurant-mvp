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
  profileDisplayName?: string;
  profileUsername?: string;
  profileEmail?: string;
  onProfileDisplayNameChange?: (value: string) => void;
  onProfileUsernameChange?: (value: string) => void;
  onProfileEmailChange?: (value: string) => void;
  profileNotice?: string | null;
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
  profileDisplayName = '',
  profileUsername = '',
  profileEmail = '',
  onProfileDisplayNameChange,
  onProfileUsernameChange,
  onProfileEmailChange,
  profileNotice = null,
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

          <section className="mt-5 rounded-2xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-4">
            <h2 className="text-sm font-semibold text-[#1F2937]">
              Mejora tu experiencia (opcional)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              Puedes continuar sin llenar esto, pero te ayudaremos mejor si lo haces 😉
            </p>
            <div className="mt-3 grid gap-3.5">
              <div>
                <label
                  htmlFor="profile-display-name"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  ¿Cómo te llamas o cómo te gustaría que te llamemos?
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={profileDisplayName}
                  onChange={(e) => onProfileDisplayNameChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Nombre: ej. María González"
                  aria-label="Nombre"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  ¿Tienes un alias?
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={profileUsername}
                  onChange={(e) => onProfileUsernameChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Usuario: ej. juan123"
                  aria-label="Usuario o alias"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-1 block text-xs font-medium leading-snug text-[#374151]"
                >
                  Tu correo para recordarte en tus futuras visitas (opcional)
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => onProfileEmailChange?.(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35"
                  placeholder="Email: ej. maria@correo.com"
                  aria-label="Correo electrónico"
                />
              </div>
            </div>
            {profileNotice ? (
              <p className="mt-2 text-xs text-amber-700">{profileNotice}</p>
            ) : null}
          </section>

          <button
            type="button"
            disabled={!canSubmit || isConfirming}
            onClick={onOrderNow}
            className="mt-8 w-full rounded-xl bg-[#229ED9] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? 'Abriendo chat…' : 'Continuar'}
          </button>

          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            Tu mesa o punto ya está asignado por el código QR.
          </p>
        </div>
      </div>
    </div>
  );
}
