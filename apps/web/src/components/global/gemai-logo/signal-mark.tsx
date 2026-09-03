interface SignalMarkProps {
  size?: number;
  className?: string;
  title?: string;
  idPrefix?: string;
}

/** Inline brand mark for Next.js ImageResponse routes. UI surfaces use /public/brand/gemai-mark.svg. */
export function SignalMark({ size = 32, className, title, idPrefix = "gemai-signal" }: SignalMarkProps) {
  const loop = `loop-${idPrefix}`;
  const message = `message-${idPrefix}`;
  const gem = `gem-${idPrefix}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={loop} x1="11" y1="13" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5267FF" />
          <stop offset="0.52" stopColor="#6E5CF6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={message} x1="22" y1="27" x2="57" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6576FF" />
          <stop offset="1" stopColor="#8B4FF2" />
        </linearGradient>
        <linearGradient id={gem} x1="45" y1="6" x2="56" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <path
        d="M44.2 14.7C40.8 11.1 36 9 30.7 9C18.7 9 9 18.7 9 30.7C9 42.7 18.7 52.4 30.7 52.4C38.7 52.4 45.7 48 49.5 41.5"
        stroke={`url(#${loop})`}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M29.8 25.8H48C52 25.8 55.2 28.8 55.2 32.5V38.5L59 43.5C59.7 44.5 58.8 45.7 57.7 45.3L49.5 42.3H29.8C24.5 42.3 20.3 38.7 20.3 34C20.3 29.4 24.5 25.8 29.8 25.8Z"
        fill={`url(#${message})`}
      />
      <path d="M30.5 34H43.2" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="48.5" cy="34" r="2.1" fill="white" />
      <path d="M50.2 5.2L56.2 11.1L50.2 17L44.2 11.1L50.2 5.2Z" fill={`url(#${gem})`} />
      <path d="M50.2 7.7L53.7 11.1L50.2 14.6L46.7 11.1L50.2 7.7Z" fill="white" fillOpacity="0.32" />
    </svg>
  );
}
