# ProductLab AI

A browser-based Product Management simulation built in the existing React + TypeScript + Vite project. Run **Pulse**, a fictional $12/month B2C wellness subscription product, and learn through decisions, consequences, targeted practice, and transfer.

**Scenario → Decision → Consequences → Skill Gap → Micro-Lesson → Transfer Challenge → Progress Update**

The brand remains ProductLab AI, but the application uses **no runtime AI**, model downloads, GPU requirements, backend, external database, authentication, analytics, or paid API. All feedback comes from original, explicit decision rules. Only React and React DOM are runtime dependencies.

## The experience

- **Dashboard:** live simulation metrics, current stage, competency evidence, recommended/available learning, and Continue Simulation.
- **Simulation:** three connected decisions—Retention Crisis, Segment Investigation, and Product Decision—with four options each, budget trade-offs, feedback, skill evidence, and a decision journal.
- **Personalized Learning:** an approximately five-minute lesson, _Diagnosing a Retention Drop_, assigned when a decision reveals a diagnosis gap. It is optional practice for learners who have not shown a gap.
- **Progress & Feedback:** decisions, mistake categories, criterion-level evidence, lesson status, transfer results, and recorded reflections. No professional grades or claims of mastery.

The micro-lesson teaches **Verify → Localize → Explain → Act** through three interactive checks and a new D7 onboarding transfer challenge. The challenge requires a next step, supporting evidence, and a conditional action. All three structured selections must meet the visible rubric to pass. An optional written reflection is saved but is not automatically graded. Failed attempts can be retried; only the latest attempt contributes to competency evidence.

Choices become final when checked/confirmed. A lesson’s first checked answers remain in the record; the transfer challenge is the opportunity to apply what was learned. Reading a lesson alone awards no competency evidence. Recommended learning does not block continuing the simulation.

## Fictional economy and evidence

| Metric                 | Initial state       | Rule                                                                                                                                                                           |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MRR                    | $48,000             | 4,000 current subscriptions × $12. Recurring concessions reduce MRR; the scripted acquisition cycle adds gross subscription MRR.                                               |
| D30 activity retention | 21%, previously 28% | The latest fully matured cohort has 210 / 1,000 active users on day 30. Investigation or repair choices do not alter this historical observation.                              |
| CAC                    | $42                 | Latest acquisition spend of $42,000 / 1,000 new paying subscribers. A new scripted acquisition cycle can replace this observed CAC.                                            |
| Cash                   | $120,000            | Stated action costs are paid upfront and deducted exactly once. MRR is a run rate, not immediate cash. Other operating costs and churn forecasts are outside this small model. |

The cohort table reconciles exactly: applying prior channel rates to the new mix yields 24%. Mix contributes 4 percentage points of the overall decline; paid-social deterioration contributes the other 3. Paid-social Android then narrows the investigation without proving a causal retention impact.

The third scenario offers a clearly labeled, fixed acquisition outcome: $30,000 spend acquires 600 new $12 subscriptions, adding $7,200 gross MRR at $50 CAC. This advances a scripted acquisition cycle rather than predicting real performance. The new cohort has not matured to D30. Other actions are costs, investigations, or interventions without an assumed positive business outcome. Two selected discounts are additive in this model and never exceed 30% of list price for the 400 eligible subscriptions.

Competency bars count demonstrated behaviors out of the opportunities available in this learning loop. Empty space includes activities not attempted. The five competencies are Product Analytics, Problem Discovery, Experimentation, Prioritization, and Business Thinking. Each criterion can contribute at most once per source; transfer retries replace rather than stack evidence. A correct answer is one practice signal, not proof of mastery.

## Use through GitHub, with no local installation

The existing public repository deploys to **GitHub Pages**. In **Settings → Pages**, keep **Source: GitHub Actions**.

1. Merge a reviewed change into `main`.
2. Wait for **Actions → Build and publish ProductLab AI** to finish successfully.
3. Open the URL shown in the `github-pages` deployment.

Pull requests build and run the automated tests. Pushes to `main` build, test, and publish `dist/`. Existing `main` can also be published with **Actions → Build and publish ProductLab AI → Run workflow**. Relative asset paths support `/ProductLab-AI/`. Open the HTTPS site rather than a downloaded HTML file via `file://`.

## Run locally

Use Node.js 24 LTS (also compatible with Node 20.19+ or 22.12+) and npm. From the folder containing `package.json`:

```sh
npm install
npm run dev
```

Keep the terminal open and open the **exact localhost URL printed by Vite**, normally `http://localhost:5173/`. You do not need a particular GPU or a model download. A current browser with JavaScript and localStorage is sufficient. If storage is disabled, the app remains playable and warns that progress is not retained.

For a reproducible install, use `npm ci` instead of `npm install`.

## Persistence

The versioned `productlab.progress` localStorage record stores the current view/scenario, confirmed decisions, lesson step and answers, recent transfer attempts and notes, and derived metric/competency summaries. On load, canonical choices are validated and replayed; stored summaries are never trusted. Corrupted, unknown-version, invalid-option, duplicate, and nonsequential saves recover to a fresh session with an explanatory notice.

Progress survives closing and reopening the browser on the **same site, browser profile, and device**. Clearing site data, switching origin/profile, or a private session can remove or separate progress. There is no cross-device synchronization. Transfer history retains the latest 20 attempts. Unsubmitted radio selections and reflection edits are drafts in the current tab; only confirmed choices/challenges persist. Do not run competing sessions in multiple tabs; the most recent save wins.

Use **Restart simulation** to clear this simulation’s decisions, lesson progress, transfer attempts, and metrics after confirmation. It does not clear unrelated website storage.

## Build and test

```sh
npm run build
# Once, if Chromium is not installed:
npx playwright install chromium
npm test
```

`build` runs strict TypeScript checking and emits static files in `dist/`. `npm run preview` serves the production build. Playwright starts a production preview on port 4173, uses `/usr/bin/chromium` when available or its installed browser, and supports `CHROMIUM_PATH` for another Chromium executable. GitHub Actions installs Playwright’s browser and OS dependencies before running checks.

The automated checks cover:

- Cohort totals and the 4 pp / 3 pp decomposition.
- Every one of the 64 simulation paths, one-time spending, explicit MRR/CAC changes, and unchanged historical D30.
- All 36 transfer combinations and the visible pass rubric.
- Gap assignment, sequential lessons, and prevention of duplicate/retry evidence inflation.
- Valid save replay and rejection of corrupted, outdated, invalid, or nonsequential saves.
- The complete decision → lesson → failed/passed transfer → continued simulation journey.
- Reload/new-tab persistence, blocked storage, restart cancellation/confirmation, keyboard controls, and mobile overflow.

Desktop and mobile layouts are inspected in headless Chromium. Real Safari/Firefox, screen-reader behavior, long-term storage eviction, and concurrent tabs are not claimed as validated. There is no model inference or external service to test.

## Code map

- `src/content.ts`: original scenario/lesson content, decision options, criteria, tags, and economic assumptions.
- `src/simulation.ts`: deterministic transitions, economy, lesson assignment, transfer rubric, and competency evidence.
- `src/storage.ts`: versioned validation, recovery, replay, and persistence.
- `src/App.tsx`: four views and shared accessible controls.
- `src/styles.css`: responsive styling using the existing system fonts, purple palette, and card treatment.
- `tests/`: calculation and production-browser checks.

This is one complete learning loop, not a general course platform. The economy is intentionally small, feedback reflects predefined choices, and there is no free-text AI scoring.
