# Adrisha's Sales Tracker

A personal livestream sales, GMV, payroll and commission tracking dashboard built by Ali with ChatGPT Codex and deployed through GitHub Pages.

[Live dashboard](https://alicuore.github.io/adrisha-sales-tracker/)

## Current Status

Dashboard V2 is live in production on `main`. The dashboard:

- Loads authoritative business data from JSON.
- Is read-only in the browser and does not use localStorage as a business-data source.
- Automatically reflects published GitHub data when opened or reloaded.
- Supports monthly tracking, comparison, yearly overview and schedules.
- Is responsive for desktop and mobile.

## Current Workflow

```text
Sales screenshot / confirmed sales data
        ↓
Monthly ChatGPT sales-tracking chat
        ↓
Sales, sessions, payroll and commission verified
        ↓
ChatGPT generates a CODEX UPDATE PROMPT
        ↓
Codex updates the relevant monthly JSON
        ↓
Repository validation/tests
        ↓
Human approval
        ↓
Commit + push to origin/main
        ↓
GitHub Pages updates the live dashboard
```

During weekends or periods without laptop access, the latest Codex prompt may contain all unpublished changes cumulatively. Existing sessions are corrected in place rather than duplicated.

## Source of Truth

- Published business data: `data/2026/*.json`
- Business rules: `data/config/business-rules.json`
- Month list: `data/manifest.json`

GMV is stored as integer cents. Durations and payroll are stored as integer seconds. Approved payroll hours are independent from summed session duration.

Browser localStorage cannot override published business data. Actual livestream sessions take precedence over planned leave/off status.

## Historical Protection and Live-Month Validation

January–August 2026 are frozen historical periods protected by historical baseline validation. Frozen periods are identified by `baseline.frozenPeriods` and must not silently change.

The current live month can receive legitimate new sessions and GMV corrections without updating frozen fixtures. Live-month updates still undergo schema, duplicate-ID, schedule, attendance, totals and business-rule validation.

## Repository Structure

```text
adrisha-sales-tracker/
├── index.html
├── README.md
├── js/
│   └── data-layer.js
├── data/
│   ├── manifest.json
│   ├── config/
│   │   └── business-rules.json
│   └── 2026/
│       ├── 01-january.json
│       ├── 02-february.json
│       ├── 03-march.json
│       ├── 04-april.json
│       ├── 05-may.json
│       ├── 06-june.json
│       ├── 07-july.json
│       ├── 08-august.json
│       └── 09-september.json
└── tests/
    ├── validate-data.mjs
    ├── calculations.test.mjs
    ├── data-layer.test.mjs
    ├── historical-baseline.json
    └── fixtures/
        └── legacy-phase1.js
```

The legacy fixture is a test-only migration reference; the dashboard does not load it.

## Validation

Run the existing checks with Node.js:

```sh
node tests/validate-data.mjs
node --test tests/*.test.mjs
```

Routine production updates should pass validation before being committed and pushed. Preview the dashboard through a local HTTP server so JSON fetches work normally.

## Project Roles

### Product Owner

Ali Zainal Abidin is responsible for business rules, data approval, product direction and final human approval before production changes.

### AI Development Partner

ChatGPT / Codex by OpenAI provides architecture and technical guidance, data-update instructions, validation support and development assistance. Code and repository changes are performed through Codex under human direction.

## Deployment

- Production branch: `main`
- Hosting: GitHub Pages
- Production updates are pushed to `origin/main`.
- Routine sales updates normally modify only the relevant monthly JSON.
- `index.html` should change only for deliberate dashboard UI/application changes.

## Future Improvements

- Easier phone-friendly publishing.
- Reduced dependence on a local computer for routine updates.
- Further workflow automation while preserving human approval.

Built as a personal productivity project. Human approval remains the final gate before production changes.
