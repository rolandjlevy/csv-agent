import type { FileRejection } from "react-dropzone";

// Plain-English messages for files the dropzone turns away, instead of
// react-dropzone's technical defaults ("File type must be text/csv,.csv,...").

const EXTENSION_HINTS: Record<string, string> = {
  pdf: "That's a PDF. Statement Sorter reads CSV files. In your online banking, look for Export or Download as CSV.",
  xls: "That's an Excel file. In Excel, choose File, Save As, then CSV, and drop that file here.",
  xlsx: "That's an Excel file. In Excel, choose File, Save As, then CSV, and drop that file here.",
  ofx: "That's an OFX file. Statement Sorter reads CSV files. Your bank may offer a CSV download as well.",
  qif: "That's a QIF file. Statement Sorter reads CSV files. Your bank may offer a CSV download as well.",
};

export function friendlyRejection(rejection: FileRejection): string {
  const code = rejection.errors[0]?.code;

  if (code === "file-too-large") {
    return "That file is over the 5MB limit. Try exporting a shorter date range.";
  }
  if (code === "too-many-files") {
    return "Please drop one file at a time.";
  }
  if (code === "file-invalid-type") {
    const extension = rejection.file.name.split(".").pop()?.toLowerCase() ?? "";
    return (
      EXTENSION_HINTS[extension] ??
      "That doesn't look like a CSV file. Statement Sorter reads .csv and .tsv files."
    );
  }
  return "That file couldn't be read. Try exporting it again as a CSV.";
}
