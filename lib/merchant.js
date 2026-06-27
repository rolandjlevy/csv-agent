// Collapse a noisy bank description down to a stable merchant key, so the many
// rows a recurring payment produces ("CARD PAYMENT TO ANTHROPIC ON 18-06-2026",
// "ANTHROPIC ... ON 25-05-2026") reduce to one merchant. Shared by the adapt
// stage (csv-adapt.js) and the analyse tool's breakdown operation (tools.js),
// so both group transactions the same way. Pure function — no dependencies.
function merchantKey(description) {
  return String(description)
    .toUpperCase()
    .replace(/\(VIA GOOGLE PAY\)/g, ' ')
    .replace(/\bON \d{2}[-/]\d{2}[-/]\d{2,4}\b/g, ' ')
    .replace(/,?\s*\d+(?:\.\d+)?\s*(?:USD|EUR|GBP)\b.*$/g, ' ') // foreign-currency tail
    .replace(/\bRATE\s+[\d.]+.*$/g, ' ')
    .replace(/\bREF(?:ERENCE)?\b.*$/g, ' ')
    .replace(/\bMANDATE NO.*$/g, ' ')
    .replace(/^CARD PAYMENT TO\s+/g, ' ')
    .replace(/[*_]/g, ' ') // processor separators (SQ *KONAK, ZETTLE_*T N S) — keep the merchant
    .replace(/\b[A-Z]*\d[A-Z0-9]{3,}\b/g, ' ') // drop order-id-like gibberish tokens
    .replace(/[.,]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 50);
}

module.exports = { merchantKey };
