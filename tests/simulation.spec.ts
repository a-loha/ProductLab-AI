import { test, expect } from "@playwright/test";
import {
  BASELINE,
  competencyFor,
  continueSimulation,
  evaluateDecision,
  evaluateTransfer,
  evidenceFor,
  lessonCompleted,
  lessonRecommended,
  metricsFor,
  newSession,
  recordDecision,
  recordLessonAnswer,
  recordTransfer,
} from "../src/simulation";
import type { Session, TransferAttempt } from "../src/simulation";
import {
  channelRows,
  platformRows,
  scenarios,
  lessonQuestions,
  transferChoices,
  evidenceChoices,
  gateChoices,
} from "../src/content";
import { decodeSession } from "../src/storage";

function finishLesson(initial: Session = newSession()): Session {
  let session = initial;
  for (let index = 0; index < lessonQuestions.length; index++) {
    session = { ...session, lesson: { ...session.lesson, step: index } };
    session = recordLessonAnswer(
      session,
      lessonQuestions[index].options.find((option) => option.correct)!.id,
    );
  }
  return { ...session, lesson: { ...session.lesson, step: 3 } };
}
const passing: TransferAttempt = {
  choice: "compare",
  evidence: "matched",
  gate: "test",
  note: "Check cohort maturity and test competing explanations.",
};

test("cohort totals and mix decomposition support every numerical claim", () => {
  expect(channelRows.reduce((sum, row) => sum + row.beforeN, 0)).toBe(1000);
  expect(channelRows.reduce((sum, row) => sum + row.afterN, 0)).toBe(1000);
  expect(channelRows.reduce((sum, row) => sum + row.beforeActive, 0)).toBe(280);
  expect(channelRows.reduce((sum, row) => sum + row.afterActive, 0)).toBe(210);
  const fixedRateActive = channelRows.reduce(
    (sum, row) => sum + (row.afterN * row.beforeActive) / row.beforeN,
    0,
  );
  expect(fixedRateActive).toBe(240);
  expect(((280 - fixedRateActive) / 1000) * 100).toBe(4);
  expect(((fixedRateActive - 210) / 1000) * 100).toBe(3);
  expect(platformRows.reduce((sum, row) => sum + row.beforeActive, 0)).toBe(60);
  expect(platformRows.reduce((sum, row) => sum + row.afterActive, 0)).toBe(60);
  expect(platformRows.reduce((sum, row) => sum + row.afterN, 0)).toBe(600);
});

test("investigations spend money once and never manufacture business outcomes", () => {
  let session = recordDecision(newSession(), "audit");
  const first = session;
  expect(metricsFor(session.decisions)).toEqual({ ...BASELINE, cash: 118500 });
  expect(recordDecision(session, "feature")).toBe(first);
  session = recordDecision(continueSimulation(session), "paid");
  session = recordDecision(continueSimulation(session), "pilot");
  expect(metricsFor(session.decisions)).toEqual({ ...BASELINE, cash: 111500 });
  expect(continueSimulation(session).currentScenario).toBe(3);
  expect(
    recordDecision(continueSimulation(session), "pilot").decisions,
  ).toHaveLength(3);
});

test("discount and acquisition calculations follow their declared fictional rules", () => {
  let session = recordDecision(newSession(), "interviews");
  session = recordDecision(continueSimulation(session), "discount");
  expect(metricsFor(session.decisions)).toEqual({
    ...BASELINE,
    cash: 117700,
    mrr: 47520,
  });
  const acquisition = recordDecision(
    continueSimulation(session),
    "acquisition",
  );
  expect(metricsFor(acquisition.decisions)).toEqual({
    cash: 87700,
    mrr: 54720,
    cac: 50,
    retention: 21,
  });
  const discount = recordDecision(continueSimulation(session), "offer");
  expect(metricsFor(discount.decisions)).toEqual({
    ...BASELINE,
    cash: 115200,
    mrr: 46560,
  });
});

test("all 64 scenario paths have consistent finances, valid tags, and bounded skill evidence", () => {
  for (const a of scenarios[0].options)
    for (const b of scenarios[1].options)
      for (const c of scenarios[2].options) {
        let session = recordDecision(newSession(), a.id);
        session = recordDecision(continueSimulation(session), b.id);
        session = recordDecision(continueSimulation(session), c.id);
        const metrics = metricsFor(session.decisions);
        expect(metrics.cash).toBe(
          120000 - a.impact.cost - b.impact.cost - c.impact.cost,
        );
        expect(metrics.retention).toBe(21);
        expect(metrics.mrr).toBe(
          48000 +
            (a.impact.mrrDelta ?? 0) +
            (b.impact.mrrDelta ?? 0) +
            (c.impact.mrrDelta ?? 0),
        );
        expect(metrics.cac).toBe(c.impact.acquisition ? 50 : 42);
        expect(metrics.cash).toBeGreaterThan(0);
        expect(decodeSession(JSON.stringify(session))).toEqual(session);
        for (const skill of competencyFor(session))
          expect(skill.demonstrated).toBeLessThanOrEqual(skill.available);
      }
});

test("solution-first behavior assigns the explicit diagnosis lesson without awarding a grade", () => {
  const session = recordDecision(newSession(), "feature");
  expect(lessonRecommended(session)).toBe(true);
  expect(evaluateDecision(session.decisions[0])).toMatchObject({
    scenarioId: "retention_crisis",
    selectedOption: "feature",
    diagnosisGap: "problem_diagnosis",
    mistakeTags: expect.arrayContaining(["solution_first_thinking"]),
    recommendedLesson: "diagnosing_retention_drop",
  });
  expect(
    competencyFor(session).every((skill) => skill.demonstrated === 0),
  ).toBe(true);
  expect(lessonRecommended(recordDecision(newSession(), "audit"))).toBe(false);
});

test("lessons require sequential answers and cannot award evidence through replay", () => {
  const start = newSession();
  expect(recordLessonAnswer(start, "nonexistent")).toBe(start);
  const skipped = { ...start, lesson: { step: 2, answers: {} } };
  expect(recordLessonAnswer(skipped, "android")).toBe(skipped);
  const session = recordLessonAnswer(start, "symptom");
  expect(evidenceFor(session)).toHaveLength(1);
  expect(recordLessonAnswer(session, "churn")).toBe(session);
  expect(lessonCompleted(finishLesson())).toBe(false);
});

test("all 36 transfer combinations are scored against the three explicit criteria", () => {
  let passed = 0;
  for (const choice of transferChoices)
    for (const evidence of evidenceChoices)
      for (const gate of gateChoices) {
        const result = evaluateTransfer({
          choice: choice.id,
          evidence: evidence.id,
          gate: gate.id,
          note: "",
        });
        expect(
          result.criteria.filter((criterion) => criterion.met),
        ).toHaveLength(
          Number(choice.id === "compare") +
            Number(evidence.id === "matched") +
            Number(gate.id === "test"),
        );
        if (result.passed) passed++;
      }
  expect(passed).toBe(1);
  expect(evaluateTransfer({ ...passing, note: "" }).passed).toBe(true);
  expect(
    evaluateTransfer({
      ...passing,
      choice: "rollback",
      note: "A long fluent explanation cannot override the structured rubric.",
    }).passed,
  ).toBe(false);
});

test("transfer requires the lesson and retries update rather than multiply competency evidence", () => {
  const initial = newSession();
  expect(recordTransfer(initial, passing)).toBe(initial);
  let session = finishLesson();
  session = recordTransfer(session, { ...passing, evidence: "aggregate" });
  expect(lessonCompleted(session)).toBe(true);
  const evidenceCount = evidenceFor(session).length;
  session = recordTransfer(session, passing);
  const skills = competencyFor(session);
  for (let index = 0; index < 25; index++)
    session = recordTransfer(session, passing);
  expect(competencyFor(session)).toEqual(skills);
  expect(evidenceFor(session)).toHaveLength(evidenceCount);
  expect(session.transferAttempts).toHaveLength(20);
  expect(metricsFor(session.decisions)).toEqual(BASELINE);
});

test("valid saves round-trip and tampered metric/competency summaries are ignored", () => {
  const session = recordTransfer(
    finishLesson(recordDecision(newSession(), "feature")),
    passing,
  );
  const loaded = decodeSession(
    JSON.stringify({
      ...session,
      metrics: { cash: 999999 },
      competencies: [{ demonstrated: 999 }],
    }),
  );
  expect(loaded).toEqual(session);
  expect(metricsFor(loaded.decisions).cash).toBe(108000);
});

test("corrupted, future, invalid, duplicate, and nonsequential saved data are rejected", () => {
  const start = newSession();
  const invalid: unknown[] = [
    null,
    [],
    { ...start, version: 99 },
    { ...start, view: "unknown" },
    { ...start, currentScenario: 3 },
    {
      ...start,
      decisions: [{ scenarioId: "product_decision", optionId: "pilot" }],
    },
    {
      ...start,
      decisions: [{ scenarioId: "retention_crisis", optionId: "unknown" }],
    },
    {
      ...start,
      decisions: [
        { scenarioId: "retention_crisis", optionId: "audit" },
        { scenarioId: "retention_crisis", optionId: "audit" },
      ],
    },
    { ...start, lesson: { step: 3, answers: {} } },
    { ...start, lesson: { step: 0, answers: { pattern: "android" } } },
    { ...start, transferAttempts: [passing] },
    { ...finishLesson(), transferAttempts: [{ ...passing, note: 42 }] },
  ];
  for (const value of invalid)
    expect(() => decodeSession(JSON.stringify(value))).toThrow();
  expect(() => decodeSession("{bad json")).toThrow();
});
