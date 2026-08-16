const STEPS = [
  { n: 1, title: "Drop the CSV", body: "any UK bank, any column layout" },
  { n: 2, title: "It works out the format", body: "dates, split money in/out columns, £ signs" },
  { n: 3, title: "Review the categorisation", body: "anything unclear is flagged, not guessed" },
  { n: 4, title: "Download for Xero", body: "correctly mapped, ready to import" },
];

export function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-accent-muted text-xs font-semibold text-accent">
              {s.n}
            </span>
            <p className="text-sm font-medium text-text">{s.title}</p>
            <p className="text-xs text-text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
