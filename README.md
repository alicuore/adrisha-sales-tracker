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

Routine sales publishing does not require Codex or local tests:

1. Upload the screenshot or confirmed sales data to the monthly ChatGPT sales-tracking chat.
2. Verify the proposed additions, corrections, expected monthly total and expected approved payroll, then copy the complete JSON payload.
3. On GitHub, open **Actions → Publish sales update → Run workflow**, keep `main` selected, paste the JSON into the single payload field and run it.
4. Wait for the workflow to pass. It validates the payload, changes only the current open month, runs production validation and all tests, then commits directly to `main` if `main` has not changed during the run.
5. GitHub Pages publishes the dashboard; reload it and confirm the totals.

The single publisher accepts batches containing `correct_gmv` and `add_session` changes. A correction preserves every session field except `gmvCents`. A new session adds its `durationSeconds` to approved payroll. Both resulting totals must exactly match the payload safeguards. Routine publishing should not use Codex, a local computer or the GitHub file editor.

Direct commits to `main` also trigger validation, but that check runs after the commit and does not provide the publisher's pre-commit safeguards. Use **Publish sales update** for routine sales changes. Use pull requests for development, schema, business-rule, schedule, attendance or historical changes.

Codex remains useful for dashboard development, new month setup, schema changes and bug fixes.

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

GitHub Actions runs these same commands on pushes and pull requests affecting any `data/**/*.json`, `js/**`, `index.html`, `tests/**`, or the validation workflow itself. This includes future monthly JSON files, the manifest, business rules, and historical fixtures. It can also be run manually from the Actions tab once available on the default branch. The separate **Publish sales update** workflow runs the same checks before it commits a routine current-month update. Both use Node.js 24 with no dependency installation. README-only changes do not trigger validation. Preview the dashboard through a local HTTP server so JSON fetches work normally.

## Project Roles

### Product Owner

Ali Zainal Abidin is responsible for business rules, data approval, product direction and final human approval before production changes.

### AI Development Partner

ChatGPT / Codex by OpenAI provides architecture and technical guidance, payload preparation, validation support and development assistance. Codex handles development under human direction; routine approved sales updates are published through the phone-friendly GitHub Action without Codex.

## Deployment

- Production branch: `main`
- Hosting: GitHub Pages
- Production updates are pushed to `origin/main`.
- Routine sales updates normally modify only the relevant monthly JSON.
- `index.html` should change only for deliberate dashboard UI/application changes.

## Future Improvements

- Further workflow automation while preserving human approval.

Built as a personal productivity project. Human approval remains the final gate before production changes.
