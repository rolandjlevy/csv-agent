import { categoryTone } from "@/lib/category-tone";

interface CsvPreviewProps {
  columns: string[];
  rows: Record<string, string>[];
}

// The columns the app produces once a file has been adapted. When all five are
// present the preview can show a stacked list on phones; any other shape just
// gets the table in a scrolling box.
const CANONICAL = ["Date", "Description", "Amount", "Category", "Bank"];

// Signed numbers read green or red; anything else stays neutral. Purely
// cosmetic, and independent of column names, so it is safe for any CSV shape.
function amountTone(value: string | undefined): string {
  if (!value) return "text-text-muted";
  const cleaned = value.replace(/[£$,]/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return "text-text-muted";
  const num = parseFloat(cleaned);
  if (num < 0) return "text-error";
  if (num > 0) return "text-money";
  return "text-text-muted";
}

function formatAmount(value: string | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[£$,]/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return value;
  const num = parseFloat(cleaned);
  const body = Math.abs(num).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `−${body}` : `+${body}`;
}

function CategoryChip({ value }: { value: string }) {
  // The confirm screen shows "—" because categories are only assigned when a
  // question is asked; a placeholder should not look like a category.
  if (!/[\p{L}\p{N}]/u.test(value)) return <span className="text-text-faint">{value}</span>;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[13px] font-medium ${categoryTone(value)}`}>
      {value}
    </span>
  );
}

export function CsvPreview({ columns, rows }: CsvPreviewProps) {
  const canonical = CANONICAL.every((c) => columns.includes(c));

  return (
    <>
      {canonical && (
        <ul aria-label="Preview of your file" className="border-t border-border-subtle sm:hidden">
          {rows.map((row, i) => (
            <li key={i} className="border-b border-border-subtle px-[18px] py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 break-words font-mono text-[12.5px] text-text">{row.Description}</span>
                <span className={`shrink-0 font-mono text-[13px] font-medium ${amountTone(row.Amount)}`}>
                  {formatAmount(row.Amount)}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-muted">
                <span>{row.Date}</span>
                <CategoryChip value={row.Category} />
                <span>{row.Bank}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className={`overflow-x-auto ${canonical ? "hidden sm:block" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Preview of your file"
      >
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-border bg-bg-elevated">
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={`whitespace-nowrap px-2 py-2.5 text-xs font-semibold text-text-muted ${
                    col === "Amount" ? "text-right" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                {columns.map((col) => {
                  const value = row[col];
                  if (col === "Category") {
                    return (
                      <td key={col} className="whitespace-nowrap px-2 py-3">
                        {value ? <CategoryChip value={value} /> : null}
                      </td>
                    );
                  }
                  if (col === "Amount") {
                    return (
                      <td
                        key={col}
                        className={`whitespace-nowrap px-2 py-3 text-right font-mono font-medium ${amountTone(value)}`}
                      >
                        {formatAmount(value)}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col}
                      className={`px-2 py-3 ${
                        col === "Description" ? "font-mono text-xs text-text" : "whitespace-nowrap text-text-muted"
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
