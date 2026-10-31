// Protects exported CSVs from formula injection ("CSV injection").
//
// A bank description is text an outside party can influence (a payer chooses
// their own payment reference). If an exported cell starts with =, +, -, @,
// a tab or a carriage return, Excel and Google Sheets can treat it as a
// formula when the bookkeeper opens the file. Prefixing a single quote makes
// the spreadsheet show the text as it is. Apply this to text fields only,
// never to amounts or dates, which legitimately start with "-" or digits.
//
// Matches OWASP's CSV injection guidance.

const FORMULA_START = /^[=+\-@\t\r]/;

function safeText(value) {
  const text = value == null ? '' : String(value);
  return FORMULA_START.test(text) ? `'${text}` : text;
}

module.exports = { safeText };
