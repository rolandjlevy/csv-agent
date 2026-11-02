'use client';

import { useAbout } from '@/components/about-context';
import { Logo } from '@/components/logo';
import { CONTACT_HREF, SITE } from '@/lib/site';

const linkClass =
  'inline-flex min-h-11 items-center px-2.5 text-white underline underline-offset-4 hover:text-cta';

export function Footer() {
  const { open } = useAbout();

  return (
    <div className="on-band mt-16 bg-band">
      <footer className="mx-auto max-w-5xl px-6 pb-12 pt-14 text-band-text">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-[340px]">
            <Logo size="footer" />
            <p className="mt-3.5 text-sm leading-relaxed">
              An AI agent built on Claude&rsquo;s API, with the full source open on GitHub. Made by{' '}
              {SITE.maker}.
            </p>
          </div>
          <nav aria-label="Footer" className="-mx-2.5 flex flex-wrap text-sm sm:justify-end">
            <a href={SITE.repo} target="_blank" rel="noreferrer" className={linkClass}>
              Source code
            </a>
            <a href={SITE.linkedin} target="_blank" rel="noreferrer" className={linkClass}>
              LinkedIn
            </a>
            <a href={SITE.portfolio} target="_blank" rel="noreferrer" className={linkClass}>
              Portfolio
            </a>
            <a href={CONTACT_HREF} className={linkClass}>
              Contact
            </a>
            <button type="button" onClick={open} className={`${linkClass} cursor-pointer`}>
              About
            </button>
            <a href="/privacy" className={linkClass}>
              Privacy
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
