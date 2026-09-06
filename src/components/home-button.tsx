import Link from "next/link";

export function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Go to homepage"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-surface text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-4 w-4 shrink-0"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 9.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" />
      </svg>
    </Link>
  );
}
