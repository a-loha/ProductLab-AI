import { useEffect, useId, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  channelRows,
  platformRows,
  scenarios,
  lessonQuestions,
  skillNames,
  mistakeNames,
  transferChoices,
  evidenceChoices,
  gateChoices,
} from "./content";
import type { Option, Scenario, LessonQuestion } from "./content";
import {
  BASELINE,
  competencyFor,
  continueSimulation,
  evaluateTransfer,
  evidenceFor,
  lessonCompleted,
  lessonRecommended,
  metricsFor,
  newSession,
  optionFor,
  recordDecision,
  recordLessonAnswer,
  recordTransfer,
} from "./simulation";
import type { Session, TransferAttempt, View } from "./simulation";
import { loadSession, saveSession } from "./storage";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
type Update = Dispatch<SetStateAction<Session>>;
type Navigate = (view: View) => void;
type IconName =
  | "grid"
  | "play"
  | "book"
  | "chart"
  | "arrow"
  | "check"
  | "leaf"
  | "reset"
  | "cash";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    play: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="m10 8 6 4-6 4Z" />
      </>
    ),
    book: (
      <path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />
    ),
    chart: <path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6" />,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    leaf: (
      <>
        <path d="M20 4C11 3 4 7 4 13a7 7 0 0 0 7 7c6 0 10-7 9-16Z" />
        <path d="m4 20 10-10" />
      </>
    ),
    reset: <path d="M4 9a8 8 0 1 1 0 7M4 3v6h6" />,
    cash: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 12h.01m12 0h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button ${secondary ? "secondary" : "primary"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Pill({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function MetricGrid({ session }: { session: Session }) {
  const metrics = metricsFor(session.decisions);
  const items = [
    {
      name: "Monthly recurring revenue",
      value: money(metrics.mrr),
      detail: `${money(metrics.mrr - BASELINE.mrr)} net change from decisions`,
      source:
        "Starts at 4,000 subscriptions × $12/month. Discounts and the scripted acquisition cycle change MRR; app activity is not billing churn.",
    },
    {
      name: "D30 activity retention",
      value: `${metrics.retention}%`,
      detail: "↓ 7 pp from the previous 28% cohort",
      source:
        "Latest fully matured cohort: 210 / 1,000 new subscribers active on day 30. It stays at 21% until a new outcome is observed.",
    },
    {
      name: "Customer acquisition cost",
      value: money(metrics.cac),
      detail:
        metrics.cac === 42
          ? "Latest cycle · $42,000 / 1,000 signups"
          : "New scripted cycle · $30,000 / 600 signups",
      source:
        "Acquisition spend divided by new paying subscribers for the latest observed cycle. Only a new acquisition cycle changes CAC.",
    },
    {
      name: "Cash balance",
      value: money(metrics.cash),
      detail: `${money(BASELINE.cash - metrics.cash)} used in this simulation`,
      source:
        "Starts at $120,000. Each action’s budget is deducted once. MRR is a run rate, not an immediate cash receipt; other operating costs are outside this model.",
    },
  ];
  return (
    <section className="metrics" aria-label="Pulse business metrics">
      {items.map((metric, index) => (
        <article className="metric card" key={metric.name}>
          <div className="metric-label">
            {metric.name}
            <Icon name={index > 1 ? "cash" : "chart"} size={17} />
          </div>
          <strong>{metric.value}</strong>
          <p className={index === 1 ? "negative" : ""}>{metric.detail}</p>
          <details className="metric-source">
            <summary>How it’s calculated</summary>
            <p>{metric.source}</p>
          </details>
        </article>
      ))}
    </section>
  );
}
function Competencies({
  session,
  compact = false,
}: {
  session: Session;
  compact?: boolean;
}) {
  return (
    <section className="card competencies">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR PRACTICE SIGNALS</span>
          <h2 tabIndex={-1}>Competency progress</h2>
        </div>
        <span className="icon-tile">
          <Icon name="chart" />
        </span>
      </div>
      <p className="muted">
        Demonstrated behaviors across this learning loop. Empty space includes
        activities you haven’t attempted.
      </p>
      <div className="skill-list">
        {competencyFor(session).map((skill) => (
          <div className="skill" key={skill.skill}>
            <div>
              <span>{skill.name}</span>
              <strong>
                {skill.demonstrated}
                <span> / {skill.available}</span>
              </strong>
            </div>
            <progress
              value={skill.demonstrated}
              max={skill.available}
              aria-label={`${skill.name}: ${skill.demonstrated} of ${skill.available} possible demonstrations`}
            />
            {!compact && (
              <small>
                {skill.practiced} opportunities attempted ·{" "}
                {skill.practiced - skill.demonstrated} to revisit
              </small>
            )}
          </div>
        ))}
      </div>
      <p className="fine-print">
        Evidence for reflection, not a professional grade or proof of mastery.
        Transfer retries update one evidence point per criterion.
      </p>
    </section>
  );
}
function StageRail({ session }: { session: Session }) {
  return (
    <ol className="stage-rail" aria-label="Connected scenarios">
      {scenarios.map((scenario, index) => (
        <li
          key={scenario.id}
          className={
            session.decisions[index]
              ? "done"
              : index === session.currentScenario
                ? "active"
                : ""
          }
        >
          <span>
            {session.decisions[index] ? (
              <Icon name="check" size={13} />
            ) : (
              `0${index + 1}`
            )}
          </span>
          <div>
            <small>SCENARIO {index + 1}</small>
            <strong>{scenario.title}</strong>
          </div>
        </li>
      ))}
    </ol>
  );
}
function LearningCard({
  session,
  navigate,
}: {
  session: Session;
  navigate: Navigate;
}) {
  const completed = lessonCompleted(session),
    latest = session.transferAttempts.at(-1);
  const passed = latest && evaluateTransfer(latest).passed,
    assigned = lessonRecommended(session);
  return (
    <section className="card learning-card">
      <div className="section-heading">
        <span className="icon-tile lavender">
          <Icon name="book" />
        </span>
        <Pill tone={passed ? "green" : "purple"}>
          {passed
            ? "Transfer passed"
            : completed
              ? "Transfer practice needed"
              : assigned
                ? "Assigned to your skill gap"
                : "Available practice"}
        </Pill>
      </div>
      <span className="eyebrow">PERSONALIZED LEARNING · ABOUT 5 MIN</span>
      <h2 tabIndex={-1}>Diagnosing a Retention Drop</h2>
      <p>
        {assigned
          ? "Your decision revealed an opportunity to strengthen diagnosis. Practice verifying the signal, localizing the change, and choosing a testable next step."
          : "Build a repeatable way to investigate a decline, then apply it to a different situation."}
      </p>
      <div className="lesson-preview">
        <span>4 interactive steps</span>
        <span>1 transfer challenge</span>
      </div>
      <Button secondary={!!passed} onClick={() => navigate("learning")}>
        {passed
          ? "Review your learning"
          : completed
            ? "Revisit the transfer challenge"
            : "Open micro-lesson"}
        <Icon name="arrow" size={17} />
      </Button>
    </section>
  );
}
function Dashboard({
  session,
  update,
  navigate,
}: {
  session: Session;
  update: Update;
  navigate: Navigate;
}) {
  const next = scenarios[Math.min(session.currentScenario, 2)];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PRODUCT WORKSPACE</span>
          <h1 tabIndex={-1}>Small decisions. Lasting judgment.</h1>
          <p>
            Run Pulse, work through the evidence, and build your product
            instincts.
          </p>
        </div>
        <Pill tone="green">
          {session.currentScenario === 3
            ? "● Cycle complete"
            : "● Simulation active"}
        </Pill>
      </div>
      <MetricGrid session={session} />
      <div className="dashboard-grid">
        <section className="simulation-hero">
          <div className="hero-top">
            <div className="pulse-logo">
              <Icon name="leaf" size={25} />
            </div>
            <span>
              PULSE <small>B2C WELLNESS · $12 / MONTH</small>
            </span>
            <Pill>LEARNING CYCLE 01</Pill>
          </div>
          <div className="hero-copy">
            <span className="eyebrow">
              {session.currentScenario === 3
                ? "CYCLE COMPLETE"
                : `CURRENT STAGE · ${session.currentScenario + 1} OF 3`}
            </span>
            <h2 tabIndex={-1}>
              {session.currentScenario === 3 ? (
                "Your decisions tell a story."
              ) : (
                <>
                  Retention is falling.
                  <br />
                  What’s your next move?
                </>
              )}
            </h2>
            <p>
              {session.currentScenario === 3
                ? "Review what you learned, revisit a gap, and separate decisions made from outcomes actually observed."
                : "D30 activity retention fell from 28% to 21%. Find what changed before choosing what to change."}
            </p>
          </div>
          <StageRail session={session} />
          <div className="hero-bottom">
            <Button onClick={() => update(continueSimulation)}>
              {session.currentScenario === 3
                ? "Review simulation"
                : "Continue Simulation"}
              <Icon name="arrow" size={18} />
            </Button>
            <span>
              {session.currentScenario === 3
                ? "All three decisions recorded"
                : next.title}
            </span>
          </div>
        </section>
        <Competencies session={session} compact />
      </div>
      <div className="section-heading activities-title">
        <div>
          <span className="eyebrow">LEARN BY DOING</span>
          <h2 tabIndex={-1}>Your next learning activity</h2>
        </div>
        <span className="muted">
          {session.decisions.length} of 3 simulation decisions recorded
        </span>
      </div>
      <div className="activities-grid">
        <LearningCard session={session} navigate={navigate} />
        <section className="card activity-summary">
          <span className="eyebrow">ONE CONNECTED STORY</span>
          <h2 tabIndex={-1}>From signal to next step.</h2>
          <p>
            Every decision has trade-offs. Feedback shows the evidence you used,
            what you missed, and what to practice next.
          </p>
          <ol>
            {scenarios.map((scenario, index) => (
              <li key={scenario.id}>
                <span
                  className={`activity-dot ${session.decisions[index] ? "complete" : ""}`}
                >
                  {session.decisions[index] ? (
                    <Icon name="check" size={12} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <strong>{scenario.title}</strong>
                  <small>
                    {session.decisions[index]
                      ? "Decision recorded"
                      : index <= session.decisions.length
                        ? "Available in the simulation"
                        : "Unlocks after the previous decision"}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <button className="text-button" onClick={() => navigate("progress")}>
            See your decision history <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>
    </>
  );
}
type Choice = {
  id: string;
  title: string;
  description?: string;
  tradeoff?: string;
};
function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: {
  legend: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>{legend}</legend>
      {options.map((option, index) => (
        <label
          className={`choice ${value === option.id ? "selected" : ""}`}
          key={option.id}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span className="choice-copy">
            <strong>
              <span className="choice-letter">
                {String.fromCharCode(65 + index)}
              </span>
              {option.title}
            </strong>
            {option.description && <span>{option.description}</span>}
            {option.tradeoff && <small>{option.tradeoff}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
function CohortTable({ platform = false }: { platform?: boolean }) {
  const rows = platform ? platformRows : channelRows;
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label={
        platform
          ? "Paid-social platform cohort comparison"
          : "Acquisition channel cohort comparison"
      }
      tabIndex={0}
    >
      <table>
        <caption>
          {platform ? "Paid-social cohort detail" : "Verified cohort snapshot"}{" "}
          · new paying subscribers, activity on day 30
        </caption>
        <thead>
          <tr>
            <th scope="col">{platform ? "Platform" : "Channel"}</th>
            <th scope="col">
              Previous cohort
              <br />
              <span>Size · Active · D30</span>
            </th>
            <th scope="col">
              Latest cohort
              <br />
              <span>Size · Active · D30</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.channel}>
              <th scope="row">{row.channel}</th>
              <td>
                {row.beforeN} · {row.beforeActive} ·{" "}
                <strong>{(row.beforeActive / row.beforeN) * 100}%</strong>
              </td>
              <td>
                {row.afterN} · {row.afterActive} ·{" "}
                <strong>{(row.afterActive / row.afterN) * 100}%</strong>
              </td>
            </tr>
          ))}
          {!platform && (
            <tr className="total-row">
              <th scope="row">All channels</th>
              <td>
                1,000 · 280 · <strong>28%</strong>
              </td>
              <td>
                1,000 · 210 · <strong>21%</strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="fine-print">
        Both periods are fully matured, with the same event definition. Activity
        retention is not subscription renewal.
      </p>
    </div>
  );
}
function DecisionFeedback({
  scenario,
  option,
  session,
  update,
  navigate,
}: {
  scenario: Scenario;
  option: Option;
  session: Session;
  update: Update;
  navigate: Navigate;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <section
      className="decision-feedback"
      aria-label="Decision feedback"
      tabIndex={-1}
      ref={panel}
    >
      <div className="feedback-heading">
        <span className="icon-tile">
          <Icon name="check" />
        </span>
        <div>
          <span className="eyebrow">DECISION RECORDED</span>
          <h3>{option.title}</h3>
        </div>
      </div>
      <p>{option.feedback}</p>
      <div className="consequence-box">
        <span className="eyebrow">BUSINESS CONSEQUENCE · FICTIONAL MODEL</span>
        <p>{option.consequence}</p>
      </div>
      <h3>Evidence demonstrated & opportunities missed</h3>
      <ul className="criteria-list">
        {scenario.criteria.map((criterion) => (
          <li key={criterion.skill}>
            <span
              className={`criterion-marker ${option.demonstrated.includes(criterion.skill) ? "met" : "missed"}`}
            >
              {option.demonstrated.includes(criterion.skill) ? "✓" : "↗"}
            </span>
            <div>
              <strong>{skillNames[criterion.skill]}</strong>
              <p>{criterion.label}</p>
              <small>
                {option.demonstrated.includes(criterion.skill)
                  ? "Demonstrated by this decision"
                  : "Not demonstrated by this decision"}
              </small>
            </div>
          </li>
        ))}
      </ul>
      {option.mistakes.length > 0 && (
        <div className="gap-box">
          <span className="eyebrow">SKILL GAP · PROBLEM DIAGNOSIS</span>
          <div className="tags">
            {option.mistakes.map((tag) => (
              <Pill tone="amber" key={tag}>
                {mistakeNames[tag]}
              </Pill>
            ))}
          </div>
          <p>
            Recommended: <strong>Diagnosing a Retention Drop</strong>. Practice
            choosing evidence before attributing cause or committing to a
            solution.
          </p>
          <Button onClick={() => navigate("learning")}>
            Practice this gap <Icon name="book" size={16} />
          </Button>
        </div>
      )}
      <div className="next-step">
        <strong>What would make this decision stronger?</strong>
        <p>{option.next}</p>
      </div>
      <div className="button-row">
        <Button onClick={() => update(continueSimulation)}>
          {session.currentScenario === 2
            ? "Complete this simulation cycle"
            : `Continue to ${scenarios[session.currentScenario + 1].title}`}
          <Icon name="arrow" size={17} />
        </Button>
        <Button secondary onClick={() => navigate("progress")}>
          View progress
        </Button>
      </div>
      <details className="alternatives">
        <summary>Review the other trade-offs</summary>
        {scenario.options
          .filter((other) => other.id !== option.id)
          .map((other) => (
            <div key={other.id}>
              <h4>{other.title}</h4>
              <p>{other.tradeoff}</p>
            </div>
          ))}
      </details>
    </section>
  );
}
function Simulation({
  session,
  update,
  navigate,
}: {
  session: Session;
  update: Update;
  navigate: Navigate;
}) {
  useEffect(() => {
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, []);
  const [selected, setSelected] = useState("");
  const scenario = scenarios[session.currentScenario],
    decision = session.decisions[session.currentScenario];
  if (!scenario)
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">CYCLE 01 · COMPLETE</span>
            <h1 tabIndex={-1}>
              Your decisions are in. Keep the learning going.
            </h1>
            <p>
              A finished decision cycle is an opportunity to reflect, not a
              claim of mastery.
            </p>
          </div>
        </div>
        <MetricGrid session={session} />
        <div className="card completion-card">
          <span className="completion-icon">
            <Icon name="check" size={30} />
          </span>
          <h2 tabIndex={-1}>
            Three decisions. A clearer view of your thinking.
          </h2>
          <p>
            The original measured D30 remains 21%. Your actions have real budget
            consequences within the fictional model, but no mature
            post-intervention retention outcome is available.
          </p>
          <div className="button-row">
            <Button onClick={() => navigate("progress")}>
              Review decisions & progress <Icon name="arrow" size={17} />
            </Button>
            <Button secondary onClick={() => navigate("learning")}>
              Continue learning
            </Button>
          </div>
        </div>
        <LearningCard session={session} navigate={navigate} />
      </>
    );
  const option = decision && optionFor(decision).option;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PULSE · CONNECTED SIMULATION</span>
          <h1 tabIndex={-1}>{scenario.title}</h1>
          <p>{scenario.subtitle}</p>
        </div>
        <Pill tone="purple">Scenario {session.currentScenario + 1} of 3</Pill>
      </div>
      <StageRail session={session} />
      <MetricGrid session={session} />
      <div className="simulation-grid">
        <section className="card scenario-card">
          <span className="eyebrow">THE SITUATION</span>
          <h2 tabIndex={-1}>
            {session.currentScenario === 0
              ? "28% → 21%. Diagnose before you act."
              : scenario.subtitle}
          </h2>
          <p className="scenario-context">{scenario.context}</p>
          {session.currentScenario === 0 ? (
            <div className="known-unknown">
              <div>
                <span>WHAT WE KNOW</span>
                <strong>−7 percentage points</strong>
                <p>A 25% relative decline in day-30 app activity.</p>
              </div>
              <div>
                <span>WHAT WE DON’T KNOW</span>
                <strong>The mechanism</strong>
                <p>
                  Measurement, mix, intent, or experience? Test competing
                  explanations.
                </p>
              </div>
            </div>
          ) : (
            <CohortTable platform={session.currentScenario === 2} />
          )}
          {session.currentScenario === 2 && (
            <div className="evidence-note">
              <strong>Evidence ≠ estimated impact.</strong>
              <p>
                The reproducible defect justifies a repair. Interviews and
                segment comparisons do not quantify a causal D30 effect.
              </p>
            </div>
          )}
          {option ? (
            <DecisionFeedback
              scenario={scenario}
              option={option}
              session={session}
              update={update}
              navigate={navigate}
            />
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (selected)
                  update((current) => recordDecision(current, selected));
              }}
            >
              <ChoiceGroup
                legend={scenario.question}
                options={scenario.options}
                value={selected}
                onChange={setSelected}
              />
              <div className="submit-row">
                <span className="fine-print">
                  Your choice is recorded once. Restart to explore another path.
                </span>
                <button
                  className="button primary"
                  type="submit"
                  disabled={!selected}
                >
                  Make this decision <Icon name="arrow" size={17} />
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="decision-guide card">
          <span className="eyebrow">YOUR DECISION LENS</span>
          <h2 tabIndex={-1}>Think beyond the next move.</h2>
          <ol>
            <li>
              <strong>What is observed?</strong>
              <p>Separate a metric change from an explanation.</p>
            </li>
            <li>
              <strong>What would you learn?</strong>
              <p>Choose evidence that can change your mind.</p>
            </li>
            <li>
              <strong>What are you committing?</strong>
              <p>Make cost, reversibility, and opportunity cost visible.</p>
            </li>
          </ol>
          <div className="guide-footer">
            <Icon name="book" />
            <p>Feedback uses an explicit rubric. No hidden AI score.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
function LessonQuestionView({
  question,
  session,
  update,
}: {
  question: LessonQuestion;
  session: Session;
  update: Update;
}) {
  useEffect(() => {
    document.querySelector<HTMLElement>(".lesson-body h2")?.focus();
  }, []);
  const answer = session.lesson.answers[question.key];
  const [selected, setSelected] = useState(answer ?? "");
  const option = question.options.find((option) => option.id === answer);
  return (
    <section className="card lesson-body">
      <span className="eyebrow">STEP {session.lesson.step + 1} OF 4</span>
      <h2 tabIndex={-1}>{question.title}</h2>
      <p className="scenario-context">{question.introduction}</p>
      {question.key === "understand" && (
        <ol className="framework">
          {[
            ["Verify", "Is the signal trustworthy?"],
            ["Localize", "Where did behavior change?"],
            ["Explain", "What could cause the pattern?"],
            ["Act", "What should we test or repair?"],
          ].map(([title, detail], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </li>
          ))}
        </ol>
      )}
      {question.key === "pattern" && <CohortTable platform />}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update((current) => recordLessonAnswer(current, selected));
        }}
      >
        <ChoiceGroup
          legend={question.question}
          options={question.options}
          value={selected}
          onChange={setSelected}
          disabled={!!answer}
        />
        {!answer && (
          <button className="button primary" disabled={!selected}>
            Check my reasoning <Icon name="arrow" size={17} />
          </button>
        )}
      </form>
      {option && (
        <div
          className={`lesson-feedback ${option.correct ? "positive" : "reflect"}`}
          role="status"
        >
          <h3>
            {option.correct
              ? "You found the diagnostic signal."
              : "A useful opportunity to reconsider."}
          </h3>
          <p>{option.explanation}</p>
          <span className="fine-print">
            Your first checked answer is recorded. Apply the feedback in the
            transfer challenge.
          </span>
        </div>
      )}
      {answer && (
        <Button
          onClick={() =>
            update((current) => ({
              ...current,
              lesson: { ...current.lesson, step: current.lesson.step + 1 },
            }))
          }
        >
          Continue to{" "}
          {session.lesson.step === 2
            ? "the transfer challenge"
            : "the next step"}{" "}
          <Icon name="arrow" size={17} />
        </Button>
      )}
    </section>
  );
}
function TransferChallenge({
  session,
  update,
}: {
  session: Session;
  update: Update;
}) {
  useEffect(() => {
    document.querySelector<HTMLElement>(".lesson-body h2")?.focus();
  }, []);
  const latest = session.transferAttempts.at(-1);
  const [editing, setEditing] = useState(!latest);
  const [draft, setDraft] = useState<TransferAttempt>(
    latest ?? { choice: "", evidence: "", gate: "", note: "" },
  );
  const result = latest && evaluateTransfer(latest);
  return (
    <section className="card lesson-body">
      <span className="eyebrow">STEP 4 OF 4 · NEW CONTEXT</span>
      <h2 tabIndex={-1}>Transfer challenge: a D7 onboarding decline</h2>
      <p className="scenario-context">
        Later at Pulse, D7 activity retention falls from{" "}
        <strong>42% to 34%</strong> after onboarding release 3.1. A regional
        acquisition campaign also launched that week. The team wants a decision
        today; matched cohort analysis and event validation are still missing.
      </p>
      <div className="rubric-note">
        <strong>The rubric is visible.</strong>
        <p>
          To pass, choose all three: an investigative next step, mature matched
          evidence, and a conditional action with guardrails. This is one
          demonstration of transfer, not mastery.
        </p>
      </div>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update((current) => recordTransfer(current, draft));
            setEditing(false);
          }}
        >
          <ChoiceGroup
            legend="1. What is your next investigative step?"
            options={transferChoices}
            value={draft.choice}
            onChange={(choice) =>
              setDraft((current) => ({ ...current, choice }))
            }
          />
          <ChoiceGroup
            legend="2. Justify it: which evidence would you use?"
            options={evidenceChoices}
            value={draft.evidence}
            onChange={(evidence) =>
              setDraft((current) => ({ ...current, evidence }))
            }
          />
          <ChoiceGroup
            legend="3. Justify it: what would change your next action?"
            options={gateChoices}
            value={draft.gate}
            onChange={(gate) => setDraft((current) => ({ ...current, gate }))}
          />
          <label className="note-label" htmlFor="transfer-note">
            Your reflection <span>(optional · not automatically graded)</span>
          </label>
          <textarea
            id="transfer-note"
            maxLength={600}
            rows={3}
            value={draft.note}
            onChange={(event) =>
              setDraft((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="What assumption would you want to challenge?"
          />
          <p className="fine-print">
            Your three structured choices are assessed against the rubric. This
            note is saved for your own reflection.
          </p>
          <button
            className="button primary"
            disabled={!draft.choice || !draft.evidence || !draft.gate}
          >
            Check transfer challenge <Icon name="arrow" size={17} />
          </button>
        </form>
      ) : (
        result && (
          <div className="transfer-result" role="status">
            <Pill tone={result.passed ? "green" : "amber"}>
              {result.passed ? "Transfer passed" : "Transfer not yet passed"}
            </Pill>
            <h3>
              {result.passed
                ? "You applied the process in a new context."
                : "Use the evidence to refine your next attempt."}
            </h3>
            <ul className="criteria-list">
              {result.criteria.map((criterion) => (
                <li key={criterion.label}>
                  <span
                    className={`criterion-marker ${criterion.met ? "met" : "missed"}`}
                  >
                    {criterion.met ? "✓" : "↗"}
                  </span>
                  <div>
                    <strong>{criterion.label}</strong>
                    <p>{criterion.explanation}</p>
                    <small>
                      {criterion.met
                        ? "Demonstrated"
                        : "Revisit this criterion"}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
            <p className="fine-print">
              {session.transferAttempts.length} recent attempt
              {session.transferAttempts.length === 1 ? "" : "s"} saved. The
              latest attempt updates the same evidence points; retries do not
              multiply progress.
            </p>
            <div className="button-row">
              <Button onClick={() => update(continueSimulation)}>
                Continue Simulation <Icon name="arrow" size={17} />
              </Button>
              <Button secondary onClick={() => setEditing(true)}>
                Try the challenge again
              </Button>
            </div>
          </div>
        )
      )}
    </section>
  );
}
function Learning({ session, update }: { session: Session; update: Update }) {
  const question = lessonQuestions[session.lesson.step];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            PERSONALIZED LEARNING · ABOUT 5 MINUTES
          </span>
          <h1 tabIndex={-1}>Diagnosing a Retention Drop</h1>
          <p>
            {lessonRecommended(session)
              ? "Assigned from your decision gaps. Practice, reflect, then transfer the skill."
              : "Available practice. A repeatable process for a problem with many possible causes."}
          </p>
        </div>
        <Pill tone={lessonCompleted(session) ? "green" : "purple"}>
          {lessonCompleted(session)
            ? "Lesson completed"
            : "Interactive micro-lesson"}
        </Pill>
      </div>
      <nav className="lesson-steps" aria-label="Lesson steps">
        {[
          ...lessonQuestions.map((question) => question.title),
          "Transfer challenge",
        ].map((title, index) => (
          <button
            key={title}
            disabled={
              index > 0 &&
              lessonQuestions
                .slice(0, index)
                .some((question) => !session.lesson.answers[question.key])
            }
            aria-current={session.lesson.step === index ? "step" : undefined}
            onClick={() =>
              update((current) => ({
                ...current,
                lesson: { ...current.lesson, step: index },
              }))
            }
          >
            <span>
              {index < 3 &&
              session.lesson.answers[lessonQuestions[index].key] ? (
                <Icon name="check" size={13} />
              ) : (
                index + 1
              )}
            </span>
            {title}
          </button>
        ))}
      </nav>
      {question ? (
        <LessonQuestionView
          key={question.key}
          question={question}
          session={session}
          update={update}
        />
      ) : (
        <TransferChallenge session={session} update={update} />
      )}
    </>
  );
}
function Progress({
  session,
  navigate,
}: {
  session: Session;
  navigate: Navigate;
}) {
  const evidence = evidenceFor(session),
    latest = session.transferAttempts.at(-1);
  const mistakes = [
    ...new Set(
      session.decisions.flatMap(
        (decision) => optionFor(decision).option.mistakes,
      ),
    ),
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROGRESS & FEEDBACK</span>
          <h1 tabIndex={-1}>See the thinking behind your decisions.</h1>
          <p>Specific evidence, useful gaps, and a next step you can act on.</p>
        </div>
        <Pill>{session.decisions.length} / 3 decisions</Pill>
      </div>
      <div className="progress-grid">
        <Competencies session={session} />
        <div className="progress-summary card">
          <span className="eyebrow">YOUR LEARNING LOOP</span>
          <h2 tabIndex={-1}>Practice, then apply.</h2>
          <dl>
            <div>
              <dt>Simulation decisions</dt>
              <dd>{session.decisions.length} of 3</dd>
            </div>
            <div>
              <dt>Micro-lesson</dt>
              <dd>
                {lessonCompleted(session)
                  ? "Completed"
                  : Object.keys(session.lesson.answers).length
                    ? "In progress"
                    : "Not started"}
              </dd>
            </div>
            <div>
              <dt>Transfer challenge</dt>
              <dd>
                {latest
                  ? evaluateTransfer(latest).passed
                    ? "Passed · latest attempt"
                    : "Needs another attempt"
                  : "Not attempted"}
              </dd>
            </div>
            <div>
              <dt>Behavior demonstrations</dt>
              <dd>
                {evidence.filter((item) => item.met).length} / {evidence.length}{" "}
                attempted
              </dd>
            </div>
          </dl>
          <h3>Mistake categories to revisit</h3>
          <div className="tags">
            {mistakes.length ? (
              mistakes.map((tag) => (
                <Pill tone="amber" key={tag}>
                  {mistakeNames[tag]}
                </Pill>
              ))
            ) : (
              <p className="muted">
                {session.decisions.length
                  ? "No mistake tags in your decisions so far. Keep testing your assumptions."
                  : "Make a decision to collect feedback."}
              </p>
            )}
          </div>
          {latest?.note && (
            <blockquote>
              <span className="eyebrow">YOUR TRANSFER REFLECTION</span>
              <p>{latest.note}</p>
            </blockquote>
          )}
          <Button secondary onClick={() => navigate("learning")}>
            {latest && !evaluateTransfer(latest).passed
              ? "Retry the transfer challenge"
              : "Open personalized learning"}
            <Icon name="book" size={17} />
          </Button>
        </div>
      </div>
      <div className="section-heading activities-title">
        <h2 tabIndex={-1}>Your decision journal</h2>
        <Pill>Actions, evidence, outcomes</Pill>
      </div>
      {session.decisions.length === 0 ? (
        <section className="card empty-state">
          <h3>Your first decision starts the journal.</h3>
          <p>
            Work through the retention crisis to see your reasoning signals and
            budget consequences here.
          </p>
          <Button onClick={() => navigate("simulation")}>
            Start the simulation <Icon name="arrow" size={17} />
          </Button>
        </section>
      ) : (
        <div className="journal">
          {session.decisions.map((decision, index) => {
            const { scenario, option } = optionFor(decision);
            return (
              <article className="card journal-entry" key={decision.scenarioId}>
                <div className="section-heading">
                  <span className="eyebrow">
                    0{index + 1} · {scenario.title}
                  </span>
                  <Pill>{money(option.impact.cost)} budget used</Pill>
                </div>
                <h3>{option.title}</h3>
                <p>{option.feedback}</p>
                <div className="consequence-box">
                  <strong>Trade-off</strong>
                  <p>{option.tradeoff}</p>
                  <strong>Business consequence</strong>
                  <p>{option.consequence}</p>
                </div>
                <details>
                  <summary>View evaluation criteria</summary>
                  <ul className="criteria-list">
                    {scenario.criteria.map((criterion) => (
                      <li key={criterion.skill}>
                        <span
                          className={`criterion-marker ${option.demonstrated.includes(criterion.skill) ? "met" : "missed"}`}
                        >
                          {option.demonstrated.includes(criterion.skill)
                            ? "✓"
                            : "↗"}
                        </span>
                        <div>
                          <strong>{skillNames[criterion.skill]}</strong>
                          <p>{criterion.label}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            );
          })}
        </div>
      )}
      {evidence.some(
        (item) => !scenarios.some((scenario) => scenario.title === item.source),
      ) && (
        <section className="card learning-evidence">
          <h2 tabIndex={-1}>Learning & transfer evidence</h2>
          <ul className="criteria-list">
            {evidence
              .filter(
                (item) =>
                  !scenarios.some((scenario) => scenario.title === item.source),
              )
              .map((item, index) => (
                <li key={index}>
                  <span
                    className={`criterion-marker ${item.met ? "met" : "missed"}`}
                  >
                    {item.met ? "✓" : "↗"}
                  </span>
                  <div>
                    <strong>
                      {item.source} · {skillNames[item.skill]}
                    </strong>
                    <p>{item.detail}</p>
                    <small>
                      {item.met ? "Demonstrated" : "Opportunity to revisit"}
                    </small>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
export default function App() {
  const [initial] = useState(loadSession);
  const [session, update] = useState(initial.session);
  const [saved, setSaved] = useState(true),
    [notice, setNotice] = useState(initial.notice);
  const heading = useRef<HTMLElement>(null);
  useEffect(() => {
    setSaved(saveSession(session));
  }, [session]);
  useEffect(() => {
    heading.current
      ?.querySelector<HTMLElement>("h1")
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [session.view]);
  function navigate(view: View) {
    update((current) => ({
      ...current,
      view,
      lesson:
        view === "learning" && lessonCompleted(current)
          ? { ...current.lesson, step: 3 }
          : current.lesson,
    }));
  }
  function restart() {
    if (
      window.confirm(
        "Restart Pulse? This clears your decisions, lesson progress, transfer attempts, and business metrics in this browser.",
      )
    ) {
      update(newSession());
      setNotice(null);
    }
  }
  const navigation: { view: View; label: string; icon: IconName }[] = [
    { view: "dashboard", label: "Dashboard", icon: "grid" },
    { view: "simulation", label: "Simulation", icon: "play" },
    { view: "learning", label: "Personalized Learning", icon: "book" },
    { view: "progress", label: "Progress & Feedback", icon: "chart" },
  ];
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("dashboard")}
          aria-label="ProductLab AI dashboard"
        >
          <span className="brand-mark">
            P<span />
          </span>
          <span>
            ProductLab<span className="brand-ai">AI</span>
          </span>
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <div className="workspace-identity">
          <span className="pulse-logo">
            <Icon name="leaf" size={22} />
          </span>
          <div>
            <strong>Pulse</strong>
            <small>Wellness, one habit at a time</small>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.view}
              aria-current={session.view === item.view ? "page" : undefined}
              onClick={() => navigate(item.view)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.view === "learning" &&
                lessonRecommended(session) &&
                !lessonCompleted(session) && (
                  <span className="nav-dot" aria-label="Lesson assigned" />
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="eyebrow">LEARNING BY DOING</span>
          <p>
            Make a call.
            <br />
            Understand the trade-off.
            <br />
            Try a better next step.
          </p>
          <span className="privacy-label">
            Private browser progress · No account
          </span>
        </div>
      </aside>
      <div className="main-layout">
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>Pulse simulation</strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`save-status ${!saved ? "unsaved" : ""}`}
              role="status"
            >
              <span />
              {saved
                ? "Progress saved on this browser"
                : "Storage unavailable · this tab only"}
            </span>
            <button className="reset-button" onClick={restart}>
              <Icon name="reset" size={15} />
              Restart simulation
            </button>
          </div>
        </header>
        <main className="page-shell" ref={heading}>
          {notice && (
            <div className="notice" role="status">
              <p>{notice}</p>
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss storage notice"
              >
                ×
              </button>
            </div>
          )}
          {!saved && (
            <div className="notice warning" role="alert">
              Progress cannot be saved in this browser. Enable site storage to
              retain this session after closing the tab.
            </div>
          )}
          {session.view === "dashboard" && (
            <Dashboard session={session} update={update} navigate={navigate} />
          )}
          {session.view === "simulation" && (
            <Simulation
              key={session.currentScenario}
              session={session}
              update={update}
              navigate={navigate}
            />
          )}
          {session.view === "learning" && (
            <Learning session={session} update={update} />
          )}
          {session.view === "progress" && (
            <Progress session={session} navigate={navigate} />
          )}
          <footer className="site-footer">
            <span>
              ProductLab AI <span>/</span> Original scenarios. Real practice.
            </span>
            <span>A fictional business. Transparent, rule-based feedback.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
