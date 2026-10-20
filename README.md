# ProductLab AI

An original Product Management practice workspace in the existing React + TypeScript + Vite app. **Pulse** is a fictional $12/month B2C wellness subscription product. Sprint 2A replaces the linear three-decision interface with one connected **Retention Crisis** mission, designed for approximately 15–20 minutes.

The application has **no runtime AI**, WebLLM, model downloads, GPU requirement, API keys, backend, authentication, database, tracking service, or paid API. React and React DOM remain the only runtime dependencies. No dependencies were added for this sprint.

## The workspace

Three product areas organize the app: **Simulation Workspace**, **PM Playbook**, and **My Development**. The workspace contains six freely accessible working areas:

- **Mission Brief:** objectives, constraints, context, and the current evidence notebook.
- **Analytics:** channel, platform, and joint retention dimensions; cohort windows and maturity; acquisition mix; trial conversion, spend, and CAC; subscription stock, MRR, churn, ARPA, and simplified unit economics.
- **User Research:** targeted interview reports and session notes. Classify observed pain separately from unvalidated explanations and causal claims.
- **Team Inbox:** original CEO, Analyst, Growth, and Engineering messages; assemble a structured CEO response.
- **Product Backlog:** select and reorder work within a shared $12,000 budget and eight engineering days.
- **Decision Brief:** cite collected sources, state hypotheses and confidence, recommend the highest-priority action, explain trade-offs, and choose measures, guardrails, owners, and checkpoints. Download a draft or committed brief as Markdown.

Explore tools in any order. Add sources to the notebook where you inspect them, then choose which to cite. Drafts save automatically. Reading evidence costs nothing. A brief requires at least two collected citations, hypotheses, a feasible prioritized plan, an acquisition rationale, trade-offs, measures, and accountability. Missing investigations or stakeholder reasoning appear as gaps in the review; the app does not require perfect answers to finish.

A small acquisition decision allocates up to four $1,500 test blocks across organic, partner referrals, and paid social, or deliberately holds spend. Channel projections assume recent acquisition costs and conversion continue. They are **planning estimates**, never observed conversions or automatic business gains.

## Evidence and economics

The fictional case snapshot is **20 October 2026**. Measurement periods and denominators appear in the app:

| Measurement                                 | Previous      | Latest        |
| ------------------------------------------- | ------------- | ------------- |
| Seven-day trial starts                      | 25–31 July    | 25–31 August  |
| First paid subscription starts              | 1–7 August    | 1–7 September |
| D30 fully observed through                  | 6 September   | 7 October     |
| New paid / day-30 active                    | 1,000 / 280   | 1,000 / 210   |
| D30 activity retention                      | 28%           | 21%           |
| Attributed acquisition spend / new-paid CAC | $30,000 / $30 | $42,000 / $42 |

Both cohorts are fully mature. Activity means the same validated active-session event in both periods, measured on day 30 after the first paid start. Conversion uses trial starts as its denominator; retention and CAC use new paid subscribers. Channel and platform intersections reconcile to the same cohort totals.

Applying previous channel retention rates to latest channel weights gives **24%**: the stated reference decomposition is **4 percentage points from mix and 3 from within-channel deterioration**, totaling the observed seven-point decline. This reference convention is not causal attribution. The joint table localizes deterioration to paid-social Android, from 15% to 5%; aggregate platform rates also contain mix effects.

The separate **1–30 September billing ledger** has 3,200 opening paid subscriptions + 1,000 new − 200 cancellations = **4,000 closing subscriptions**. There are no other new subscriptions, discounts, or expansion in this month. At $12 per account, MRR rises from $38,400 to **$48,000**, despite falling activity retention. Monthly subscriber churn is 200 / 3,200 = **6.25%**; subscription retention is **93.75%**. Simplified gross-profit LTV is $12 × 80% margin / 6.25% = **$153.60**; LTV/CAC is approximately **3.66×**. These constant-rate models are educational estimates, not measured lifetime outcomes or proof of profitable growth.

| Mission metric         | Actual consequence                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MRR                    | Remains the historical $48,000; no delivery or conversion result is invented.                                                                                   |
| D30 activity retention | Remains the latest mature cohort's 21%. New post-change cohorts have not matured.                                                                               |
| CAC                    | Remains historical $42. Forecast CAC is displayed separately.                                                                                                   |
| Cash                   | Starts at $120,000 and pays the documented initiative and acquisition-test costs **once on submission**. Historical spend is already reflected in opening cash. |

Engineering capacity, acquisition-test blocks, and the whole-plan budget are hard submission constraints. A good method does not manufacture a business lift. The Mission Review distinguishes observations, hypotheses, decisions, costs, and actual simulated outcomes. A committed brief and its evidence snapshot are frozen; later reading cannot rewrite the review or charge cash again. Restarting the mission starts a separate attempt without clearing optional practice or earlier-cycle history.

## Review and help

The explicit rubric contains two checks for each of eight competencies:

1. Product Analytics
2. Business & Growth
3. Product Discovery
4. Experimentation
5. Product Strategy
6. Prioritization & Delivery
7. Stakeholder Management
8. Product Leadership

Review checks use structured investigation notes, relevant citations, research classification, portfolio choices, acquisition rationale, CEO communication, and brief fields. Each check explains its evidence and reasoning gap. Optional prose is saved and downloadable but **never automatically evaluated**. Results are evidence from one mission, not professional grades or proof of mastery. Learning recommendations respond to the recorded gaps.

The global **Cheat Sheet** opens over the current area without changing it. It covers retention, maturity, conversion, CAC, MRR, ARPA, subscriber churn/retention, simplified LTV and ratio assumptions, A/B testing, guardrails, Verify → Localize → Explain → Act, discovery, Jobs to Be Done/opportunity mapping, and prioritization. Contextual metric tooltips use the same definition source and support hover, keyboard, and touch. Escape dismisses help; the modal dialog contains keyboard focus and returns it when closed.

The original retention lesson and D7 transfer challenge remain **optional practice** in PM Playbook and recommendations. Lessons retain checked answers; transfer retries replace rather than accumulate evidence. They do not rewrite the mission rubric or spend its budget. The old deterministic scenario calculations remain only for interpreting archived progress and regression checks; the active workspace has no linear scenario sequence.

## Persistence and migration

The `productlab.progress` localStorage record now uses version **2**. It stores the selected product/working area, mission draft, notebook, committed snapshot, and retained practice history. Canonical fields are validated; business metrics and rubric results are recomputed instead of trusting stored summaries.

Valid version-1 saves migrate automatically. Previous decisions, reconstructed business outcomes, checked lesson answers, and transfer attempts remain visible in **My Development**. The new mission gets a separate budget, so earlier action costs are not reapplied. Unreadable, invalid, or unsupported-version saves start a fresh mission with a notice and retain the raw record under `productlab.progress.recovery` when storage allows. Incorrect numeric investigation notes are valid drafts rather than a reason to discard progress.

Progress persists on the **same site origin, browser profile, and device**. Clearing site data, private browsing, eviction, or changing origin can remove or separate it. There is no cross-device sync or simultaneous-tab coordination; the latest save wins. Blocked/full storage shows a warning while the current tab stays usable. Restart requires confirmation and resets this workspace mission only.

## Use entirely through GitHub

The public repository publishes to **GitHub Pages**. Keep **Settings → Pages → Source: GitHub Actions**.

1. Merge a reviewed change into `main`.
2. Wait for **Actions → Build and publish ProductLab AI** to pass.
3. Open the `github-pages` deployment URL: <https://a-loha.github.io/ProductLab-AI/>.

Pull requests build and run tests; successful `main` pushes build, test, and publish `dist/`. **Run workflow** can republish `main`. Relative asset paths support `/ProductLab-AI/`. Open the HTTPS site; double-clicking `index.html` with `file://` does not run the Vite source application. No local installation is needed to use the deployed app.

## Run locally

Use Node.js 24 LTS (also compatible with Node 20.19+ or 22.12+) and npm. In the actual project folder containing `package.json`:

```sh
npm install
npm run dev
```

Keep the terminal open and open the **exact localhost URL printed by Vite**, normally `http://localhost:5173/`. Use `npm ci` instead of `npm install` for a reproducible dependency installation.

```sh
npm run build
# Once, if a Chromium test browser is not installed:
npx playwright install chromium
npm test
```

`build` performs strict TypeScript checks and emits static files to `dist/`. `npm run preview` serves that build. Tests use production output, so rebuild after source edits. Playwright starts its preview on port 4173 and uses `/usr/bin/chromium` when available, its installed browser otherwise, or `CHROMIUM_PATH` for an explicit executable. GitHub Actions installs browser dependencies before testing.

Automated checks cover reconciled datasets, all 125 bounded-input marketing allocations, coherent and inconsistent rubric submissions, alternatives/holds, costs and immutable reviews, non-linear investigation orders, full mission completion, brief download, shared help with keyboard/touch interactions, mobile overflow, saved drafts/reviews, full browser relaunch, v1 migration, corrupted/blocked storage, restart, and optional practice. Existing regression checks retain all 64 legacy scenario paths and 36 transfer combinations.

Desktop and mobile layouts are inspected in headless Chromium, including a static `/ProductLab-AI/` subpath. **Real Safari/Firefox, assistive technology, physical touch devices, simultaneous tabs, and long-term storage eviction still need manual testing.** The 15–20 minute duration is a design target and needs learner testing. No usability study or general learning-effectiveness claim is implied.

## Scope and code map

Retained: the React/TypeScript/Vite stack, purple visual identity, Pages workflow, deterministic calculations, optional retention lesson/transfer, valid legacy history, and relevant regression coverage.

Deliberately outside Sprint 2A: a comprehensive Playbook, more missions, a generalized workflow/CMS/scoring engine, a large marketing simulator, live team messaging, automatic free-text scoring, AI, accounts, backend services, cross-device sync, and invented post-launch outcomes.

- `src/mission-content.ts`: original case data, evidence, messages, structured choices, and shared glossary.
- `src/mission.ts`: calculations, constraints, submission snapshots, and eight-competency rubric.
- `src/App.tsx`: product-area navigation and local state.
- `src/Workspace.tsx`: six tools and Decision Brief.
- `src/Development.tsx`: Mission Review, recommendations, and archived history.
- `src/Help.tsx`: shared tooltips and Cheat Sheet.
- `src/Practice.tsx`, `src/content.ts`, `src/simulation.ts`: retained optional practice and legacy history rules.
- `src/storage.ts`: validation, migration, recovery, and persistence.
- `src/ui.tsx`, `src/styles.css`: shared controls and responsive presentation.
- `tests/`: pure calculation/state tests and production-browser journeys.
