import { AboutButton } from '@/components/about-button';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

// The top bar on the dark teal band. The logo links home with a plain <a> on
// purpose: this is a single-route app, so client-side navigation to "/" while
// already on "/" would be a no-op and wouldn't reset the in-memory agent state
// (uploaded file, question, answer). A full reload brings the homepage back
// exactly as it is on first load.
export function SiteHeader() {
  return (
    <header className="on-band bg-band">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional full reload, see above */}
        <a href="/" aria-label="Statement Sorter, go to homepage" className="rounded-lg">
          <Logo size="header" />
        </a>
        <nav aria-label="Site" className="flex items-center gap-1">
          <AboutButton />
          <a
            href="/privacy"
            className="hidden min-h-11 items-center px-3 text-sm text-band-text transition-colors hover:text-white sm:inline-flex"
          >
            Privacy
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
