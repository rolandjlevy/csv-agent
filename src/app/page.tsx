"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAgent } from "@/hooks/use-agent";
import { Header } from "@/components/header";
import { CsvDropzone } from "@/components/csv-dropzone";
import { CsvPreview } from "@/components/csv-preview";
import { ColumnConfirmPanel } from "@/components/column-confirm-panel";
import { RecipeBanner } from "@/components/recipe-banner";
import { QuestionPanel } from "@/components/question-panel";
import { AgentFeed } from "@/components/agent-feed";
import { AnswerCard } from "@/components/answer-card";
import { MerchantReviewPanel } from "@/components/merchant-review-panel";
import { BenefitStrip } from "@/components/benefit-strip";
import { HowItWorks } from "@/components/how-it-works";
import { SecondaryFeatures } from "@/components/secondary-features";

const stateTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export default function Home() {
  const agent = useAgent();
  const feedEndRef = useRef<HTMLDivElement>(null);
  // Which UI to show when a saved recipe matches — purely a view concern,
  // not agent/data state, so it lives here rather than in useAgent. Resets
  // whenever a new match arrives (new file dropped).
  const [recipeDismissed, setRecipeDismissed] = useState(false);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [agent.steps, agent.answer, agent.error]);

  useEffect(() => {
    setRecipeDismissed(false);
  }, [agent.savedProfileMatch]);

  const isUploadState = agent.status === "idle" || agent.status === "uploading";
  const isConfirmState = agent.status === "confirming";
  const isAskState = agent.status === "ready";
  const isWorkingState =
    agent.status === "running" || agent.status === "done" || agent.status === "error";

  return (
    <div className="min-h-screen bg-bg">
      {!isWorkingState && <Header />}

      <AnimatePresence mode="wait">
        {isUploadState && (
          <motion.main
            key="upload"
            {...stateTransition}
            className="flex flex-col items-center gap-2 pb-16"
          >
            <BenefitStrip />
            <CsvDropzone
              onFileAccepted={agent.uploadCsv}
              onSampleClick={agent.loadSample}
              isLoading={agent.status === "uploading"}
            />
            <HowItWorks />
            <SecondaryFeatures />
          </motion.main>
        )}

        {isConfirmState && agent.profile && agent.rawPreview && (
          <motion.main
            key="confirm"
            {...stateTransition}
            className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16"
          >
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
          </motion.main>
        )}

        {isAskState && agent.csvInfo && (
          <motion.main
            key="ask"
            {...stateTransition}
            className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 md:flex-row"
          >
            <aside className="flex w-full flex-col gap-4 md:w-[46%]">
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
                <p className="truncate font-mono text-sm text-text">{agent.csvInfo.name}</p>
                <p className="mt-1 text-xs text-text-faint">
                  {agent.csvInfo.rows} rows · {agent.csvInfo.columns.length} columns
                </p>
              </div>

              <CsvPreview columns={agent.csvInfo.columns} rows={agent.previewRows} />

              <button
                type="button"
                onClick={agent.reset}
                className="self-start text-sm text-text-muted underline-offset-4 hover:text-accent hover:underline"
              >
                ← Change file
              </button>
            </aside>

            <section className="flex-1">
              <QuestionPanel onSubmit={agent.askQuestion} />
            </section>
          </motion.main>
        )}

        {isWorkingState && (
          <motion.main
            key="working"
            {...stateTransition}
            className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10"
          >
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
              >
                ⚠️ {agent.error}
              </motion.div>
            )}

            {(agent.status === "done" || agent.status === "error") && (
              <button
                type="button"
                onClick={agent.askAnother}
                className="self-start rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Ask another question
              </button>
            )}

            <div ref={feedEndRef} />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
