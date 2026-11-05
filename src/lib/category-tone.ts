// Chip colours for the Category column. The groups mirror the P&L the app
// builds (and the sample statement on the home page): income green, cost of
// sales blue, overheads purple, balance-sheet items kept off the P&L slate,
// and anything uncategorised amber. A category that isn't in the app's chart
// of accounts (a personal-finance file, say) gets one of three neutral hues
// by name, so the same label is always the same colour.
const INCOME = new Set(["Income", "Sales / Revenue", "Other Income"]);
const COST_OF_SALES = new Set(["Cost of Goods Sold", "Subcontractors"]);
const OFF_THE_PL = new Set(["Transfer", "Drawings", "VAT", "Tax & PAYE", "Loan Principal", "Capital Expenditure"]);
const OVERHEADS = new Set([
  "Wages & Salaries",
  "Rent & Rates",
  "Utilities",
  "Insurance",
  "Travel & Motoring",
  "Telecommunications",
  "Office & Admin Supplies",
  "Marketing & Advertising",
  "Meals & Entertainment",
  "Loan Interest",
  "Bank Charges & Fees",
  "Professional Fees",
  "Subscriptions & Software",
  "Repairs & Maintenance",
  "Other Expenses",
]);

const GREEN = "bg-[#d9f1e1] text-[#14532d] dark:bg-[rgba(74,222,128,0.16)] dark:text-[#8fe3ad]";
const BLUE = "bg-[#dde6fd] text-[#1e3a8a] dark:bg-[rgba(96,165,250,0.18)] dark:text-[#a5c8fb]";
const PURPLE = "bg-[#eddcfa] text-[#581c87] dark:bg-[rgba(192,132,252,0.18)] dark:text-[#d6b0fb]";
const SLATE = "bg-[#e4e8ef] text-[#394152] dark:bg-[rgba(148,163,184,0.18)] dark:text-[#c3d0d8]";
const AMBER = "bg-[#fde8b0] text-[#7c2d12] dark:bg-[rgba(251,191,36,0.18)] dark:text-[#f5d276]";
const TEAL = "bg-[#d3eef3] text-[#0b4a5c] dark:bg-[rgba(92,200,224,0.16)] dark:text-[#9be3f2]";
const NEUTRALS = [BLUE, PURPLE, TEAL];

export function categoryTone(category: string): string {
  const name = category.trim();
  if (INCOME.has(name)) return GREEN;
  if (COST_OF_SALES.has(name)) return BLUE;
  if (OFF_THE_PL.has(name)) return SLATE;
  if (OVERHEADS.has(name)) return PURPLE;
  if (name === "Uncategorised" || name === "") return AMBER;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return NEUTRALS[hash % NEUTRALS.length];
}
