"use client";

import { LedgerDemo } from "@/components/ledger-demo";
import { Term } from "@/components/term";

interface HeroProps {
  onSample: (kind: "clean" | "messy") => Promise<void>;
  isLoading: boolean;
}

// The top of the home page, on the dark teal band that continues from the site
// header. The primary action lives here so it is above the fold on phones.
export function Hero({ onSample, isLoading }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="on-band bg-band text-band-text">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-12 gap-y-10 px-6 pb-14 pt-6 md:pb-20 md:pt-12">
        <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
          <h1
            id="hero-title"
            className="font-display text-[2.625rem] font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-[4rem] md:leading-[1.02]"
          >
            Turn a bank statement into a P&amp;L,{" "}
            <span className="text-band-text">then ask it anything.</span>
          </h1>

          <p className="max-w-md text-base leading-relaxed md:text-[17px]">
            An AI agent reads your UK bank CSV, sorts every transaction into{" "}
            <Term
              onBand
              detail="Income, cost of sales and overheads — not just a pile of categorised rows."
            >
              clear categories
            </Term>{" "}
            for your{" "}
            <Term
              onBand
              detail="Profit & Loss — the report that separates real income and costs from balance-sheet noise like transfers and drawings."
            >
              P&amp;L
            </Term>
            , and flags anything unclear. Then ask it questions in plain English, or export to{" "}
            <Term onBand detail="The cloud accounting platforms most UK bookkeepers already use.">
              Xero, QuickBooks or FreeAgent
            </Term>
            .
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            <button
              type="button"
              onClick={() => onSample("messy")}
              disabled={isLoading}
              className="min-h-[52px] w-full cursor-pointer rounded-full bg-cta px-7 py-3 text-base font-semibold text-cta-text transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60 sm:w-auto"
            >
              Try it with a messy bank export
            </button>
            <button
              type="button"
              onClick={() => onSample("clean")}
              disabled={isLoading}
              className="min-h-11 cursor-pointer text-sm font-medium text-white underline underline-offset-4 disabled:cursor-default disabled:opacity-60"
            >
              Or try the clean sample
            </button>
          </div>

          <p className="max-w-md text-[13px] leading-relaxed text-band-faint">
            The sample is made up: split money in and out columns, £ signs and UK dates, untangled
            in a few seconds.
          </p>
        </div>

        <LedgerDemo className="hidden min-w-0 flex-1 basis-[400px] md:block" />
      </div>
    </section>
  );
}
