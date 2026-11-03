"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAgent } from "@/hooks/use-agent";
import { Hero } from "@/components/hero";
import { DemoNotice, OwnFileCard, useCsvIntake } from "@/components/csv-dropzone";
import { LedgerDemo } from "@/components/ledger-demo";
import { FileSheet } from "@/components/file-sheet";
import { PageBand } from "@/components/page-band";
import { ColumnConfirmPanel } from "@/components/column-confirm-panel";
import { RecipeBanner } from "@/components/recipe-banner";
import { QuestionPanel } from "@/components/question-panel";
import { HowItWorked } from "@/components/how-it-worked";
import { AnswerCard } from "@/components/answer-card";
import { MerchantReviewPanel } from "@/components/merchant-review-panel";
import { ExportPanel } from "@/components/export-panel";
import { HowItWorks } from "@/components/how-it-works";
import { SecondaryFeatures } from "@/components/secondary-features";
import { GetInTouch } from "@/components/get-in-touch";

// Every screen sits under the teal header, so screens only fade: sliding would
// open a gap between the header and the band while it moves.
const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

// File names the sample buttons load (see loadSample in use-agent).
const SAMPLE_FILES = ["transactions.csv", "sample-messy.csv"];

// Smooth scrolling is skipped for visitors who ask their device to reduce motion.
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export default function Home() {
  const agent = useAgent();
  const intake = useCsvIntake({ onFileAccepted: agent.uploadCsv, onSampleClick: agent.loadSample });
  // Which UI to show when a saved recipe matches — purely a view concern,
  // not agent/data state, so it lives here rather than in useAgent. Resets
  // whenever a new match arrives (new file dropped).
  const [recipeDismissed, setRecipeDismissed] = useState(false);

  // A question is usually asked from lower down the ready screen, so start the
  // answer screen at the top, where the question heading and the answer are.
  useEffect(() => {
    if (agent.status === "running") window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }, [agent.status]);

  useEffect(() => {
    setRecipeDismissed(false);
  }, [agent.savedProfileMatch]);

  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowExport(false);
  }, [agent.canonicalCsv]);

  useEffect(() => {
    if (showExport) {
      exportRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    }
  }, [showExport]);

  const isUploadState = agent.status === "idle" || agent.status === "uploading";
  const isConfirmState = agent.status === "confirming";
  const isAskState = agent.status === "ready";
  const isWorkingState =
    agent.status === "running" || agent.status === "done" || agent.status === "error";

  return (
    <div className="min-h-screen bg-bg">
      <AnimatePresence mode="wait">
        {isUploadState && (
          <motion.main key="upload" {...fadeOnly} className="flex flex-col pb-4">
            <Hero onSample={intake.handleSampleClick} isLoading={agent.status === "uploading"} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 pt-10">
              <OwnFileCard intake={intake} isLoading={agent.status === "uploading"} />
              <DemoNotice />
              {intake.localError && (
                <p role="alert" className="text-sm text-error">
                  {intake.localError}
                </p>
              )}
            </div>

            <div className="mx-auto w-full max-w-5xl px-6 pt-8 md:hidden">
              <LedgerDemo onPage />
            </div>

            <HowItWorks />
            <SecondaryFeatures />
          </motion.main>
        )}

        {isConfirmState && agent.profile && agent.rawPreview && (
          <motion.div key="confirm" {...fadeOnly}>
            <PageBand title="We've read your file">
              Check how the columns were read below, then continue.
            </PageBand>
            <main className="relative mx-auto -mt-16 flex max-w-3xl flex-col gap-6 px-6 pb-16 md:-mt-20">
              {agent.savedProfileMatch && !recipeDismissed ? (
                <RecipeBanner
                  name={agent.savedProfileMatch.name}
                  fileName={agent.fileName}
                  onRun={agent.runRecipe}
                  onReview={() => setRecipeDismissed(true)}
                />
              ) : (
                <ColumnConfirmPanel
                  fileName={agent.fileName}
                  profile={agent.profile}
                  rawPreview={agent.rawPreview}
                  savedProfileMatch={agent.savedProfileMatch}
                  onConfirm={agent.confirmProfile}
                  onCancel={agent.reset}
                />
              )}
            </main>
          </motion.div>
        )}

        {isAskState && agent.csvInfo && (
          <motion.div key="ask" {...fadeOnly}>
            <PageBand title={SAMPLE_FILES.includes(agent.csvInfo.name) ? "Your sample is ready" : "Your file is ready"}>
              Ask a question about your {agent.csvInfo.rows} rows, or change the file.
            </PageBand>
            <main className="relative mx-auto -mt-16 flex max-w-5xl flex-col items-start gap-8 px-6 pb-16 md:-mt-20 lg:flex-row">
              <div className="w-full min-w-0 lg:flex-[1.15_1_440px]">
                <FileSheet
                  name={agent.csvInfo.name}
                  totalRows={agent.csvInfo.rows}
                  columns={agent.csvInfo.columns}
                  rows={agent.previewRows}
                  onChangeFile={agent.reset}
                />
              </div>
              <div className="w-full min-w-0 lg:flex-1 lg:basis-[400px]">
                <QuestionPanel onSubmit={agent.askQuestion} />
              </div>
            </main>
          </motion.div>
        )}

        {isWorkingState && (
          <motion.div key="working" {...fadeOnly}>
            <PageBand title={agent.question ?? "Working on it"}>
              {agent.status === "running" ? (
                "Working on it..."
              ) : (
                <>
                  Answered from{" "}
                  <span className="font-mono text-white">{agent.csvInfo?.name ?? agent.fileName}</span>
                  {agent.csvInfo ? `, ${agent.csvInfo.rows} rows` : ""}.{" "}
                  <button
                    type="button"
                    onClick={agent.reset}
                    className="cursor-pointer text-white underline underline-offset-4"
                  >
                    Change file
                  </button>
                </>
              )}
            </PageBand>

            <main className="relative mx-auto -mt-16 flex max-w-5xl flex-col items-start gap-8 px-6 pb-16 md:-mt-20 lg:flex-row">
              <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-1">
                <p role="status" className="sr-only">
                  {agent.status === "running"
                    ? "Working on your question."
                    : agent.status === "done"
                      ? "Answer ready."
                      : ""}
                </p>

                {agent.status === "running" && (
                  // The card itself stays opaque and still: it overlaps the teal band, and
                  // pulsing its opacity would let the band show through. Only the
                  // placeholder bars inside it pulse. Same padding and shadow as AnswerCard.
                  <div
                    aria-hidden="true"
                    className="flex flex-col gap-3 rounded-lg bg-bg-surface p-6 shadow-[0_0_0_1px_var(--color-border),0_4px_12px_-8px_rgba(2,20,28,0.16)] md:p-8"
                  >
                    <div className="h-4 w-11/12 animate-pulse rounded bg-bg-elevated" />
                    <div className="h-4 w-full animate-pulse rounded bg-bg-elevated" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-bg-elevated" />
                    <div className="mt-4 h-24 animate-pulse rounded bg-bg-elevated" />
                  </div>
                )}

                {agent.status === "done" && agent.answer && <AnswerCard text={agent.answer} />}

                {agent.status === "done" && agent.activeProfileName && (
                  <MerchantReviewPanel
                    merchants={agent.newMerchants}
                    onReclassify={agent.overrideMerchant}
                    profileName={agent.activeProfileName}
                  />
                )}

                {agent.error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-error/40 bg-error/10 px-5 py-4 text-sm leading-relaxed text-error"
                  >
                    {agent.error}
                  </div>
                )}

                {showExport && agent.status === "done" && agent.canonicalCsv && (
                  <div ref={exportRef}>
                    {/* key forces a fresh mount (fresh category list + fresh
                    pre-filled defaults) whenever a new question's data arrives —
                    this panel would otherwise persist stale categories/codes
                    across "ask another question" without remounting. */}
                    <ExportPanel
                      key={agent.canonicalCsv}
                      canonicalCsv={agent.canonicalCsv}
                      activeProfileName={agent.activeProfileName}
                    />
                  </div>
                )}
              </div>

              <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:w-[300px] lg:shrink-0">
                {(agent.status === "done" || agent.status === "error") && (
                  <section
                    aria-labelledby="next-title"
                    className="rounded-lg bg-bg-surface p-5 shadow-[0_0_0_1px_var(--color-border),0_4px_12px_-8px_rgba(2,20,28,0.16)]"
                  >
                    <h2 id="next-title" className="mb-3.5 font-display text-[17px] font-semibold tracking-tight text-text">
                      Next
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {agent.status === "done" && agent.canonicalCsv && (
                        <button
                          type="button"
                          onClick={() => setShowExport((v) => !v)}
                          aria-expanded={showExport}
                          className="min-h-12 w-full cursor-pointer rounded-full bg-cta px-5 py-2.5 text-[15px] font-semibold text-cta-text transition-opacity hover:opacity-90"
                        >
                          Export
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={agent.askAnother}
                        className="min-h-12 w-full cursor-pointer rounded-full border-2 border-accent bg-bg-surface px-5 py-2.5 text-[15px] font-semibold text-accent transition-colors hover:bg-accent-muted"
                      >
                        Ask another question
                      </button>
                    </div>
                  </section>
                )}

                <HowItWorked
                  steps={agent.steps}
                  stats={agent.stats}
                  status={agent.status === "running" ? "running" : agent.status === "error" ? "error" : "done"}
                />

                {agent.status === "done" && agent.answer && <GetInTouch />}
              </aside>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
