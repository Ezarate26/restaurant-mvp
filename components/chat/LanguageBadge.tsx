import { normalizeLanguageCode } from '@/constants/languages';

type LanguageBadgeProps = {
  languageCode: string | null | undefined;
  className?: string;
};

export function LanguageBadge({ languageCode, className = '' }: LanguageBadgeProps) {
  const code = languageCode?.trim()
    ? normalizeLanguageCode(languageCode).toUpperCase()
    : null;
  if (!code) return null;

  return (
    <span
      className={`badge-lang inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${className}`}
      title={`Idioma original: ${code}`}
    >
      {code}
    </span>
  );
}
