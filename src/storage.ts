import {
  scenarios,
  lessonQuestions,
  transferChoices,
  evidenceChoices,
  gateChoices,
} from "./content";
import {
  newSession,
  metricsFor,
  competencyFor,
  evaluateDecision,
  views,
} from "./simulation";
import type { Session, TransferAttempt } from "./simulation";

export const STORAGE_KEY = "productlab.progress";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const includesId = (options: { id: string }[], id: unknown) =>
  typeof id === "string" && options.some((option) => option.id === id);

/** Replay only validated decisions; stored metric/progress summaries are never trusted. */
export function decodeSession(raw: string): Session {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !views.includes(value.view as Session["view"]) ||
    !Number.isInteger(value.currentScenario) ||
    !Array.isArray(value.decisions) ||
    value.decisions.length > 3
  )
    throw Error("Invalid save");
  const decisions = value.decisions.map((decision, index) => {
    if (
      !isRecord(decision) ||
      decision.scenarioId !== scenarios[index].id ||
      !includesId(scenarios[index].options, decision.optionId)
    )
      throw Error("Invalid decision");
    return {
      scenarioId: decision.scenarioId as string,
      optionId: decision.optionId as string,
    };
  });
  const current = value.currentScenario as number;
  if (current < Math.max(0, decisions.length - 1) || current > decisions.length)
    throw Error("Invalid stage");
  if (
    !isRecord(value.lesson) ||
    !Number.isInteger(value.lesson.step) ||
    (value.lesson.step as number) < 0 ||
    (value.lesson.step as number) > 3 ||
    !isRecord(value.lesson.answers)
  )
    throw Error("Invalid lesson");
  const answers: Session["lesson"]["answers"] = {};
  for (const [key, optionId] of Object.entries(value.lesson.answers)) {
    const question = lessonQuestions.find((question) => question.key === key);
    if (!question || !includesId(question.options, optionId))
      throw Error("Invalid lesson answer");
    answers[question.key] = optionId as string;
  }
  const step = value.lesson.step as number;
  if (lessonQuestions.slice(0, step).some((question) => !answers[question.key]))
    throw Error("Skipped lesson");
  if (
    lessonQuestions.some(
      (question, index) =>
        answers[question.key] &&
        lessonQuestions
          .slice(0, index)
          .some((previous) => !answers[previous.key]),
    )
  )
    throw Error("Nonsequential lesson");
  if (
    !Array.isArray(value.transferAttempts) ||
    value.transferAttempts.length > 20
  )
    throw Error("Invalid transfer history");
  const transferAttempts: TransferAttempt[] = value.transferAttempts.map(
    (attempt) => {
      if (
        !isRecord(attempt) ||
        !includesId(transferChoices, attempt.choice) ||
        !includesId(evidenceChoices, attempt.evidence) ||
        !includesId(gateChoices, attempt.gate) ||
        typeof attempt.note !== "string" ||
        attempt.note.length > 600
      )
        throw Error("Invalid transfer attempt");
      return {
        choice: attempt.choice as string,
        evidence: attempt.evidence as string,
        gate: attempt.gate as string,
        note: attempt.note,
      };
    },
  );
  if (
    transferAttempts.length &&
    lessonQuestions.some((question) => !answers[question.key])
  )
    throw Error("Transfer before lesson");
  return {
    version: 1,
    view: value.view as Session["view"],
    currentScenario: current,
    decisions,
    lesson: { step, answers },
    transferAttempts,
  };
}
export function loadSession(): { session: Session; notice: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: newSession(), notice: null };
    try {
      return { session: decodeSession(raw), notice: null };
    } catch {
      return {
        session: newSession(),
        notice:
          "The saved progress was unreadable or from an unsupported version. A fresh simulation has been started.",
      };
    }
  } catch {
    return {
      session: newSession(),
      notice:
        "Browser storage is unavailable. You can play, but progress may be lost when you close this tab.",
    };
  }
}
export function saveSession(session: Session): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...session,
        metrics: metricsFor(session.decisions),
        competencies: competencyFor(session),
        decisionDetails: session.decisions.map(evaluateDecision),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
