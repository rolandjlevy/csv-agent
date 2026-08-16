const BENEFITS = [
  {
    title: "Categorised, not just converted",
    body: "Every transaction sorted into income, cost of sales and overheads. Transfers, drawings and VAT stay off the P&L automatically.",
  },
  {
    title: "It remembers your clients",
    body: "Save a client's setup once. Next month is one click — no re-mapping columns, no re-categorising the same merchants.",
  },
  {
    title: "Any UK bank, no setup",
    body: "An AI agent reads the file and works out the format itself. Monzo, Starling, Tide, or a building society nobody's heard of.",
  },
];

export function BenefitStrip() {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:gap-8">
      {BENEFITS.map((b) => (
        <div
          key={b.title}
          className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left"
        >
          <h3 className="text-sm font-semibold text-text">{b.title}</h3>
          <p className="text-xs leading-relaxed text-text-muted sm:text-sm">{b.body}</p>
        </div>
      ))}
    </div>
  );
}
