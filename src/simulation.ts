import {
  scenarios,
  lessonQuestions,
  skillNames,
  transferChoices,
  evidenceChoices,
  gateChoices,
  lessonId,
} from "./content";
import type { Skill, LessonKey } from "./content";

export const views = [
  "dashboard",
  "simulation",
  "learning",
  "progress",
] as const;
export type View = (typeof views)[number];
export type Decision = { scenarioId: string; optionId: string };
export type TransferAttempt = {
  choice: string;
  evidence: string;
  gate: string;
  note: string;
};
export type Session = {
  version: 1;
  view: View;
  currentScenario: number;
  decisions: Decision[];
  lesson: { step: number; answers: Partial<Record<LessonKey, string>> };
  transferAttempts: TransferAttempt[];
};
export const BASELINE = { mrr: 48000, retention: 21, cac: 42, cash: 120000 };
export function newSession(): Session {
  return {
    version: 1,
    view: "dashboard",
    currentScenario: 0,
    decisions: [],
    lesson: { step: 0, answers: {} },
    transferAttempts: [],
  };
}
export function optionFor(decision: Decision) {
  const scenario = scenarios.find(
    (scenario) => scenario.id === decision.scenarioId,
  );
  const option = scenario?.options.find(
    (option) => option.id === decision.optionId,
  );
  if (!scenario || !option) throw new Error("Unknown simulation decision");
  return { scenario, option };
}
export function metricsFor(decisions: Decision[]) {
  return decisions.reduce(
    (metrics, decision) => {
      const { impact } = optionFor(decision).option;
      return {
        cash: metrics.cash - impact.cost,
        mrr: metrics.mrr + (impact.mrrDelta ?? 0),
        retention: metrics.retention,
        cac: impact.acquisition
          ? impact.acquisition.spend / impact.acquisition.newSubscribers
          : metrics.cac,
      };
    },
    { ...BASELINE },
  );
}
export function evaluateDecision(decision: Decision) {
  const { scenario, option } = optionFor(decision);
  return {
    scenarioId: scenario.id,
    selectedOption: option.id,
    evaluationCriteria: scenario.criteria.map((criterion) => ({
      ...criterion,
      demonstrated: option.demonstrated.includes(criterion.skill),
    })),
    skillTags: option.demonstrated,
    mistakeTags: option.mistakes,
    skillGaps: scenario.criteria
      .filter((criterion) => !option.demonstrated.includes(criterion.skill))
      .map((criterion) => criterion.skill),
    diagnosisGap: option.mistakes.length > 0 ? "problem_diagnosis" : null,
    recommendedLesson: option.mistakes.length > 0 ? lessonId : null,
    consequences: { ...option.impact, explanation: option.consequence },
  };
}
export function recordDecision(session: Session, optionId: string): Session {
  const index = session.currentScenario;
  const scenario = scenarios[index];
  if (
    !scenario ||
    session.decisions[index] ||
    index !== session.decisions.length ||
    !scenario.options.some((option) => option.id === optionId)
  )
    return session;
  return {
    ...session,
    decisions: [...session.decisions, { scenarioId: scenario.id, optionId }],
  };
}
export function continueSimulation(session: Session): Session {
  return {
    ...session,
    view: "simulation",
    currentScenario: session.decisions[session.currentScenario]
      ? Math.min(3, session.currentScenario + 1)
      : session.currentScenario,
  };
}
export function recordLessonAnswer(
  session: Session,
  optionId: string,
): Session {
  const question = lessonQuestions[session.lesson.step];
  if (
    !question ||
    session.lesson.answers[question.key] ||
    lessonQuestions
      .slice(0, session.lesson.step)
      .some((previous) => !session.lesson.answers[previous.key]) ||
    !question.options.some((option) => option.id === optionId)
  )
    return session;
  return {
    ...session,
    lesson: {
      ...session.lesson,
      answers: { ...session.lesson.answers, [question.key]: optionId },
    },
  };
}
export function evaluateTransfer(attempt: TransferAttempt) {
  const criteria = [
    {
      label: "Investigate before attributing cause",
      met: attempt.choice === "compare",
      skills: ["discovery"] as Skill[],
      explanation:
        "A release and a decline occurring together form a hypothesis, not proof. Validate the signal before committing to an intervention.",
    },
    {
      label: "Use mature, comparable cohorts",
      met: attempt.evidence === "matched",
      skills: ["analytics"] as Skill[],
      explanation:
        "D7 cohorts must have reached day 7. Match acquisition channel and platform so mix differences do not masquerade as a release effect.",
    },
    {
      label: "Use a conditional action and guardrails",
      met: attempt.gate === "test",
      skills: ["experimentation", "prioritization"] as Skill[],
      explanation:
        "Connect action to a verified mechanism, monitor safety, and measure the resulting behavior. Do not promise a retention recovery from timing alone.",
    },
  ];
  return { passed: criteria.every((criterion) => criterion.met), criteria };
}
export function recordTransfer(
  session: Session,
  attempt: TransferAttempt,
): Session {
  if (
    !lessonQuestions.every(
      (question) => session.lesson.answers[question.key],
    ) ||
    !transferChoices.some((option) => option.id === attempt.choice) ||
    !evidenceChoices.some((option) => option.id === attempt.evidence) ||
    !gateChoices.some((option) => option.id === attempt.gate) ||
    attempt.note.length > 600
  )
    return session;
  return {
    ...session,
    transferAttempts: [...session.transferAttempts, attempt].slice(-20),
  };
}
export function lessonCompleted(session: Session) {
  return (
    lessonQuestions.every((question) => session.lesson.answers[question.key]) &&
    session.transferAttempts.length > 0
  );
}
export function lessonRecommended(session: Session) {
  return session.decisions.some(
    (decision) => optionFor(decision).option.mistakes.length > 0,
  );
}
export type Evidence = {
  source: string;
  skill: Skill;
  met: boolean;
  detail: string;
};
export function evidenceFor(session: Session): Evidence[] {
  const evidence: Evidence[] = session.decisions.flatMap((decision) => {
    const { scenario, option } = optionFor(decision);
    return scenario.criteria.map((criterion) => ({
      source: scenario.title,
      skill: criterion.skill,
      met: option.demonstrated.includes(criterion.skill),
      detail: criterion.label,
    }));
  });
  for (const question of lessonQuestions) {
    const option = question.options.find(
      (option) => option.id === session.lesson.answers[question.key],
    );
    if (option)
      for (const skill of question.skills)
        evidence.push({
          source: question.title,
          skill,
          met: option.correct,
          detail: option.explanation,
        });
  }
  const latest = session.transferAttempts.at(-1);
  if (latest)
    for (const criterion of evaluateTransfer(latest).criteria) {
      for (const skill of criterion.skills)
        evidence.push({
          source: "D7 transfer challenge (latest attempt)",
          skill,
          met: criterion.met,
          detail: criterion.explanation,
        });
    }
  return evidence;
}
export function competencyFor(session: Session) {
  const evidence = evidenceFor(session);
  return (Object.keys(skillNames) as Skill[]).map((skill) => ({
    skill,
    name: skillNames[skill],
    demonstrated: evidence.filter((item) => item.skill === skill && item.met)
      .length,
    practiced: evidence.filter((item) => item.skill === skill).length,
    available:
      scenarios.filter((scenario) =>
        scenario.criteria.some((criterion) => criterion.skill === skill),
      ).length +
      lessonQuestions.filter((question) => question.skills.includes(skill))
        .length +
      (["analytics", "discovery", "experimentation", "prioritization"].includes(
        skill,
      )
        ? 1
        : 0),
  }));
}
