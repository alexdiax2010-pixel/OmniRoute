/** Sol brasa sobre el horizonte (decorativo). */
export function LogoSol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-sol-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a2a" />
          <stop offset="1" stopColor="#ff4a1c" />
        </linearGradient>
      </defs>
      <path d="M5 21a11 11 0 0 1 22 0z" fill="url(#logo-sol-g)" />
      <rect x="2" y="23" width="28" height="2.4" rx="1.2" fill="#f4f1ec" />
      <rect x="8" y="27.4" width="16" height="2" rx="1" fill="#f4f1ec" opacity="0.5" />
    </svg>
  );
}
