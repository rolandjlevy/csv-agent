const STEPS = [
  { n: 1, title: "Drop the CSV", body: "UK bank exports, whatever the column layout." },
  {
    n: 2,
    title: "It works out the format",
    body: "Dates, split money in and out columns, £ signs. You confirm the columns.",
  },
  { n: 3, title: "Review the categories", body: "Anything unclear is flagged, not guessed." },
  { n: 4, title: "Export your P&L", body: "Straight to Xero, QuickBooks or FreeAgent." },
];

// A real sequence, so it is numbered; the section below is not, so it is not.
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto w-full max-w-5xl px-6 pt-16">
      <h2 id="how-title" className="mb-6 font-display text-[28px] font-semibold tracking-tight text-text">
        How it works
      </h2>
      <ol className="flex flex-wrap border-t border-border">
        {STEPS.map((s) => (
          <li key={s.n} className="min-w-[200px] flex-1 basis-[200px] pb-1 pr-5 pt-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-mono text-[13px] font-medium text-bg">
              {s.n}
            </span>
            <p className="mb-1 mt-2 text-[15px] font-semibold text-text">{s.title}</p>
            <p className="text-sm leading-relaxed text-text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
