import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  lessonQuestions,
  transferChoices,
  evidenceChoices,
  gateChoices,
} from "./content";
import type { LessonQuestion } from "./content";
import {
  continueSimulation,
  evaluateTransfer,
  lessonCompleted,
  lessonRecommended,
  recordLessonAnswer,
  recordTransfer,
} from "./simulation";
import type { Session, TransferAttempt } from "./simulation";
import { Button, Pill, ChoiceGroup, CohortTable, Icon } from "./ui";
type Update = Dispatch<SetStateAction<Session>>;
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
                Return to workspace <Icon name="arrow" size={17} />
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
export function PracticeLesson({
  session,
  update,
}: {
  session: Session;
  update: Update;
}) {
  const question = lessonQuestions[session.lesson.step];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPTIONAL PRACTICE · ABOUT 5 MINUTES</span>
          <h1 tabIndex={-1}>Diagnosing a Retention Drop</h1>
          <p>
            {lessonRecommended(session)
              ? "Recommended practice from your decision history. Return to the workspace whenever you choose."
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
