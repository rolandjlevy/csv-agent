export type AmountConvention = "signed" | "split" | "debit_credit";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface AdaptProfile {
  headerRowIndex: number;
  /** False when the file has no header row at all — column fields below are
   * then 0-based column-index strings ("0", "1", ...) instead of header text.
   * Defaults to true when absent. */
  hasHeaderRow?: boolean;
  bankName?: string;
  currencyCode?: string;
  dateColumn: string;
  dateFormat: DateFormat;
  descriptionColumn: string;
  amountConvention: AmountConvention;
  amountColumn?: string;
  moneyInColumn?: string;
  moneyOutColumn?: string;
}

export interface AdaptEvent {
  stage: "skip" | "detect" | "profile" | "transform" | "categorise" | "done";
  message: string;
  profile?: AdaptProfile;
}

/** What resolveProfile returns when it finds a saved recipe matching the
 * freshly detected profile — adaptCsv uses this instead of the raw detection
 * result, merging in its merchant map. */
export interface ResolvedProfile {
  profile: AdaptProfile;
  merchantMap?: Record<string, string>;
  name?: string;
}

export interface AdaptOptions {
  apiKey?: string;
  onEvent?: (event: AdaptEvent) => void | Promise<void>;
  /** Merchant key -> category, carried forward from a saved profile so only
   * unknown merchants are sent to the classifier. */
  knownMerchantMap?: Record<string, string>;
  /** Called with the freshly detected profile (adaptCsv's own detect step,
   * only — not invoked when a profile is already given, i.e. never from
   * transformAndCategorise) so a caller can substitute a matching saved
   * recipe's profile/merchant map instead of the raw detection. Return
   * null/undefined to keep using the detected profile as-is. */
  resolveProfile?: (
    detected: AdaptProfile
  ) => ResolvedProfile | null | undefined | Promise<ResolvedProfile | null | undefined>;
}

export interface AdaptResult {
  csv: string;
  profile: AdaptProfile | null;
  rowCount: number | null;
  bankName: string | null;
  skipped: boolean;
  /** Full accumulated merchant key -> category map (known + newly
   * classified). Null when adaptation was skipped (already-canonical file). */
  merchantMap: Record<string, string> | null;
  /** Merchant keys that were newly classified this run (not present in the
   * incoming knownMerchantMap). */
  newMerchantKeys: string[];
}

export interface CanonicalRow {
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
  Bank: string;
}

export function adaptCsv(rawText: string, options?: AdaptOptions): Promise<AdaptResult>;
export function transformAndCategorise(
  rawText: string,
  profile: AdaptProfile,
  options?: AdaptOptions
): Promise<AdaptResult>;
export function detectProfile(rawText: string, options?: { apiKey?: string }): Promise<AdaptProfile>;
export function applyProfile(rawText: string, profile: AdaptProfile, bankName: string): CanonicalRow[];
export function classifyMerchants(keys: string[], options?: { apiKey?: string }): Promise<Record<string, string>>;
export function classifyMerchantsWithCache(
  keys: string[],
  knownMap?: Record<string, string>
): { known: Record<string, string>; unknown: string[] };
export function looksCanonical(rawText: string): boolean;
export function parseAmount(value: unknown): number;
export function normaliseDate(value: string, format: DateFormat): string;
export function merchantKey(description: string): string;
export function toCanonicalCsv(rows: CanonicalRow[]): string;

export type PnlSection = 'income' | 'cost_of_sales' | 'overheads' | 'exclude';

export interface Account {
  code: string;
  name: string;
  pnl_section: PnlSection;
  sa_box: string | null;
}

/** Full chart-of-accounts definition. */
export const ACCOUNTS: Account[];
/** Flat list of account names — the valid values for the Category column. */
export const CATEGORIES: string[];
