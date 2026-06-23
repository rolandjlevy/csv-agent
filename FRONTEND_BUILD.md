You are building a web frontend for CSV Agent — an AI agent that
takes a CSV file and answers questions about it using tools in a
loop. The CLI version (agent.js + tools.js) already works. Your
job is to wrap it in a modern web UI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing any code:

1. Read agent.js and tools.js in full. Understand:
   - The agent loop structure
   - The three tools (read_csv, analyse, write_report)
   - The message format between Claude and the tools
   - The stop_reason logic that exits the loop

2. Read data/transactions.csv to understand the data shape

3. Map out the data flow:
   - What the frontend sends to the API route
   - What the API route streams back
   - What the frontend renders at each step

Do not write any code until you have completed this research
and stated your findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — PLAN THE ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Present the architecture plan before building. Include:

- File structure (extending the existing csv-agent project)
- API route design (how the agent loop becomes an HTTP endpoint)
- Streaming strategy (how tool calls are sent to the browser
  in real time as they happen)
- State management on the client
- Component breakdown

The existing agent loop must be reusable — do not rewrite it
from scratch. Extract the core loop into a shared module that
both the CLI and the web UI can call.

Wait for confirmation before proceeding to Phase 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — PROJECT SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tech stack:
  - Next.js 15 (App Router)
  - TypeScript strict
  - Tailwind CSS 4
  - Framer Motion (for agent step animations)
  - Anthropic SDK (@anthropic-ai/sdk)
  - papaparse (CSV parsing in the browser)
  - react-dropzone (file upload)

Extend the existing csv-agent directory. The CLI version must
continue to work alongside the web UI. Proposed structure:

  csv-agent/
  ├── agent.js                ← existing CLI entry point (keep working)
  ├── tools.js                ← existing tools (keep as-is)
  ├── lib/
  │   └── agent-core.ts       ← extracted agent loop, shared by CLI + web
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx
  │   │   ├── page.tsx         ← the main UI
  │   │   ├── globals.css
  │   │   └── api/
  │   │       └── agent/
  │   │           └── route.ts ← streaming API endpoint
  │   ├── components/
  │   │   ├── csv-dropzone.tsx    ← drag-and-drop file upload
  │   │   ├── question-panel.tsx  ← predefined + custom questions
  │   │   ├── agent-feed.tsx      ← real-time agent activity stream
  │   │   ├── agent-step.tsx      ← single tool-call step card
  │   │   ├── answer-card.tsx     ← final answer display
  │   │   ├── csv-preview.tsx     ← mini table showing uploaded data
  │   │   └── header.tsx
  │   ├── hooks/
  │   │   └── use-agent.ts       ← manages streaming + state
  │   └── types/
  │       └── agent.ts           ← shared types for events
  ├── data/
  │   └── transactions.csv    ← existing sample data
  ├── package.json
  ├── .env.example
  ├── tailwind.config.ts
  ├── tsconfig.json
  └── next.config.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — STREAMING API ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The API route at /api/agent must:

1. Accept a POST with:
   - csvData: string (raw CSV content, parsed client-side)
   - question: string

2. Run the agent loop from lib/agent-core.ts

3. Stream events back to the client as newline-delimited JSON
   (NDJSON). Each event is one line:

   Event types:

   {"type":"turn_start","turn":1}

   {"type":"tool_call","turn":1,"tool":"read_csv","input":{"file_path":"uploaded.csv"}}

   {"type":"tool_result","turn":1,"tool":"read_csv","result":{"columns":["Date","Description"],"total_rows":47},"duration_ms":12}

   {"type":"thinking","turn":2,"text":"The data has 47 transactions across 7 categories. I need to group by category to find the highest spend."}

   {"type":"tool_call","turn":2,"tool":"analyse","input":{"operation":"group","column":"Amount","group_by":"Category"}}

   {"type":"tool_result","turn":2,"tool":"analyse","result":{"Groceries":-287.43},"duration_ms":3}

   {"type":"answer","text":"Your biggest spending category was Groceries at £287.43..."}

   {"type":"done","total_turns":3,"duration_ms":4200}

4. The CSV data is written to a temp file on the server so the
   existing read_csv tool works without modification.

5. Error events:
   {"type":"error","message":"Failed to parse CSV"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — THE UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The UI has three states, transitioning fluidly between them.

STATE 1 — UPLOAD (initial state)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The full viewport. Clean, minimal, inviting.

- Header: "CSV Agent" with a subtle logo/icon
  Tagline underneath: "Drop a CSV. Ask anything."
- Large drag-and-drop zone (centre of viewport):
  - Dashed border, subtle pulse animation on hover
  - Icon: document/spreadsheet icon
  - Text: "Drop your CSV here or click to browse"
  - Accepted formats: .csv, .tsv
  - Max file size: 5MB
  - On drop: file name + row count appear, zone shrinks
- Below the drop zone: a small "or try with sample data" link
  that loads data/transactions.csv automatically

Once a file is uploaded, animate transition to State 2.

STATE 2 — ASK (file uploaded, ready to query)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Two-column layout on desktop. Stacked on mobile.

LEFT COLUMN — Context panel (narrower, ~35%):
  - File info: name, row count, column names
  - CSV preview: a compact mini-table showing the first 5 rows
    with horizontal scroll if columns overflow
  - "Change file" link to return to State 1

RIGHT COLUMN — Question panel (~65%):
  - Heading: "What do you want to know?"
  - Predefined question chips (clickable, animated):
    - "What did I spend most on?"
    - "Show me a monthly breakdown"
    - "What's my average daily spend?"
    - "Any unusual transactions?"
    - "How much went to subscriptions?"
    - "Write me a spending report"
  - Custom question input below the chips:
    - Large text input with placeholder:
      "Ask anything about your data..."
    - Submit button with arrow icon
    - Enter key submits
  - Clicking a chip fills the input and submits immediately

Once a question is submitted, animate transition to State 3.

STATE 3 — AGENT WORKING + ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is the centrepiece. The user watches the agent think.

Layout: single column, full width, scrollable feed.

The question appears at the top as a styled prompt bubble.

Below it, the AGENT FEED — a vertical timeline of steps that
appear one by one as the stream delivers events:

  ┌─────────────────────────────────────────────┐
  │  ❓ "What did I spend most on?"             │
  └─────────────────────────────────────────────┘
          │
  ┌───────┴───────────────────────────────────┐
  │  🔄 Turn 1                                │
  │  ┌──────────────────────────────────────┐  │
  │  │ 🔧 read_csv                          │  │
  │  │ Reading uploaded.csv                 │  │
  │  │ ✅ 47 rows · 5 columns · 12ms       │  │
  │  └──────────────────────────────────────┘  │
  └───────────────────────────────────────────┘
          │
  ┌───────┴───────────────────────────────────┐
  │  🔄 Turn 2                                │
  │  ┌──────────────────────────────────────┐  │
  │  │ 💭 Thinking...                       │  │
  │  │ "I need to group spending by         │  │
  │  │  category to find the highest."      │  │
  │  └──────────────────────────────────────┘  │
  │  ┌──────────────────────────────────────┐  │
  │  │ 🔧 analyse                           │  │
  │  │ group · Amount · by Category         │  │
  │  │ ✅ 7 groups returned · 3ms           │  │
  │  └──────────────────────────────────────┘  │
  └───────────────────────────────────────────┘
          │
  ┌───────┴───────────────────────────────────┐
  │  💬 Answer                                │
  │                                           │
  │  Your biggest spending category was       │
  │  **Groceries** at **£287.43**, followed   │
  │  by Dining Out at £148.90. Together they  │
  │  account for 62% of your total spending.  │
  │                                           │
  │  ┌──────────────────────────────────────┐  │
  │  │ 3 turns · 2 tool calls · 4.2s       │  │
  │  └──────────────────────────────────────┘  │
  └───────────────────────────────────────────┘

  [Ask another question]  ← returns to State 2

Step animations:
  - Each step card slides in from below with a gentle fade
    (Framer Motion, spring physics, staggered)
  - Tool call cards show a subtle pulsing border while waiting
    for the result
  - When the result arrives, the pulse stops and a checkmark
    appears with a micro-animation
  - The answer card has a distinct visual treatment — larger
    text, slight green accent border, the final word

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — VISUAL DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The design should feel like a dev tool that a designer touched.
Think: Linear, Vercel dashboard, Raycast. Not corporate. Not
playful. Precise.

Colour system (dark mode only for v1):
  --bg:            #09090B     (zinc-950)
  --bg-surface:    #18181B     (zinc-900)
  --bg-elevated:   #27272A     (zinc-800)
  --border:        #3F3F46     (zinc-700)
  --border-subtle: #27272A     (zinc-800)
  --text:          #FAFAFA     (zinc-50)
  --text-muted:    #A1A1AA     (zinc-400)
  --text-faint:    #71717A     (zinc-500)
  --accent:        #22C55E     (green-500)
  --accent-muted:  rgba(34,197,94,0.1)
  --tool-blue:     #3B82F6
  --tool-blue-bg:  rgba(59,130,246,0.08)
  --thinking-amber:#F59E0B
  --thinking-bg:   rgba(245,158,11,0.06)
  --error:         #EF4444

Typography:
  Headings: Inter or system-ui, 600 weight
  Body: Inter or system-ui, 400 weight
  Code/tool names: JetBrains Mono or monospace

Agent step card styling:
  - Tool calls: left border accent in --tool-blue
  - Thinking: left border accent in --thinking-amber
  - Results: checkmark icon in --accent (green)
  - Answer: full green-500 left border, slightly larger padding
  - Each card: bg-surface, rounded-lg, subtle border

Dropzone:
  - Dashed border in --border
  - On drag-over: border becomes --accent, background becomes
    --accent-muted, scale(1.01) transform
  - After upload: solid border, file icon + name + stats

Question chips:
  - bg-elevated, rounded-full, border
  - Hover: border-accent, bg-accent-muted
  - Each chip has a subtle emoji prefix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — THE use-agent HOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The custom hook manages the full lifecycle:

```typescript
const {
  status,        // 'idle' | 'uploading' | 'ready' | 'running' | 'done' | 'error'
  steps,         // AgentStep[] — the feed items
  answer,        // string | null — final answer text
  stats,         // { turns, toolCalls, durationMs } | null
  error,         // string | null
  uploadCsv,     // (file: File) => Promise<void>
  askQuestion,   // (question: string) => void
  reset,         // () => void — back to upload state
  csvInfo,       // { name, rows, columns } | null
} = useAgent()
```

The hook:
  - Parses the CSV client-side with papaparse on upload
  - Sends csvData + question to /api/agent via fetch
  - Reads the NDJSON stream line by line
  - Pushes each event into the steps array (triggers re-render)
  - Sets answer when the "answer" event arrives
  - Sets stats when the "done" event arrives
  - Handles errors gracefully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — POLISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After the core UI works:

1. Auto-scroll: the feed should scroll to keep the latest step
   visible as new steps stream in

2. Keyboard: Enter submits the question, Escape clears the input

3. Loading states: skeleton pulse on the answer card while the
   agent is still working

4. Mobile: full responsive at 375px — single column, smaller
   chips, full-width dropzone

5. "Ask another question" after an answer: returns to State 2
   with the same file loaded, clears the feed

6. Error boundary: if the API route fails mid-stream, show the
   last successful step + an error card at the bottom

7. Metadata footer on the answer card:
   "3 turns · 2 tool calls · 4.2s" in muted text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT NOT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Do not rewrite the agent loop from scratch — extract and reuse
- Do not break the CLI version — it must still work via
  node agent.js data/transactions.csv "question"
- Do not add authentication — this is a local/demo tool
- Do not add a database — everything is in-memory per request
- Do not add light mode — dark only for v1
- Do not use server components for the main page — the streaming
  state requires a client component
- Do not batch stream events — send each event the moment it
  happens so the UI updates in real time
- Do not use WebSockets — NDJSON over a standard fetch stream
  is simpler and works on Vercel
- Do not show raw JSON in the UI — every tool call and result
  must be formatted into readable text
- Do not skip Framer Motion — the step-by-step reveal animation
  is what makes the agent feel alive

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 0: Read existing code, state findings
Phase 1: Present architecture plan, wait for confirmation
Phase 2: Set up Next.js project, install dependencies, configs
Phase 3: Build /api/agent streaming route
Phase 4: Build all components and the three UI states
Phase 5: Apply visual design system
Phase 6: Build the useAgent hook, wire everything together
Phase 7: Polish — animations, scroll, keyboard, mobile, errors

Do not skip phases. Do not combine phases. Present each phase
and confirm it works before moving to the next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
START WITH PHASE 0 NOW — READ THE EXISTING CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━