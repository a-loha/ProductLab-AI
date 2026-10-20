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
import {
  newWorkspace,
  areaNames,
  completionIssues,
  missionMetrics,
} from "./mission";
import type { WorkspaceState, MissionDraft } from "./mission";
import {
  initiatives,
  evidenceSources,
  classifications,
  problemOptions,
  hypothesisOptions,
  tradeoffOptions,
  successOptions,
  guardrailOptions,
  ownerOptions,
  checkpointOptions,
  ceoFrameOptions,
  ceoCommitOptions,
  marketingReasons,
} from "./mission-content";
import type { EvidenceId, InitiativeId } from "./mission-content";

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

function choice(
  value: unknown,
  options: readonly { id: string }[],
  blank = true,
): string {
  if (
    typeof value !== "string" ||
    (!options.some((option) => option.id === value) && !(blank && value === ""))
  )
    throw Error("Invalid structured choice");
  return value;
}
function ids(
  value: unknown,
  options: readonly { id: string }[],
  max: number,
): string[] {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    new Set(value).size !== value.length
  )
    throw Error("Invalid list");
  return value.map((id) => choice(id, options, false));
}
function draftFrom(value: unknown): MissionDraft {
  if (
    !isRecord(value) ||
    !isRecord(value.analysis) ||
    !isRecord(value.research) ||
    !isRecord(value.marketing) ||
    !isRecord(value.ceo) ||
    !isRecord(value.brief)
  )
    throw Error("Invalid mission draft");
  const numeric = (raw: unknown) => {
    if (
      typeof raw !== "string" ||
      raw.length > 20 ||
      (raw !== "" && !Number.isFinite(Number(raw)))
    )
      throw Error("Invalid decomposition");
    return raw;
  };
  const block = (raw: unknown) => {
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 4)
      throw Error("Invalid allocation");
    return raw;
  };
  const b = value.brief;
  if (typeof b.reflection !== "string" || b.reflection.length > 800)
    throw Error("Invalid reflection");
  return {
    analysis: {
      segment: choice(value.analysis.segment, [
        { id: "paid_android" },
        { id: "organic" },
        { id: "ios" },
        { id: "everyone" },
      ]),
      mix: numeric(value.analysis.mix),
      within: numeric(value.analysis.within),
      finance: choice(value.analysis.finance, [
        { id: "mrr_up" },
        { id: "mrr_down" },
        { id: "same_measure" },
      ]),
    },
    research: {
      routine: choice(value.research.routine, classifications),
      price: choice(value.research.price, classifications),
      intent: choice(value.research.intent, classifications),
    },
    initiatives: ids(
      value.initiatives,
      initiatives,
      initiatives.length,
    ) as InitiativeId[],
    marketing: {
      organic: block(value.marketing.organic),
      referral: block(value.marketing.referral),
      social: block(value.marketing.social),
    },
    marketingReason: choice(value.marketingReason, marketingReasons),
    ceo: {
      frame: choice(value.ceo.frame, ceoFrameOptions),
      commitment: choice(value.ceo.commitment, ceoCommitOptions),
    },
    brief: {
      problem: choice(b.problem, problemOptions),
      evidence: ids(
        b.evidence,
        evidenceSources,
        evidenceSources.length,
      ) as EvidenceId[],
      hypotheses: ids(b.hypotheses, hypothesisOptions, 2),
      confidence: choice(b.confidence, [
        { id: "unquantified" },
        { id: "proven" },
      ]),
      tradeoff: choice(b.tradeoff, tradeoffOptions),
      success: choice(b.success, successOptions),
      guardrail: choice(b.guardrail, guardrailOptions),
      owner: choice(b.owner, ownerOptions),
      checkpoint: choice(b.checkpoint, checkpointOptions),
      reflection: b.reflection,
    },
  };
}
export function decodeWorkspace(raw: string): WorkspaceState {
  const value: unknown = JSON.parse(raw);
  if (isRecord(value) && value.version === 1) {
    const practice = decodeSession(raw),
      state = newWorkspace(practice, true);
    return {
      ...state,
      page:
        practice.view === "learning"
          ? "playbook"
          : practice.view === "progress"
            ? "development"
            : "workspace",
    };
  }
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !["workspace", "playbook", "development"].includes(value.page as string) ||
    !Object.keys(areaNames).includes(value.area as string) ||
    typeof value.legacyImported !== "boolean" ||
    !isRecord(value.mission)
  )
    throw Error("Unsupported save");
  const draft = draftFrom(value.mission.draft),
    notebook = ids(
      value.mission.notebook,
      evidenceSources,
      evidenceSources.length,
    ) as EvidenceId[];
  if (draft.brief.evidence.some((id) => !notebook.includes(id)))
    throw Error("Unread citation");
  let submission: WorkspaceState["mission"]["submission"] = null;
  if (value.mission.submission !== null) {
    if (!isRecord(value.mission.submission)) throw Error("Invalid submission");
    const submittedDraft = draftFrom(value.mission.submission.draft),
      evidence = ids(
        value.mission.submission.evidence,
        evidenceSources,
        evidenceSources.length,
      ) as EvidenceId[];
    if (
      completionIssues(submittedDraft, evidence).length ||
      evidence.some((id) => !notebook.includes(id)) ||
      JSON.stringify(submittedDraft) !== JSON.stringify(draft)
    )
      throw Error("Inconsistent submission");
    submission = { draft: submittedDraft, evidence };
  }
  return {
    version: 2,
    page: value.page as WorkspaceState["page"],
    area: value.area as WorkspaceState["area"],
    mission: { draft, notebook, submission },
    practice: decodeSession(JSON.stringify(value.practice)),
    legacyImported: value.legacyImported,
  };
}
export function loadWorkspace(): {
  state: WorkspaceState;
  notice: string | null;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: newWorkspace(), notice: null };
    try {
      const state = decodeWorkspace(raw);
      return {
        state,
        notice:
          JSON.parse(raw).version === 1
            ? "Your previous decisions, business outcomes, lesson answers, and transfer results are preserved in My Development. This workspace starts a separate mission budget."
            : null,
      };
    } catch {
      try {
        localStorage.setItem(`${STORAGE_KEY}.recovery`, raw);
      } catch {
        /* Storage may be full or blocked. */
      }
      return {
        state: newWorkspace(),
        notice:
          "The saved workspace was unreadable or from an unsupported version. A fresh mission has been started; a recovery copy was retained when browser storage allowed.",
      };
    }
  } catch {
    return {
      state: newWorkspace(),
      notice:
        "Browser storage is unavailable. You can work in this tab, but your progress may be lost when it closes.",
    };
  }
}
export function saveWorkspace(state: WorkspaceState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, metrics: missionMetrics(state.mission) }),
    );
    return true;
  } catch {
    return false;
  }
}
