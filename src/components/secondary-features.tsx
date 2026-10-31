const FEATURES = [
  {
    title: "A real P&L, with exceptions flagged",
    body: "anything it can't classify is surfaced for review, not silently guessed",
  },
  {
    title: "Built for UK practice",
    body: "UK dates, VAT handling and UK chart of accounts conventions",
  },
  {
    title: "Ask in plain English",
    body: '"what did they spend on software in Q2?" Answered from the categorised data, no exporting required',
  },
  {
    title: "No accounts, no database",
    body: "Your file is sent to our server and to Anthropic's AI to be read. Saved client setups are stored in this browser.",
  },
];

export function SecondaryFeatures() {
  return (
    <div className="mx-auto w-full max-w-2xl border-t border-border-subtle px-4 py-8">
      <h2 className="sr-only">More details</h2>
      <ul className="flex flex-col gap-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-text">{f.title}</span> — {f.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
