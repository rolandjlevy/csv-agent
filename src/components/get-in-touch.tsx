import { CONTACT_HREF } from '@/lib/site';

// Shown under a finished answer: the demo has just proven itself, so this is
// where a visitor who's impressed gets a way to reach the maker.
export function GetInTouch() {
  return (
    <section
      aria-labelledby="get-in-touch-title"
      className="rounded-lg border border-accent/40 bg-bg-surface px-5 py-4"
    >
      <h2 id="get-in-touch-title" className="text-sm font-semibold text-text">
        Like this?
      </h2>
      <p className="mt-1 text-sm leading-snug text-text-muted">
        I built it with Claude&rsquo;s API, Next.js and a plain JavaScript agent loop.
      </p>
      <a
        href={CONTACT_HREF}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-accent px-5 text-sm font-medium text-accent transition-colors hover:bg-accent-muted"
      >
        Get in touch
      </a>
    </section>
  );
}
