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
import { AgentFeed } from "@/components/agent-feed";
import { AnswerCard } from "@/components/answer-card";
import { MerchantReviewPanel } from "@/components/merchant-review-panel";
import { ExportPanel } from "@/components/export-panel";
import { HowItWorks } from "@/components/how-it-works";
import { SecondaryFeatures } from "@/components/secondary-features";
import { GetInTouch } from "@/components/get-in-touch";

const stateTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

// The home screen sits under the teal header, so it only fades: sliding would
// open a gap between the header and the hero band while it moves.
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
  const feedEndRef = useRef<HTMLDivElement>(null);
  // Which UI to show when a saved recipe matches — purely a view concern,
  // not agent/data state, so it lives here rather than in useAgent. Resets
  // whenever a new match arrives (new file dropped).
  const [recipeDismissed, setRecipeDismissed] = useState(false);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "end" });
  }, [agent.steps, agent.answer, agent.error]);

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
          <motion.main
            key="working"
            {...stateTransition}
            className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10"
          >
            <h1 className="sr-only">Statement Sorter</h1>
            <p role="status" className="sr-only">
              {agent.status === "running"
                ? "Working on your question."
                : agent.status === "done"
                  ? "Answer ready."
                  : ""}
            </p>

            {agent.question && <AgentFeed question={agent.question} steps={agent.steps} />}

            {agent.status === "running" && (
              <div className="h-28 animate-pulse rounded-lg border border-border-subtle bg-bg-surface" />
            )}

            {agent.status === "done" && agent.answer && (
              <AnswerCard text={agent.answer} stats={agent.stats} />
            )}

            {agent.status === "done" && agent.activeProfileName && (
              <MerchantReviewPanel
                merchants={agent.newMerchants}
                onReclassify={agent.overrideMerchant}
                profileName={agent.activeProfileName}
              />
            )}

            {agent.error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
              >
                <span aria-hidden="true">⚠️</span> {agent.error}
              </motion.div>
            )}

            {(agent.status === "done" || agent.status === "error") && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={agent.askAnother}
                  className="self-start rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  Ask another question
                </button>

                {agent.status === "done" && agent.canonicalCsv && (
                  <button
                    type="button"
                    onClick={() => setShowExport((v) => !v)}
                    aria-expanded={showExport}
                    className={`self-start rounded-lg border px-4 py-2 text-sm transition-colors ${
                      showExport
                        ? "border-accent text-accent"
                        : "border-border text-text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    Export
                  </button>
                )}
              </div>
            )}

            {agent.status === "done" && agent.answer && <GetInTouch />}

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

            <div ref={feedEndRef} />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
