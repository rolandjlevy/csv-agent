const FEATURES = [
  {
    title: "It remembers each client",
    body: "Set a client up once and next month’s file is done in a click. Setups are saved in this browser.",
  },
  {
    title: "Ask in plain English",
    body: "“What did they spend on software in Q2?” Answered from the categorised data, no exporting needed.",
  },
  {
    title: "Transfers stay off the P&L",
    body: "Transfers, drawings and VAT are kept out, so profit isn’t overstated.",
  },
];

export function SecondaryFeatures() {
  return (
    <div className="mt-16 bg-tint py-14">
      <section aria-labelledby="more-title" className="mx-auto max-w-5xl px-6">
        <h2 id="more-title" className="mb-6 font-display text-[28px] font-semibold tracking-tight text-text">
          Beyond the first file
        </h2>
        <div className="flex flex-wrap gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="min-w-[240px] flex-1 basis-[260px]">
              <p className="mb-1.5 text-[15px] font-semibold text-text">{f.title}</p>
              <p className="text-sm leading-relaxed text-text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
