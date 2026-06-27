export type AmountConvention = "signed" | "split" | "debit_credit";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface AdaptProfile {
  headerRowIndex: number;
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

export interface AdaptOptions {
  apiKey?: string;
  onEvent?: (event: AdaptEvent) => void | Promise<void>;
}

export interface AdaptResult {
  csv: string;
  profile: AdaptProfile | null;
  rowCount: number | null;
  bankName: string | null;
  skipped: boolean;
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
export function looksCanonical(rawText: string): boolean;
export function parseAmount(value: unknown): number;
export function normaliseDate(value: string, format: DateFormat): string;
export function merchantKey(description: string): string;
export function toCanonicalCsv(rows: CanonicalRow[]): string;
export const CATEGORIES: string[];
