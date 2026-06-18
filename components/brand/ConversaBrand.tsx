import Link from 'next/link';
import { CONVERSA_APP_NAME } from '@/lib/brand/constants';
import { ConversaIcon } from '@/components/brand/ConversaIcon';

type ConversaBrandProps = {
  href?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string | null;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
};

export function ConversaBrand({
  href,
  size = 32,
  showText = true,
  subtitle,
  className = '',
  iconClassName = 'rounded-xl',
  onClick,
}: ConversaBrandProps) {
  const content = (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <ConversaIcon size={size} className={iconClassName} />
      {showText ? (
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight text-[var(--app-text)] sm:text-sm sm:truncate">
            {CONVERSA_APP_NAME}
          </p>
          {subtitle ? (
            <p className="text-[11px] leading-snug text-[var(--app-muted)] sm:truncate sm:text-[10px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="app-hover inline-flex min-w-0 hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="app-hover inline-flex min-w-0 text-left hover:opacity-90"
      >
        {content}
      </button>
    );
  }

  return content;
}
