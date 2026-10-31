# Adrisha's Sales Tracker

A private-first livestream operations system for sales, GMV, payroll, commission, schedules, Telegram reminders and daily reporting. Built by Ali with ChatGPT Codex, hosted with GitHub Pages and automated with GitHub Actions and Cloudflare Workers.

[Open the live dashboard](https://alicuore.github.io/adrisha-sales-tracker/)

## What Is Live

- Dashboard V2 on the `main` branch.
- Authoritative monthly data stored as version-controlled JSON.
- Phone-friendly sales publishing through GitHub Actions.
- Production validation before every routine sales update.
- Cloudflare Worker reminders four hours and one hour before each livestream.
- Automatic Telegram daily reports after a successful sales publish.
- On-demand Telegram commands for schedules, earnings, targets and analytics.
- Full command access for both the host and the configured administrator chat.
- Clickable persistent Telegram command buttons.
- Automatic active-month discovery from the production manifest.
- Start-time motivational messages with a non-repeating 40-message cycle.
- Commission-tier and RM10,000 GMV milestone celebrations.
- Private missing-report warnings 90 minutes after a scheduled livestream ends.
- Duplicate-report protection and explicit updated/corrected report labels.
- Optional private Telegram alerts when reminder or report delivery fails.

The dashboard is read-only in the browser. Browser local storage cannot override published business data.

## Routine Sales Workflow

1. Upload the screenshot or confirmed session data to the monthly sales-tracking chat.
2. Verify the proposed sessions or corrections, monthly GMV and approved payroll total.
3. Copy the complete JSON payload.
4. In GitHub, open **Actions → Publish sales update → Run workflow**.
5. Keep `main` selected, paste the payload and run the workflow.
6. The workflow validates the payload, updates only the active month, runs the complete production test suite and commits to `main` if the branch has not changed.
7. After the commit, the workflow calls the Cloudflare Worker and sends the daily Telegram report.
8. Reload the dashboard and confirm the published totals.

The publisher accepts batched `add_session`, `correct_gmv` and `correct_session_timing` operations. Approved payroll is authoritative and remains independent from summed session duration. Routine publishing should not use the GitHub file editor.

Use pull requests for application code, schema, business rules, schedules, attendance, historical data or automation changes.

## Telegram Bot

The Telegram bot is restricted to the configured host chat. Its English command menu provides:

| Command | Purpose |
| --- | --- |
| `/salary` | Estimated salary and commission |
| `/sales` | Total GMV, hours and tier progress |
| `/schedule` | Today's livestream schedule |
| `/tomorrow` | Tomorrow's livestream schedule |
| `/report` | Latest daily sales report |
| `/target` | GMV required for the next tier |
| `/week` | Current weekly summary, including cross-month weeks |
| `/month` | Current monthly summary |
| `/performance` | Sales performance insights |
| `/status` | Bot, storage, report and reminder status |
| `/menu` | Complete command list |

Commands also work without the leading `/`. Earlier Malay commands remain supported as hidden compatibility aliases.

The configured administrator chat receives the same operational commands plus private diagnostics:

| Admin command | Purpose |
| --- | --- |
| `/admin` | Administrator menu |
| `/health` | Production, configuration and storage health |
| `/next` | Next reminder or start-time motivation event |
| `/missing` | Check the latest completed schedule for a missing report |

### Reminder and Reporting Behaviour

- The four-hour reminder includes schedule and GMV milestone progress.
- The one-hour reminder contains the cleaner schedule-only message.
- One original motivational message is sent at the scheduled start time. Quotes do not repeat until the full pool is exhausted.
- Successful sales publishes send a daily report automatically.
- Crossing a new commission tier or RM10,000 GMV milestone sends a deduplicated celebration.
- If no report is recorded 90 minutes after the scheduled end, the administrator receives one private warning.
- Corrections are labelled `CORRECTED DAILY SALES REPORT`.
- Later non-correction republishes are labelled `UPDATED DAILY SALES REPORT`.
- The Worker stores a report signature in Cloudflare KV to prevent duplicate delivery, even across different commit SHAs.
- Salary and estimated earnings are shown only when requested with `/salary`.
- The Worker reads `data/manifest.json`, so changing the default month during the coordinated month-end rollover activates the new month without another Worker source edit.

## System Architecture

```text
Confirmed session data
        ↓
GitHub Actions publisher
        ↓
Validated monthly JSON on main
        ├──→ GitHub Pages dashboard
        └──→ Cloudflare Worker report endpoint
                    ↓
              Telegram bot

Cloudflare Cron + monthly schedules
        ↓
Reminder Worker + KV delivery state
        ↓
Telegram reminders
```

## Source of Truth

- Monthly sales, payroll and schedules: `data/2026/*.json`
- Active/default month and month list: `data/manifest.json`
- Payroll and commission rules: `data/config/business-rules.json`
- Reminder, bot and report logic: `cloudflare/adrisha-live-reminder-worker.mjs`

GMV is stored as integer cents. Durations and payroll are stored as integer seconds. Actual livestream sessions take precedence over planned attendance status.

Frozen historical periods are protected by baseline validation. The active month can receive approved sessions and corrections while still undergoing schema, duplicate-ID, schedule, totals and business-rule validation.

## Repository Structure

```text
adrisha-sales-tracker/
├── .github/workflows/
│   ├── publish-sales-update.yml
│   └── validate-data.yml
├── cloudflare/
│   ├── adrisha-live-reminder-worker.mjs
│   └── adrisha-live-reminder-worker.test.mjs
├── data/
│   ├── manifest.json
│   ├── config/business-rules.json
│   └── 2026/*.json
├── js/data-layer.js
├── scripts/publish-sales-update.mjs
├── tests/
├── index.html
└── README.md
```

## Validation

Run the production data checks:

```sh
node tests/validate-data.mjs
node --test tests/*.test.mjs
```

Run the Cloudflare Worker checks:

```sh
node --check cloudflare/adrisha-live-reminder-worker.mjs
node --test cloudflare/adrisha-live-reminder-worker.test.mjs
```

GitHub Actions runs the relevant validation on application and data changes. The routine publisher uses Node.js 24 and requires no dependency installation.

## Cloudflare Operations

The Worker health endpoint is:

```text
https://adrisha-live-reminder.alicuore.workers.dev/health
```

A healthy response reports Telegram, KV state, commands and reports as configured, together with the next reminder event.

Production configuration is stored only as Cloudflare bindings or encrypted secrets. Required names are:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `ADMIN_KEY`
- `REMINDER_STATE` KV binding

GitHub Actions uses the encrypted repository secret `REPORT_WEBHOOK_KEY`. In the current deployment it matches the Worker report authorization key. Never commit or paste secret values into source files, issues, pull requests or documentation.

Private administrator access and failure alerts use:

- `ADMIN_TELEGRAM_CHAT_ID`

When configured, the administrator receives system-failure alerts, missing-report warnings, full public command access and private diagnostic commands.

After deploying a new Worker command list, call the authenticated `/configure-telegram` endpoint once to refresh Telegram's webhook, administrator command scope and visible command menus.

## Deployment

- Production branch: `main`
- Dashboard hosting: GitHub Pages
- Reminder/report runtime: Cloudflare Workers
- Delivery state: Cloudflare KV
- Routine sales publishing: GitHub Actions

Dashboard application changes deploy from `main` through GitHub Pages. Worker source changes must also be deployed to the production Cloudflare Worker after merge.

## Project Roles

### Product Owner

Ali Zainal Abidin owns the business rules, data approval, product direction and final production approval.

### AI Development Partner

ChatGPT / Codex by OpenAI supports architecture, implementation, payload preparation, testing, validation and operations under human direction.

## Next Phase

- Add safer guided recovery actions for administrator alerts.
- Explore screenshot-to-publish automation while keeping human approval as the final gate.

Built as a personal productivity system. Human approval remains the final gate before production changes.
