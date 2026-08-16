const FEATURES = [
  {
    title: "A real P&L, with exceptions flagged",
    body: "anything it can't classify is surfaced for review, not silently guessed",
  },
  {
    title: "Built for UK practice",
    body: "UK dates, VAT handling, UK chart of accounts conventions. Not a US tool with UK bolted on",
  },
  {
    title: "Ask anything, in plain English",
    body: '"what did they spend on software in Q2?" Answered from the categorised data, no exporting required',
  },
  {
    title: "Nothing leaves your browser",
    body: "no uploads, no storage, no accounts",
  },
];

export function SecondaryFeatures() {
  return (
    <div className="mx-auto w-full max-w-2xl border-t border-border-subtle px-4 py-8">
      <ul className="flex flex-col gap-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="text-xs leading-relaxed text-text-muted sm:text-sm">
            <span className="font-medium text-text">{f.title}</span> — {f.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
