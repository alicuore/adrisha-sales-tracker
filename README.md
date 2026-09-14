# Adrisha's Sales Tracker

> **AI-Powered Livestream Analytics Platform**

---

## 🚀 Vision

Adrisha's Sales Tracker is successful when the entire reporting workflow is automated, requiring only a single human decision:

**Approve** or **Reject**.

---

## 🎯 Mission

Eliminate repetitive work while preserving human judgment.

The platform is designed to automate livestream reporting from screenshot collection through OCR, validation, history tracking and dashboard publishing, while ensuring every published change is approved by the Product Owner.

---

## ✨ Core Principles

- Human approval always comes first.
- Automation assists, not replaces.
- Every change must be traceable.
- One Single Source of Truth.
- One sprint at a time.

---

## 📊 Current Workflow

```
Screenshot
      │
      ▼
OCR Extraction
      │
      ▼
Business Rules
      │
      ▼
Approval Required
      │
      ▼
Database
      │
      ▼
Dashboard
      │
      ▼
GitHub Pages
```

---

## 🏗 Current Features

- Livestream Dashboard
- Monthly Sales Tracking
- GMV Monitoring
- Session Tracking
- GitHub Pages Deployment

---

## 🚧 Planned Features

- OCR Screenshot Import
- Automatic Session Detection
- GMV Update Detection
- Approval Workflow
- Audit History
- Change Log
- Dashboard Analytics
- Mobile Responsive Dashboard
- AI-assisted Validation

---

## 📁 Repository Structure

```
adrisha-sales-tracker/

├── index.html
├── README.md

Future

├── docs/
├── assets/
├── dashboard/
├── data/
└── tools/
```

---

## 🛣 Development Roadmap

- ✅ Sprint 1 — Development Environment
- ✅ Sprint 2 — Product Vision & Architecture
- 🚧 Sprint 3 — Git Workflow
- ⏳ Sprint 4 — Documentation
- ⏳ Sprint 5 — OCR Engine
- ⏳ Sprint 6 — Approval Workflow
- ⏳ Sprint 7 — Automation

---

## 👥 Project Roles

### Product Owner

Ali Zainal Abidin

Responsible for:

- Business Rules
- Final Approval
- Product Direction

---

### Project Manager / Software Architect

OpenAI ChatGPT

Responsible for:

- System Architecture
- Software Design
- Technical Planning
- Development Guidance

---

## 📜 License

Private project.

Developed as a personal productivity platform.

---

> **"The goal is not full automation. The goal is to automate everything except the final business decision."**
## V2 dashboard data (dashboard-v2)

The read-only dashboard loads `data/manifest.json`, then
`data/config/business-rules.json` and every month listed in the manifest.
`js/data-layer.js` validates the complete load before providing a compatibility
adapter to the existing views. Requests use `cache: no-store`; a failed request
or invalid dataset displays an error without any embedded or browser-data fallback.
Reload the page to obtain subsequently published JSON changes.

GMV sums use integer cents. Salary uses approved payroll seconds, independently
of session durations. Business rules supply the hourly rate, 120-hour target,
and commission tiers. Actual sessions take precedence over planned attendance.
The JSON schedule is preserved, including multiple slots per day.

Add/Edit/Delete and payroll editing have been removed. All legacy `eskayvie_*`
localStorage keys are removed where browser permissions allow. No business data
is read from or written to localStorage. Unrelated browser preferences are left alone.

Run checks with Node.js:

```sh
node tests/validate-data.mjs
node --test tests/*.test.mjs
```

`tests/fixtures/legacy-phase1.js` is the frozen pre-adapter migration reference
from commit `b7414e44fd895cf410bed4229ca11adc79b69d8a`. It contains the legacy
PRELOADED dataset and schedules solely for independent Phase 1 reconciliation;
it is never loaded by the dashboard. January–August also retain their separate
frozen historical baseline. Future approved live-data updates should update
appropriate tests explicitly, not silently overwrite historical baselines.

Serve the repository through a local HTTP server for browser testing (not
`file://`). Chart.js and fonts retain the existing external CDN dependencies.
Phase 2 is developed on `dashboard-v2`; merging/deploying production is separate.
