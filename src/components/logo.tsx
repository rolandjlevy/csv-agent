// The Statement Sorter mark: three category bars (cyan, deep teal, amber) on a
// white tile. The cyan and teal come from the site's own palette and the amber
// is the "needs a look" colour. The tile is white so the mark reads on the dark
// teal band.
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="40" height="40" rx="10" fill="#ffffff" />
      <rect x="9" y="10" width="22" height="5" rx="2.5" fill="#06b6d4" />
      <rect x="9" y="18" width="17" height="5" rx="2.5" fill="#0e7490" />
      <rect x="9" y="26" width="12" height="5" rx="2.5" fill="#f59e0b" />
    </svg>
  );
}

// "header" is the top-bar size, "footer" the larger sign-off size. Both step
// down a little on small screens so the name never wraps.
const SIZES = {
  header: { mark: 'h-8 w-8 sm:h-9 sm:w-9', text: 'text-xl sm:text-[22px]' },
  footer: { mark: 'h-10 w-10 sm:h-11 sm:w-11', text: 'text-[22px] sm:text-2xl' },
} as const;

export function Logo({ size = 'header' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap font-display font-bold tracking-tight text-white">
      <LogoMark className={s.mark} />
      <span className={s.text}>Statement Sorter</span>
    </span>
  );
}
