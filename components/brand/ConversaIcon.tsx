import { CONVERSA_APP_NAME, CONVERSA_ICON_SRC } from '@/lib/brand/constants';

type ConversaIconProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function ConversaIcon({
  size = 32,
  className = '',
  alt = CONVERSA_APP_NAME,
}: ConversaIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CONVERSA_ICON_SRC}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      draggable={false}
    />
  );
}
