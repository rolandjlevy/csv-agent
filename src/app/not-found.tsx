import Link from "next/link";

// Shown for any URL that doesn't exist. It renders inside the root layout, so
// the teal header and footer are already around it.
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-6 py-20 md:py-28">
      <p className="font-mono text-sm text-text-muted">404</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-text md:text-5xl">
        That page doesn&rsquo;t exist
      </h1>
      <p className="max-w-md text-base leading-relaxed text-text-muted">
        The link may be old or mistyped. The home page is the place to start.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-12 items-center rounded-full bg-cta px-6 text-[15px] font-semibold text-cta-text transition-opacity hover:opacity-90"
      >
        Back to Statement Sorter
      </Link>
    </main>
  );
}
