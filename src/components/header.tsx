import { Term } from '@/components/term';

export function Header() {
  return (
    <header className="flex flex-col items-center gap-1 px-4 pt-12 pb-6 text-center sm:pt-16">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-7 w-7 shrink-0 text-accent sm:h-8 sm:w-8"
        >
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Statement Sorter
        </h1>
      </div>
      <p className="mt-1 text-base font-medium text-text sm:text-lg">
        Stop reformatting your clients&rsquo; bank exports every month.
      </p>

      <p className="mt-3 max-w-xl text-xs leading-relaxed text-text-muted sm:text-sm">
        Drop the CSV — any bank, any layout. Statement Sorter reads the file, sorts your
        transactions into clear{' '}
        <Term detail="Income, cost of sales and overheads — not just a pile of categorised rows.">
          categories
        </Term>
        , and shows you exactly where the money went — with a proper{' '}
        <Term detail="Profit & Loss — the report that separates real income and costs from balance-sheet noise like transfers and drawings.">
          P&amp;L
        </Term>{' '}
        ready to export into{' '}
        <Term detail="The cloud accounting platforms most UK bookkeepers already use.">
          Xero, QuickBooks or FreeAgent
        </Term>
        . In the time it used to take to rename the columns.
      </p>
    </header>
  );
}
