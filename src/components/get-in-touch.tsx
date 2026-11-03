import { CONTACT_HREF } from '@/lib/site';

// Shown beside a finished answer: the demo has just proven itself, so this is
// where a visitor who's impressed gets a way to reach the maker.
export function GetInTouch() {
  return (
    <section aria-labelledby="get-in-touch-title" className="on-band rounded-lg bg-band px-5 py-6">
      <h2 id="get-in-touch-title" className="font-display text-[22px] font-bold tracking-tight text-white">
        Like this?
      </h2>
      <p className="mb-4 mt-2 text-sm leading-relaxed text-band-text">
        I built it with Claude&rsquo;s API, Next.js and a plain JavaScript agent loop.
      </p>
      <a
        href={CONTACT_HREF}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-cta px-6 text-[15px] font-semibold text-cta-text transition-opacity hover:opacity-90"
      >
        Get in touch
      </a>
    </section>
  );
}
