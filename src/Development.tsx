import { skillNames } from "./content";
import { hypothesisOptions, initiatives } from "./mission-content";
import {
  competencyOrder,
  missionReview,
  missionMetrics,
  sourceLabel,
} from "./mission";
import type { Area, WorkspaceState } from "./mission";
import {
  evaluateTransfer,
  evidenceFor,
  lessonCompleted,
  metricsFor,
  optionFor,
} from "./simulation";
import { MetricLabel } from "./Help";
import { MissionMetrics } from "./Workspace";
import { Icon, Pill, money } from "./ui";

export function Development({
  state,
  go,
  practice,
}: {
  state: WorkspaceState;
  go: (area: Area) => void;
  practice: () => void;
}) {
  const submission = state.mission.submission,
    review = submission && missionReview(submission);
  const latest = state.practice.transferAttempts.at(-1),
    learningEvidence = evidenceFor({ ...state.practice, decisions: [] });
  return (
    <>
      {review && submission ? (
        <>
          <MissionMetrics mission={state.mission} />
          <section className="card mission-review-heading">
            <div>
              <span className="eyebrow">
                MISSION REVIEW · FIXED AT SUBMISSION
              </span>
              <h2>A product decision, with its reasoning made visible.</h2>
              <p>
                {review.demonstrated} of 8 competency areas demonstrated against
                this mission’s explicit criteria. This is evidence from one
                exercise, not a grade or claim of mastery.
              </p>
            </div>
            <Pill tone="green">Mission completed</Pill>
          </section>
          <div className="review-facts">
            <section className="card">
              <span className="eyebrow">OBSERVATIONS</span>
              <h3>The historical signal</h3>
              <p>
                D30 activity: 210 / 1,000 = 21%, previously 28%. Closing paid
                stock: 4,000. MRR: $48,000. Latest new-paid CAC: $42.
              </p>
              <details>
                <summary>Evidence available at submission</summary>
                <ul>
                  {submission.evidence.map((id) => (
                    <li key={id}>
                      {sourceLabel(id)}
                      {submission.draft.brief.evidence.includes(id)
                        ? " · cited"
                        : ""}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
            <section className="card">
              <span className="eyebrow">HYPOTHESES</span>
              <h3>What you believe may explain it</h3>
              <ul>
                {submission.draft.brief.hypotheses.map((id) => (
                  <li key={id}>
                    {
                      hypothesisOptions.find((option) => option.id === id)!
                        .label
                    }
                  </li>
                ))}
              </ul>
              <p>
                {submission.draft.brief.confidence === "unquantified"
                  ? "You kept retention effect sizes unquantified."
                  : "You claimed full causal certainty; revisit the supporting evidence."}
              </p>
            </section>
            <section className="card">
              <span className="eyebrow">DECISIONS</span>
              <h3>Your committed portfolio</h3>
              <ol>
                {submission.draft.initiatives.map((id) => (
                  <li key={id}>
                    {initiatives.find((item) => item.id === id)!.name}
                  </li>
                ))}
              </ol>
              <p>
                Acquisition-test allocation:{" "}
                {money(review.plan.marketing.spend)}. This starts a planned
                test; its conversions and channel outcomes have not been
                observed.
              </p>
            </section>
            <section className="card">
              <span className="eyebrow">COSTS & ACTUAL SIMULATED OUTCOMES</span>
              <h3>{money(review.plan.cost)} paid upfront</h3>
              <p>
                Cash: {money(missionMetrics(state.mission).cash)}.{" "}
                {review.plan.engineeringDays} engineering days reserved. No new
                MRR, CAC, or mature D30 result is booked.
              </p>
              <p>
                The simulated outcome now is a funded plan and a cash cost.
                Delivery, save success, conversion, and retention effects
                require a later observation; methodological quality does not
                create a business lift.
              </p>
            </section>
          </div>
        </>
      ) : (
        <section className="card development-intro">
          <span className="eyebrow">EVIDENCE, NOT PROFESSIONAL GRADES</span>
          <h2>Your Mission Review starts with a submitted decision.</h2>
          <p>
            Explore the workspace in your own order. After you submit a feasible
            Decision Brief, this area will separate business consequences,
            demonstrated competencies, reasoning gaps, and optional next
            practice.
          </p>
          <button className="button primary" onClick={() => go("decision")}>
            Open Decision Brief <Icon name="arrow" size={17} />
          </button>
        </section>
      )}
      <div className="section-heading activities-title">
        <h2>Eight competencies, one connected job.</h2>
        <MetricLabel term="framework">Investigation framework</MetricLabel>
      </div>
      <div className="competency-grid">
        {competencyOrder.map((skill) => {
          const criterion = review?.criteria.find(
              (item) => item.skill === skill,
            ),
            met = criterion?.checks.filter((check) => check.met).length ?? 0;
          return (
            <section className="card competency-card" key={skill}>
              <div className="section-heading">
                <h3>{skillNames[skill]}</h3>
                <Pill
                  tone={
                    !criterion
                      ? ""
                      : met === criterion.checks.length
                        ? "green"
                        : "amber"
                  }
                >
                  {!criterion
                    ? "Not assessed"
                    : `${met} / ${criterion.checks.length} checks`}
                </Pill>
              </div>
              {criterion ? (
                <ul className="criteria-list">
                  {criterion.checks.map((check) => (
                    <li key={check.label}>
                      <span
                        className={`criterion-marker ${check.met ? "met" : "missed"}`}
                      >
                        {check.met ? "✓" : "↗"}
                      </span>
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.why}</p>
                        <small>
                          {check.met
                            ? "Demonstrated"
                            : "Reasoning gap to revisit"}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  Assessed from your actual investigation, structured brief, and
                  team communication after submission.
                </p>
              )}
            </section>
          );
        })}
      </div>
      {review && (
        <section className="card recommendations">
          <span className="eyebrow">SPECIFIC NEXT STEPS · ALWAYS OPTIONAL</span>
          <h2>
            {review.gaps.length
              ? "Practice the gaps the mission revealed."
              : "Transfer the process to a different problem."}
          </h2>
          {review.recommendLesson && (
            <div>
              <h3>Diagnosing a Retention Drop</h3>
              <p>
                Revisit verification, segment comparisons, and causal
                uncertainty. Then apply the process to a D7 onboarding decline.
              </p>
              <button className="button secondary" onClick={practice}>
                Open optional retention practice
              </button>
            </div>
          )}
          {review.gaps.some((item) => item.skill === "business") && (
            <div>
              <h3>Reconcile acquisition and subscriber economics</h3>
              <p>
                In Analytics, compare Acquisition & Funnel with Subscription
                Economics. Recalculate CAC with new paid subscribers and MRR
                with the closing paid stock.
              </p>
              <button
                className="button secondary"
                onClick={() => go("analytics")}
              >
                Revisit Analytics
              </button>
            </div>
          )}
          {review.gaps.some((item) =>
            ["stakeholder", "leadership"].includes(item.skill),
          ) && (
            <div>
              <h3>Make a credible stakeholder commitment</h3>
              <p>
                Review the CEO and Engineering messages. Separate facts from
                uncertainty, make a bounded request, and name both an early
                safety checkpoint and a mature retention readout.
              </p>
              <button className="button secondary" onClick={() => go("inbox")}>
                Revisit Team Inbox
              </button>
            </div>
          )}
          {review.gaps.some((item) =>
            ["strategy", "prioritization"].includes(item.skill),
          ) && (
            <div>
              <h3>Explain what you defer, not just what you select</h3>
              <p>
                Review the initiative costs and engineering capacity. Connect
                your highest priority to the observed user problem and make the
                opportunity cost explicit.
              </p>
              <button
                className="button secondary"
                onClick={() => go("backlog")}
              >
                Revisit Product Backlog
              </button>
            </div>
          )}
          {!review.recommendLesson && (
            <div>
              <h3>Optional transfer challenge</h3>
              <p>
                A new D7 situation can test whether you apply the same process
                without repeating the same context.
              </p>
              <button className="button secondary" onClick={practice}>
                Open optional retention practice
              </button>
            </div>
          )}
        </section>
      )}
      <section className="card practice-history">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PRESERVED LEARNING HISTORY</span>
            <h2>Your optional practice</h2>
          </div>
          <Pill>
            {lessonCompleted(state.practice) ? "Lesson completed" : "Available"}
          </Pill>
        </div>
        <p>
          Lesson checks recorded:{" "}
          {Object.keys(state.practice.lesson.answers).length} / 3. Transfer:{" "}
          {latest
            ? evaluateTransfer(latest).passed
              ? "passed on the latest attempt"
              : "not yet passed"
            : "not attempted"}
          . {learningEvidence.filter((item) => item.met).length} supplemental
          behavior demonstrations. These do not rewrite the mission assessment.
        </p>
        <button className="button secondary" onClick={practice}>
          {Object.keys(state.practice.lesson.answers).length
            ? "Resume optional practice"
            : "Explore optional practice"}
        </button>
      </section>
      {state.legacyImported && (
        <section className="card legacy-history">
          <span className="eyebrow">PREVIOUS LEARNING CYCLE · ARCHIVED</span>
          <h2>Your earlier decisions are preserved.</h2>
          <p>
            This is a separate completed/in-progress learning cycle. Its
            business metrics and decisions were not reapplied to this mission’s
            cash or budget.
          </p>
          <div className="archive-metrics">
            <span>
              MRR{" "}
              <strong>{money(metricsFor(state.practice.decisions).mrr)}</strong>
            </span>
            <span>
              D30{" "}
              <strong>{metricsFor(state.practice.decisions).retention}%</strong>
            </span>
            <span>
              CAC{" "}
              <strong>{money(metricsFor(state.practice.decisions).cac)}</strong>
            </span>
            <span>
              Cash{" "}
              <strong>
                {money(metricsFor(state.practice.decisions).cash)}
              </strong>
            </span>
          </div>
          {state.practice.decisions.length ? (
            <ol>
              {state.practice.decisions.map((decision) => {
                const { scenario, option } = optionFor(decision);
                return (
                  <li key={decision.scenarioId}>
                    <strong>
                      {scenario.title}: {option.title}
                    </strong>
                    <p>{option.consequence}</p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p>
              No simulation decisions had been recorded. Existing lesson answers
              and transfer attempts are retained above.
            </p>
          )}
        </section>
      )}
    </>
  );
}
