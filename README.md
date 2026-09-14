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
2. Verify sales, sessions, approved payroll and commission, then approve the exact proposed changes.
3. Fetch the latest monthly JSON from GitHub. Update only that month, preserving existing session IDs and correcting existing sessions in place rather than duplicating them.
4. Use a GitHub connection with confirmed write capability to commit the approved JSON to a branch and open a pull request. If that connection cannot write, use GitHub's web editor from a phone or computer to apply the approved JSON and create the pull request.
5. Wait for **Validate production data / Validate JSON and run tests** to pass, review the diff, and merge into `main`.
6. GitHub Pages publishes the dashboard; reload it and confirm the totals.

The GitHub Actions workflow adds validation, not a ChatGPT-to-GitHub publishing integration. A connection that only reads GitHub cannot publish updates.

Direct commits to `main` also trigger validation, but the check runs after the commit and does not prevent GitHub Pages from publishing invalid data. Prefer pull requests. To enforce validation before merging, configure a branch protection rule or ruleset for `main` requiring the validation check. This repository change does not configure that rule or change Pages deployment. Because the workflow uses path filters, unrelated pull requests skip it; account for this before making the check required for every pull request.

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

GitHub Actions runs these same commands on pushes and pull requests affecting any `data/**/*.json`, `js/**`, `index.html`, `tests/**`, or the validation workflow itself. This includes future monthly JSON files, the manifest, business rules, and historical fixtures. It can also be run manually from the Actions tab once available on the default branch. It uses Node.js 24 with no dependency installation and read-only repository permissions. README-only changes do not trigger it. Preview the dashboard through a local HTTP server so JSON fetches work normally.

## Project Roles

### Product Owner

Ali Zainal Abidin is responsible for business rules, data approval, product direction and final human approval before production changes.

### AI Development Partner

ChatGPT / Codex by OpenAI provides architecture and technical guidance, data-update instructions, validation support and development assistance. Codex handles development under human direction; routine approved JSON updates can be published through GitHub without Codex.

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
