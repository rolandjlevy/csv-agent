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
          CSV Agent
        </h1>
      </div>
      <p className="mt-1 text-base font-medium text-text sm:text-lg">
        Drop a bank CSV. Ask anything.
      </p>

      <p className="mt-3 max-w-xl text-xs leading-relaxed text-text-muted sm:text-sm">
        An{' '}
        <Term detail="An LLM that decides which action to take next in a loop, rather than running a fixed script.">
          AI agent
        </Term>{' '}
        that reads{' '}
        <Term detail="Santander, Monzo, whatever — it auto-detects the columns and normalises them before answering.">
          any bank&rsquo;s CSV
        </Term>{' '}
        and answers your questions in{' '}
        <Term detail="No formulas or pivot tables. Just ask: “What did I spend most on in June?”">
          plain English
        </Term>{' '}
        — choosing{' '}
        <Term detail="read_csv, analyse, write_report — Claude picks the order at runtime based on your question.">
          its own tools
        </Term>{' '}
        as it goes.
      </p>
    </header>
  );
}
