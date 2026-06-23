import { Fragment, type ReactNode } from "react";

// A small, dependency-free renderer for the markdown Claude tends to use in
// answers and reasoning (headings, bold, bullet lists, blockquotes, pipe
// tables) — just enough to avoid dumping raw "## heading" / "**bold**" /
// "| a | b |" syntax in the UI.

const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(?!\s)([^*]+?)(?<!\s)\*/g;

export function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
    } else {
      nodes.push(<em key={key++}>{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

type LineKind = "heading" | "table" | "bullet" | "quote" | "hr" | "blank" | "text";

function classifyLine(line: string): LineKind {
  const trimmed = line.trim();
  if (trimmed === "") return "blank";
  if (/^#{1,6}\s+/.test(trimmed)) return "heading";
  if (trimmed.startsWith("|")) return "table";
  if (/^[-*]\s+/.test(trimmed)) return "bullet";
  if (/^>\s?/.test(trimmed)) return "quote";
  if (/^[-*]{3,}$/.test(trimmed)) return "hr";
  return "text";
}

interface LineBlock {
  kind: LineKind;
  lines: string[];
}

// Groups consecutive lines of the same kind into one block — e.g. a run of
// "| ... |" lines becomes one table block. Headings always start a fresh
// block of their own, so "## Heading" directly followed by a table (no
// blank line between them, which Claude doesn't always include) still
// splits into a heading element + a separate table, instead of both being
// swallowed into one unparsed paragraph.
function groupLines(text: string): LineBlock[] {
  const blocks: LineBlock[] = [];
  let current: LineBlock | null = null;

  for (const line of text.split("\n")) {
    const kind = classifyLine(line);

    if (kind === "blank") {
      current = null;
      continue;
    }

    if (kind === "heading" || !current || current.kind !== kind) {
      current = { kind, lines: [line] };
      blocks.push(current);
      continue;
    }

    current.lines.push(line);
  }

  return blocks;
}

function renderTable(lines: string[], key: number): ReactNode {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );
  const isSeparatorRow = (row: string[]) => row.every((cell) => /^:?-+:?$/.test(cell));

  const [headerRow, ...rest] = rows;
  const bodyRows = rest.filter((row) => !isSeparatorRow(row));

  return (
    <div key={key} className="overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-elevated">
            {headerRow.map((cell, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2 font-medium text-text-faint">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, i) => (
            <tr key={i} className="border-b border-border-subtle last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-2 text-text-muted">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderHeading(line: string, key: number): ReactNode {
  const match = line.trim().match(/^(#{1,6})\s+(.*)/);
  if (!match) return null;
  const level = match[1].length;
  const className =
    level <= 2 ? "text-base font-semibold text-text" : "text-sm font-semibold text-text";
  return (
    <p key={key} className={className}>
      {renderInline(match[2])}
    </p>
  );
}

function renderBlock(block: LineBlock, key: number): ReactNode {
  switch (block.kind) {
    case "heading":
      return renderHeading(block.lines[0], key);

    case "table":
      return renderTable(block.lines, key);

    case "bullet":
      return (
        <ul key={key} className="list-disc space-y-1 pl-5">
          {block.lines.map((line, i) => (
            <li key={i}>{renderInline(line.trim().replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote key={key} className="border-l-2 border-border pl-3 text-text-faint">
          {block.lines.map((line, i) => (
            <p key={i}>{renderInline(line.trim().replace(/^>\s?/, ""))}</p>
          ))}
        </blockquote>
      );

    case "hr":
      return <hr key={key} className="border-border-subtle" />;

    case "text":
      return (
        <p key={key}>
          {block.lines.map((line, i) => (
            <Fragment key={i}>
              {renderInline(line)}
              {i < block.lines.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      );

    default:
      return null;
  }
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const blocks = groupLines(text);
  return (
    <div className={className ?? "flex flex-col gap-3"}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
