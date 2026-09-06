// A plain anchor (not next/link) so this always does a full page reload —
// this is a single-route app, so client-side navigation to "/" while
// already on "/" is a no-op and wouldn't reset the in-memory agent state
// (uploaded file, question, answer, etc.). A real reload guarantees the
// homepage comes back exactly as it does on first load. This works as a
// Server Component precisely because it's a plain <a>, not next/link —
// no event handler needed, so no "use client" needed either.
export function HomeButton() {
  return (
    <a
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
    </a>
  );
}
