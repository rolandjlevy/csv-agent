import { MarkdownLite } from "./markdown-lite";

// The answer as one white sheet. The text is Claude's markdown, so the type
// is set here (16px on a comfortable measure) and markdown-lite styles the
// pieces: section headings, tables, lists.
export function AnswerCard({ text }: { text: string }) {
  return (
    <article
      aria-label="Answer"
      className="rounded-lg bg-bg-surface p-6 text-base leading-[1.65] text-text shadow-[0_0_0_1px_var(--color-border),0_4px_12px_-8px_rgba(2,20,28,0.16)] md:p-8"
    >
      <div className="break-words">
        <MarkdownLite text={text} />
      </div>
    </article>
  );
}
