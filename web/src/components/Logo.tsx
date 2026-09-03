export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Stubady logo"
      >
        <rect x="4" y="4" width="56" height="56" rx="14" fill="#1d4ed8" />
        <path
          d="M20 22.5c0-1.4 1.1-2.5 2.5-2.5H40a2.5 2.5 0 0 1 2.5 2.5v19a2.5 2.5 0 0 1-2.5 2.5H22.5A2.5 2.5 0 0 1 20 41.5v-19Z"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
        />
        <path
          d="M20 24h22.5"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M26 30.5h12M26 35.5h12M26 40.5h7"
          stroke="#bcd0fb"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[19px] font-bold tracking-tight text-ink">
        Stubady
      </span>
    </span>
  );
}
