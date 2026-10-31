import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_HREF, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy — Statement Sorter',
  description: 'What Statement Sorter does with the files you run through it.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const linkClass = 'text-accent underline underline-offset-4';

  return (
    <main className="mx-auto max-w-2xl px-4 pt-20 pb-16 text-text">
      <h1 className="font-display text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        {SITE.name} is a working demo of an AI agent, not a finished service.
        Please use the sample data, not real client files.
      </p>

      <h2 className="mt-8 text-lg font-semibold">What is sent</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        When you run a file, sample or upload, its contents are sent from your
        browser to this site&rsquo;s server. The server passes them to
        Anthropic&rsquo;s API so the AI can work out the columns, categorise the
        merchants and answer your questions. The file is sent again each time
        you ask a question.
      </p>

      <h2 className="mt-8 text-lg font-semibold">What this site keeps</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        There are no accounts and no database. The site&rsquo;s code does not
        save your file. The site is hosted on Vercel, which may keep standard
        server logs, and Anthropic handles API requests under its own terms.
        See{' '}
        <a
          href="https://www.anthropic.com/legal/privacy"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Anthropic&rsquo;s privacy policy
        </a>{' '}
        and{' '}
        <a
          href="https://vercel.com/legal/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Vercel&rsquo;s privacy policy
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">What stays in your browser</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        If you save a client setup, the column mapping and the merchant
        categories you chose are stored in this browser&rsquo;s local storage, and
        are sent to the server along with a file when you use them. Clearing
        your browser data removes them.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Visit statistics</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        This site uses Vercel Web Analytics and Vercel Speed Insights to count
        visits and measure how fast pages load. Vercel says Web Analytics
        doesn&rsquo;t use cookies and only stores anonymised data. Your files, file
        names and questions are not sent to them. See{' '}
        <a
          href="https://vercel.com/docs/analytics/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          Vercel&rsquo;s analytics privacy page
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">Questions</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        Ask {SITE.maker} at{' '}
        <a href={CONTACT_HREF} className={linkClass}>
          {SITE.contactEmail}
        </a>
        .
      </p>

      <p className="mt-10">
        <Link href="/" className={linkClass}>
          Back to Statement Sorter
        </Link>
      </p>
    </main>
  );
}
