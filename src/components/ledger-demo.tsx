// A fictional statement, sorted. It shows the product's job in one glance:
// raw bank lines on the left, where each one lands on the P&L on the right.
// Static markup plus one CSS reveal (see .ledger-tag in globals.css). It stays
// a light "paper" sheet in both themes so it reads against the dark teal band.

type Tone = "income" | "cost" | "overhead" | "off" | "review";

const ROWS: { date: string; text: string; amount: string; tag: string; tone: Tone }[] = [
  { date: "02 Oct", text: "STRIPE PAYOUT 8841", amount: "+1,250.00", tag: "Income", tone: "income" },
  { date: "03 Oct", text: "CARD PURCHASE SCREWFIX 0142", amount: "−86.40", tag: "Cost of sales", tone: "cost" },
  { date: "07 Oct", text: "DD ADOBE SYSTEMS", amount: "−19.97", tag: "Overheads", tone: "overhead" },
  { date: "09 Oct", text: "FP TO J SMITH SAVINGS", amount: "−500.00", tag: "Off the P&L", tone: "off" },
  { date: "12 Oct", text: "CARD PURCHASE 4471 LDN", amount: "−42.15", tag: "Needs a look", tone: "review" },
];

const CHIP: Record<Tone, string> = {
  income: "bg-[#d9f1e1] text-[#14532d] dark:bg-[rgba(74,222,128,0.16)] dark:text-[#8fe3ad]",
  cost: "bg-[#dde6fd] text-[#1e3a8a] dark:bg-[rgba(96,165,250,0.18)] dark:text-[#a5c8fb]",
  overhead: "bg-[#eddcfa] text-[#581c87] dark:bg-[rgba(192,132,252,0.18)] dark:text-[#d6b0fb]",
  off: "bg-[#e4e8ef] text-[#394152] dark:bg-[rgba(148,163,184,0.18)] dark:text-[#c3d0d8]",
  review: "bg-[#fde8b0] text-[#7c2d12] dark:bg-[rgba(251,191,36,0.18)] dark:text-[#f5d276]",
};

// `onPage` is for copies that sit on the page ground instead of the teal band.
export function LedgerDemo({ className = "", onPage = false }: { className?: string; onPage?: boolean }) {
  return (
    <figure className={`w-full ${className}`}>
      <div
        role="img"
        aria-label="Example: five bank lines sorted into income, cost of sales, overheads, a transfer kept off the P&L, and one item flagged for review. Net profit so far £1,143.63."
        className="overflow-hidden rounded-lg bg-bg-surface text-text shadow-[0_0_0_1px_rgba(207,230,236,0.3),0_6px_16px_-10px_rgba(2,20,28,0.3)] dark:shadow-[0_0_0_1px_rgba(92,200,224,0.28),0_24px_48px_-24px_rgba(0,8,12,0.7)]"
      >
        <div className="flex items-baseline justify-between bg-bg-elevated px-4 py-2 text-xs text-text-muted">
          <span>Bank statement, October</span>
          <span>Where it lands</span>
        </div>

        <ul aria-hidden="true" className="divide-y divide-border-subtle">
          {ROWS.map((r, i) => (
            <li
              key={r.text}
              className="flex items-baseline justify-between gap-4 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px]">{r.text}</p>
                <p className="mt-0.5 flex gap-3 font-mono text-xs text-text-faint">
                  <span>{r.date}</span>
                  <span className="tabular-nums">{r.amount}</span>
                </p>
              </div>
              <p
                style={{ ["--row" as string]: i }}
                className={`ledger-tag shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium ${CHIP[r.tone]}`}
              >
                {r.tag}
              </p>
            </li>
          ))}
        </ul>

        <div
          aria-hidden="true"
          className="flex items-baseline justify-between border-t border-border bg-bg-elevated px-4 py-3"
        >
          <span className="text-sm font-medium">Net profit so far</span>
          <span className="font-mono text-base font-medium tabular-nums">£1,143.63</span>
        </div>
      </div>
      <figcaption className={`mt-2 text-xs ${onPage ? "text-text-faint" : "text-band-faint"}`}>Sample data, invented for this page.</figcaption>
    </figure>
  );
}
