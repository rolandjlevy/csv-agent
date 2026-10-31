const BENEFITS = [
  {
    title: "It actually categorises",
    body: "Income, cost of sales, overheads — sorted properly. Transfers, drawings and VAT stay off the P&L.",
  },
  {
    title: "It remembers",
    body: "Set a client up once and the next month's file is done in a click. Saved in this browser.",
  },
  {
    title: "Most UK banks, no fuss",
    body: "It works the format out itself, so there's no template to wait for.",
  },
];

export function BenefitStrip() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
        {BENEFITS.map((b) => (
          <li key={b.title} className="flex flex-col gap-1 text-left sm:gap-2">
            <h3 className="text-sm font-semibold text-text">{b.title}</h3>
            <p className="text-sm leading-snug text-text-muted sm:leading-relaxed">{b.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
