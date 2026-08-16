const BENEFITS = [
  {
    title: "It actually categorises",
    body: "Not just a tidier CSV. Income, cost of sales, overheads — sorted properly. Transfers, drawings and VAT stay where they belong, off the P&L.",
  },
  {
    title: "It remembers",
    body: "Set a client up once. Next month it recognises the file and does the lot in a click — no re-mapping, no re-categorising Tesco for the fortieth time.",
  },
  {
    title: "Any bank, no fuss",
    body: "Monzo, Starling, Tide, or some building society nobody's heard of. It works the format out itself, so there's no template to wait for.",
  },
];

export function BenefitStrip() {
  return (
    <div className="mx-auto w-full max-w-4xl py-6 sm:py-8">
      {/* Mobile: horizontally swipeable strip, one card at a time with a peek
          of the next — the full 3-paragraph stack was ~400px of scroll on a
          phone. Desktop: unchanged static 3-column grid. */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:pb-0">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex w-[82%] shrink-0 snap-start flex-col gap-1.5 text-left sm:w-auto sm:shrink sm:gap-2"
          >
            <h3 className="text-sm font-semibold text-text">{b.title}</h3>
            <p className="text-xs leading-snug text-text-muted sm:text-sm sm:leading-relaxed">
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
