# 📄 Statement Sorter

**Turn any UK bank CSV into a categorised P&L, ready for Xero, QuickBooks or FreeAgent.**

![Statement Sorter screenshot](https://github.com/rolandjlevy/csv-agent/blob/main/docs/images/statement-sorter-1600-1200.jpg?raw=true)

**[Live demo → statementsorter.co.uk](https://statementsorter.co.uk)**
Demo only: use the built-in sample data, not real client files.

Statement Sorter is a working AI agent. Give it a bank export and a question, and it decides for itself which tools to call, and in what order, to find the answer. It runs the same agent loop from a CLI or a web app.

## What it does

- **Reads messy exports.** Preamble rows, split "Money In / Money Out" columns, `£` mojibake, mixed date formats: it works out the layout itself.
- **Categorises properly.** Income, cost of sales and overheads against a UK chart of accounts. Transfers, drawings and VAT stay off the P&L. Anything it can't classify is flagged for review, not guessed.
- **Remembers.** Save a bank's format and your merchant categories once; next month's file is one click.
- **Answers questions in plain English.** "What's still unclassified?", "Total overheads by month?"
- **Exports** to Xero, QuickBooks Online or FreeAgent CSV.

## Quick start

Requires Node.js 18.18 or later (Next.js 15's minimum) and an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone https://github.com/rolandjlevy/csv-agent.git
cd csv-agent
npm install
cp .env.example .env      # then add your ANTHROPIC_API_KEY
npm run dev               # open http://localhost:3000
```

No bank file handy? Click **Try it with a messy bank export**.

## Command line

```bash
node agent.js data/transactions.csv "Give me a P&L for this data"
node agent.js data/transactions.csv "What did I spend most on?"

# Save a bank's format, reuse it later, and export for your accounting software
node agent.js statement.csv "Give me a P&L" --save-profile "Monzo Current"
node agent.js statement.csv --export xero --out xero.csv --profile "Monzo Current"
```

Every turn prints which tool Claude chose, what it passed and what came back, so you can watch the decisions as they happen. Profiles are stored in `~/.csv-agent/profiles/`.

## How it works

Two stages, with one rule: **the LLM decides, plain JavaScript does the work.**

```
bank CSV ─► 1. Ingestion ─► canonical CSV ─► 2. Agent loop ─► answer / P&L ─► export
            (lib/csv-adapt.js)                (lib/agent-core.js)
```

1. **Ingestion.** One LLM call works out the column mapping and date format (`detectProfile()`); another sorts each unique merchant into a chart-of-accounts category (`classifyMerchants()`). Every row is then transformed in deterministic JS, with no model-side maths. Files already in the canonical `Date,Description,Amount,Category,Bank` shape skip the LLM entirely.
2. **Agent loop.** Claude gets your question and four tools (`read_csv`, `analyse`, `generate_pl`, `write_report`), calls them, reads the results and repeats until it can answer (10-turn safety limit). The sequence is never hard-coded: Claude picks it per question.

The web app doesn't reimplement any of this. It wraps the same core in a streaming endpoint (`/api/agent`) and shows each step live.

## Project layout

| Path | What it is |
| --- | --- |
| `lib/agent-core.js` | The agent loop. Read this first. Shared by CLI and web. |
| `lib/csv-adapt.js` | Ingestion: any bank CSV into the canonical schema |
| `lib/accounts.js` | Chart of accounts (income, cost of sales, overheads, exclude) |
| `tools.js` | The four tools, as plain functions with no LLM calls inside |
| `lib/export/` | Xero, QuickBooks and FreeAgent CSV mappers |
| `agent.js` | CLI entry point |
| `src/` | Next.js web app (`app/`, `components/`, `hooks/use-agent.ts`) |
| `stress-test/` | Real-world bank-format fixtures and checks |

More detail in [ARCHITECTURE.md](ARCHITECTURE.md).

## Privacy

In the web app, the file you run (sample or upload) is sent to the app's server and on to Anthropic's API so the AI can read it. The app has no accounts and no database, and its temporary files are deleted when the request finishes. Saved bank formats and merchant categories live in your browser's local storage. Please don't upload real client data to the hosted demo; run it locally with your own API key instead.

## Built with

Claude API (`@anthropic-ai/sdk`), Next.js 15, React 19, Tailwind CSS 4, Framer Motion, Papaparse.

## Author

Built by [Roland Levy](https://rolandlevy.co.uk/) · [GitHub](https://github.com/rolandjlevy) · [LinkedIn](https://www.linkedin.com/in/roland-levy/)
