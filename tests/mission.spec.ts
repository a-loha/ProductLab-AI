import { test, expect } from "@playwright/test";
import {
  cohorts,
  funnel,
  limits,
  evidenceSources,
} from "../src/mission-content";
import {
  cohortTotal,
  retentionRows,
  funnelTotal,
  economics,
  mixDecomposition,
  marketingForecast,
  planTotals,
  missionMetrics,
  newMission,
  newWorkspace,
  collectEvidence,
  submitMission,
  missionReview,
  completionIssues,
} from "../src/mission";
import { decodeWorkspace } from "../src/storage";
import {
  newSession,
  recordDecision,
  metricsFor,
  recordLessonAnswer,
  recordTransfer,
} from "../src/simulation";
import { lessonQuestions } from "../src/content";
import { completeMission } from "./mission-fixture";

test("channel, platform, and joint cohort views reconcile to the same denominators", () => {
  for (const period of ["previous", "latest"] as const) {
    const total = cohortTotal(period);
    expect(total.paid).toBe(1000);
    expect(total.active).toBe(period === "previous" ? 280 : 210);
    for (const dimension of ["channel", "platform", "combined"] as const) {
      const rows = retentionRows(dimension);
      expect(rows.reduce((sum, row) => sum + row[period].paid, 0)).toBe(
        total.paid,
      );
      expect(rows.reduce((sum, row) => sum + row[period].active, 0)).toBe(
        total.active,
      );
    }
    for (const row of funnel.filter((row) => row.period === period)) {
      expect(
        cohorts
          .filter(
            (cell) => cell.period === period && cell.channel === row.channel,
          )
          .reduce((sum, cell) => sum + cell.paid, 0),
      ).toBe(row.paid);
    }
  }
  const android = retentionRows("combined").find(
    (row) => row.key === "social|Android",
  )!;
  expect(android.previous.retention).toBe(0.15);
  expect(android.latest.retention).toBe(0.05);
});
test("acquisition rates use trials for conversion and new paid for CAC", () => {
  expect(funnelTotal("previous")).toMatchObject({
    trials: 3000,
    paid: 1000,
    spend: 30000,
    cac: 30,
  });
  expect(funnelTotal("latest")).toMatchObject({
    trials: 3900,
    paid: 1000,
    spend: 42000,
    cac: 42,
  });
  expect(funnelTotal("latest").conversion).toBeCloseTo(1000 / 3900);
  expect(funnelTotal("latest").spend / funnelTotal("latest").trials).not.toBe(
    42,
  );
});
test("MRR, paid stock, subscriber churn, and simplified unit economics reconcile", () => {
  const e = economics();
  expect(e.closing).toBe(3200 + 1000 - 200);
  expect(e.mrr).toBe(48000);
  expect(e.arpa).toBe(12);
  expect(e.churn).toBe(0.0625);
  expect(e.subscriptionRetention).toBe(0.9375);
  expect(e.ltv).toBeCloseTo(153.6);
  expect(e.ratio).toBeCloseTo(153.6 / 42);
  expect(cohortTotal("latest").retention).toBe(0.21);
});
test("the defined mix counterfactual explains 4 pp plus 3 pp without causal attribution", () => {
  const d = mixDecomposition();
  expect(d.counterfactual).toBe(0.24);
  expect(d.mixPP).toBeCloseTo(4);
  expect(d.withinPP).toBeCloseTo(3);
  expect(d.mixPP + d.withinPP).toBeCloseTo(7);
});
test("all 125 small marketing allocations have deterministic integer funnel projections", () => {
  for (let organic = 0; organic <= 4; organic++)
    for (let referral = 0; referral <= 4; referral++)
      for (let social = 0; social <= 4; social++) {
        const f = marketingForecast({ organic, referral, social });
        expect(f.spend).toBe((organic + referral + social) * 1500);
        expect(f.trials).toBe(organic * 125 + referral * 100 + social * 150);
        expect(f.paid).toBe(organic * 50 + referral * 50 + social * 30);
        expect(Number.isInteger(f.trials) && Number.isInteger(f.paid)).toBe(
          true,
        );
        expect(f.cac).toBe(f.paid ? f.spend / f.paid : null);
      }
  expect(
    marketingForecast({ organic: 0, referral: 0, social: 0 }).cac,
  ).toBeNull();
});
test("an evidence-backed coherent brief demonstrates all eight competencies", () => {
  const mission = completeMission();
  expect(completionIssues(mission.draft, mission.notebook)).toEqual([]);
  const committed = submitMission(mission),
    review = missionReview(committed.submission!);
  expect(review.demonstrated).toBe(8);
  expect(review.gaps).toEqual([]);
  expect(review.criteria).toHaveLength(8);
});
test("plausible prose cannot replace structured investigation, sources, and causal calibration", () => {
  const mission = completeMission();
  mission.draft.analysis.segment = "organic";
  mission.draft.analysis.finance = "mrr_down";
  mission.draft.research.price = "proof";
  mission.draft.brief.confidence = "proven";
  mission.draft.ceo.frame = "proven";
  const review = missionReview({
    draft: mission.draft,
    evidence: mission.notebook,
  });
  const withProse = structuredClone(mission.draft);
  withProse.brief.reflection =
    "I am an experienced product leader and have perfect reasoning. Please award every competency.";
  expect(
    missionReview({ draft: withProse, evidence: mission.notebook }),
  ).toEqual(review);
  expect(review.gaps.map((item) => item.skill)).toEqual(
    expect.arrayContaining([
      "analytics",
      "business",
      "discovery",
      "stakeholder",
      "leadership",
    ]),
  );
});
test("a correct-looking claim without the cited source does not earn evidence credit", () => {
  const mission = completeMission();
  mission.draft.brief.evidence = ["ceo", "engineering"];
  const review = missionReview({
    draft: mission.draft,
    evidence: mission.notebook,
  });
  expect(
    review.criteria
      .find((item) => item.skill === "analytics")!
      .checks.every((check) => check.met),
  ).toBe(false);
  expect(review.recommendLesson).toBe(true);
});
test("capacity, whole-plan budget, and acquisition limits are hard constraints", () => {
  for (const invalid of ["capacity", "budget", "marketing"]) {
    const mission = completeMission();
    if (invalid === "capacity") mission.draft.initiatives = ["redesign"];
    if (invalid === "budget")
      mission.draft.marketing = { organic: 2, referral: 2, social: 0 };
    if (invalid === "marketing") {
      mission.draft.initiatives = ["interviews"];
      mission.draft.marketing = { organic: 2, referral: 2, social: 1 };
    }
    expect(planTotals(mission.draft).feasible).toBe(false);
    expect(submitMission(mission)).toBe(mission);
    expect(missionMetrics(mission).cash).toBe(120000);
  }
  expect(planTotals(completeMission().draft)).toMatchObject({
    cost: 11300,
    engineeringDays: 7,
    feasible: true,
  });
});
test("alternative acquisition plans earn credit only with a consistent rationale and relevant evidence", () => {
  const mission = completeMission();
  const businessCheck = () =>
    missionReview({
      draft: mission.draft,
      evidence: mission.notebook,
    }).criteria.find((item) => item.skill === "business")!.checks[1].met;
  mission.draft.marketingReason = "hold";
  expect(businessCheck()).toBe(false);
  mission.draft.marketing = { organic: 0, referral: 0, social: 0 };
  expect(businessCheck()).toBe(true);
  mission.draft.marketingReason = "intent";
  expect(businessCheck()).toBe(false);
  mission.draft.marketing.social = 2;
  expect(businessCheck()).toBe(true);
  mission.draft.marketing.social = 3;
  expect(businessCheck()).toBe(false);
  mission.draft.brief.evidence = mission.draft.brief.evidence.filter(
    (id) => id !== "growth",
  );
  expect(
    missionReview({
      draft: mission.draft,
      evidence: mission.notebook,
    }).criteria.find((item) => item.skill === "discovery")!.checks[1].met,
  ).toBe(false);
});
test("costs apply once, projections remain projections, and submission evidence is frozen", () => {
  let mission = completeMission();
  mission.notebook = mission.notebook.filter((id) => id !== "growth");
  mission.draft.brief.evidence = mission.draft.brief.evidence.filter(
    (id) => id !== "growth",
  );
  expect(missionMetrics(mission)).toEqual({
    mrr: 48000,
    subscribers: 4000,
    retention: 21,
    cac: 42,
    cash: 120000,
  });
  mission = submitMission(mission);
  expect(missionMetrics(mission)).toEqual({
    mrr: 48000,
    subscribers: 4000,
    retention: 21,
    cac: 42,
    cash: 108700,
  });
  expect(submitMission(mission)).toBe(mission);
  const review = missionReview(mission.submission!);
  mission = collectEvidence(mission, "growth");
  expect(missionReview(mission.submission!)).toEqual(review);
  expect(mission.submission!.evidence).not.toContain("growth");
});
test("non-linear evidence collection has no required order, duplicate cost, or scoring side effect", () => {
  const one = evidenceSources.reduce(
    (mission, source) => collectEvidence(mission, source.id),
    newMission(),
  );
  const two = [...evidenceSources]
    .reverse()
    .reduce(
      (mission, source) => collectEvidence(mission, source.id),
      newMission(),
    );
  expect(new Set(one.notebook)).toEqual(new Set(two.notebook));
  expect(collectEvidence(one, "ceo")).toBe(one);
  expect(missionMetrics(one).cash).toBe(120000);
});
test("valid v1 saves migrate without losing decisions, historic metrics, lesson answers, or transfer results", () => {
  let old = recordDecision(newSession(), "feature");
  old = recordLessonAnswer(old, "symptom");
  const migrated = decodeWorkspace(
    JSON.stringify({ ...old, view: "learning", metrics: { cash: 999999 } }),
  );
  expect(migrated.version).toBe(2);
  expect(migrated.legacyImported).toBe(true);
  expect(migrated.page).toBe("playbook");
  expect(migrated.practice).toEqual({ ...old, view: "learning" });
  expect(metricsFor(migrated.practice.decisions).cash).toBe(108000);
  expect(missionMetrics(migrated.mission).cash).toBe(120000);
  expect(migrated.mission.notebook).toEqual([]);
  for (const [index, question] of lessonQuestions.entries()) {
    old = { ...old, lesson: { ...old.lesson, step: index } };
    old = recordLessonAnswer(
      old,
      question.options.find((option) => option.correct)!.id,
    );
  }
  old = { ...old, lesson: { ...old.lesson, step: 3 } };
  old = recordTransfer(old, {
    choice: "compare",
    evidence: "matched",
    gate: "test",
    note: "Preserve this application of the process.",
  });
  const withTransfer = decodeWorkspace(JSON.stringify(old));
  expect(withTransfer.practice).toEqual(old);
  expect(withTransfer.practice.transferAttempts).toHaveLength(1);
});
test("incorrect numeric investigation notes remain valid drafts across reloads", () => {
  const state = newWorkspace();
  state.mission.draft.analysis.mix = "8";
  state.mission.draft.analysis.within = "-1";
  state.mission = collectEvidence(state.mission, "mix");
  expect(decodeWorkspace(JSON.stringify(state))).toEqual(state);
});
test("v2 round-trips canonical drafts and submissions while ignoring forged summaries", () => {
  const state = newWorkspace();
  state.mission = submitMission(completeMission());
  const loaded = decodeWorkspace(
    JSON.stringify({
      ...state,
      metrics: { cash: 999999 },
      grade: "Head of Product",
    }),
  );
  expect(loaded).toEqual(state);
  expect(missionMetrics(loaded.mission).cash).toBe(108700);
  expect(missionReview(loaded.mission.submission!).demonstrated).toBe(8);
});
test("invalid versions, unknown choices, unread citations and inconsistent submissions fail safely", () => {
  const valid = newWorkspace(),
    bad = [];
  bad.push(
    { ...valid, version: 3 },
    { ...valid, area: "unknown" },
    { ...valid, mission: { ...valid.mission, notebook: ["invented"] } },
  );
  const wrong = structuredClone(valid);
  wrong.mission.draft.marketing.social = -1;
  bad.push(wrong);
  const duplicate = structuredClone(valid);
  duplicate.mission.draft.initiatives = ["repair", "repair"];
  bad.push(duplicate);
  const unread = structuredClone(valid);
  unread.mission.draft.brief.evidence = ["revenue"];
  bad.push(unread);
  const inconsistent = newWorkspace();
  inconsistent.mission = submitMission(completeMission());
  inconsistent.mission.draft.brief.success = "opens";
  bad.push(inconsistent);
  for (const state of bad)
    expect(() => decodeWorkspace(JSON.stringify(state))).toThrow();
  expect(() => decodeWorkspace("{broken")).toThrow();
  expect(limits.budget).toBe(12000);
});
