import {
  cohorts,
  funnel,
  channelNames,
  subscriberLedger,
  initiatives,
  limits,
  researchCards,
  evidenceSources,
} from "./mission-content";
import type {
  Channel,
  Period,
  EvidenceId,
  InitiativeId,
  ResearchId,
} from "./mission-content";
import { newSession } from "./simulation";
import type { Session } from "./simulation";
import type { Skill } from "./content";

export const areaNames = {
  brief: "Mission Brief",
  analytics: "Analytics",
  research: "User Research",
  inbox: "Team Inbox",
  backlog: "Product Backlog",
  decision: "Decision Brief",
} as const;
export type Area = keyof typeof areaNames;
export const competencyOrder: Skill[] = [
  "analytics",
  "business",
  "discovery",
  "experimentation",
  "strategy",
  "prioritization",
  "stakeholder",
  "leadership",
];
export type MissionDraft = {
  analysis: { segment: string; mix: string; within: string; finance: string };
  research: Record<ResearchId, string>;
  initiatives: InitiativeId[];
  marketing: Record<Channel, number>;
  marketingReason: string;
  ceo: { frame: string; commitment: string };
  brief: {
    problem: string;
    evidence: EvidenceId[];
    hypotheses: string[];
    confidence: string;
    tradeoff: string;
    success: string;
    guardrail: string;
    owner: string;
    checkpoint: string;
    reflection: string;
  };
};
export type Mission = {
  draft: MissionDraft;
  notebook: EvidenceId[];
  submission: { draft: MissionDraft; evidence: EvidenceId[] } | null;
};
export type WorkspaceState = {
  version: 2;
  page: "workspace" | "playbook" | "development";
  area: Area;
  mission: Mission;
  practice: Session;
  legacyImported: boolean;
};
export function newDraft(): MissionDraft {
  return {
    analysis: { segment: "", mix: "", within: "", finance: "" },
    research: { routine: "", price: "", intent: "" },
    initiatives: [],
    marketing: { organic: 0, referral: 0, social: 0 },
    marketingReason: "",
    ceo: { frame: "", commitment: "" },
    brief: {
      problem: "",
      evidence: [],
      hypotheses: [],
      confidence: "",
      tradeoff: "",
      success: "",
      guardrail: "",
      owner: "",
      checkpoint: "",
      reflection: "",
    },
  };
}
export function newMission(): Mission {
  return { draft: newDraft(), notebook: [], submission: null };
}
export function newWorkspace(
  practice: Session = newSession(),
  legacyImported = false,
): WorkspaceState {
  return {
    version: 2,
    page: "workspace",
    area: "brief",
    mission: newMission(),
    practice,
    legacyImported,
  };
}
export const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);
export const rate = (numerator: number, denominator: number) =>
  denominator ? numerator / denominator : 0;
export function cohortTotal(period: Period) {
  const rows = cohorts.filter((row) => row.period === period);
  const paid = sum(rows.map((row) => row.paid)),
    active = sum(rows.map((row) => row.activeD30));
  return { paid, active, retention: rate(active, paid) };
}
export function retentionRows(dimension: "channel" | "platform" | "combined") {
  const keys = [
    ...new Set(
      cohorts.map((row) =>
        dimension === "channel"
          ? row.channel
          : dimension === "platform"
            ? row.platform
            : `${row.channel}|${row.platform}`,
      ),
    ),
  ];
  return keys.map((key) => {
    const selected = cohorts.filter(
      (row) =>
        (dimension === "channel"
          ? row.channel
          : dimension === "platform"
            ? row.platform
            : `${row.channel}|${row.platform}`) === key,
    );
    const totals = (period: Period) => {
      const rows = selected.filter((row) => row.period === period);
      const paid = sum(rows.map((row) => row.paid)),
        active = sum(rows.map((row) => row.activeD30));
      return { paid, active, retention: rate(active, paid) };
    };
    const label =
      dimension === "channel"
        ? channelNames[key as Channel]
        : dimension === "platform"
          ? key
          : `${channelNames[key.split("|")[0] as Channel]} · ${key.split("|")[1]}`;
    return {
      key,
      label,
      previous: totals("previous"),
      latest: totals("latest"),
    };
  });
}
export function funnelTotal(period: Period) {
  const rows = funnel.filter((row) => row.period === period);
  const trials = sum(rows.map((row) => row.trials)),
    paid = sum(rows.map((row) => row.paid)),
    spend = sum(rows.map((row) => row.spend));
  return {
    trials,
    paid,
    spend,
    conversion: rate(paid, trials),
    cac: rate(spend, paid),
  };
}
export function economics() {
  const { opening, newPaid, cancelled, monthlyPrice, grossMargin } =
    subscriberLedger;
  const closing = opening + newPaid - cancelled,
    churn = rate(cancelled, opening);
  const mrr = closing * monthlyPrice,
    arpa = rate(mrr, closing),
    ltv = rate(arpa * grossMargin, churn);
  return {
    opening,
    closing,
    mrr,
    arpa,
    churn,
    subscriptionRetention: 1 - churn,
    ltv,
    ratio: rate(ltv, funnelTotal("latest").cac),
  };
}
export function mixDecomposition() {
  const rows = retentionRows("channel"),
    previous = cohortTotal("previous"),
    latest = cohortTotal("latest");
  const counterfactual =
    sum(rows.map((row) => row.latest.paid * row.previous.retention)) /
    latest.paid;
  return {
    counterfactual,
    mixPP: (previous.retention - counterfactual) * 100,
    withinPP: (counterfactual - latest.retention) * 100,
  };
}
export function marketingForecast(marketing: Record<Channel, number>) {
  const rows = funnel
    .filter((row) => row.period === "latest")
    .map((row) => {
      const spend = marketing[row.channel] * limits.blockSize;
      const trials = spend / (row.spend / row.trials),
        paid = (trials * row.paid) / row.trials;
      return { channel: row.channel, spend, trials, paid };
    });
  const spend = sum(rows.map((row) => row.spend)),
    trials = sum(rows.map((row) => row.trials)),
    paid = sum(rows.map((row) => row.paid));
  return { rows, spend, trials, paid, cac: paid ? spend / paid : null };
}
export function planTotals(draft: MissionDraft) {
  const work = draft.initiatives.map((id) =>
    initiatives.find((item) => item.id === id)!,
  );
  const engineeringDays = sum(work.map((item) => item.days)),
    workCost = sum(work.map((item) => item.cost)),
    marketing = marketingForecast(draft.marketing);
  return {
    engineeringDays,
    workCost,
    marketing,
    cost: workCost + marketing.spend,
    feasible:
      engineeringDays <= limits.engineeringDays &&
      workCost + marketing.spend <= limits.budget &&
      sum(Object.values(draft.marketing)) <= limits.marketingBlocks,
  };
}
export function missionMetrics(mission: Mission) {
  return {
    mrr: economics().mrr,
    subscribers: economics().closing,
    retention: cohortTotal("latest").retention * 100,
    cac: funnelTotal("latest").cac,
    cash:
      120000 -
      (mission.submission ? planTotals(mission.submission.draft).cost : 0),
  };
}
export function collectEvidence(mission: Mission, id: EvidenceId): Mission {
  if (mission.notebook.includes(id)) return mission;
  return { ...mission, notebook: [...mission.notebook, id] };
}
export function completionIssues(draft: MissionDraft, notebook: EvidenceId[]) {
  const issues: string[] = [],
    brief = draft.brief,
    plan = planTotals(draft);
  if (!brief.problem) issues.push("Define the problem.");
  if (
    brief.evidence.length < 2 ||
    brief.evidence.some((id) => !notebook.includes(id))
  )
    issues.push("Cite at least two sources you collected.");
  if (
    !brief.hypotheses.length ||
    brief.hypotheses.length > 2 ||
    !brief.confidence
  )
    issues.push("Select one or two hypotheses and calibrate their confidence.");
  if (!draft.initiatives.length)
    issues.push("Prioritize at least one backlog initiative.");
  if (plan.engineeringDays > limits.engineeringDays)
    issues.push("Bring the plan within eight engineering days.");
  if (plan.cost > limits.budget)
    issues.push("Bring the whole plan within the $12,000 budget.");
  if (sum(Object.values(draft.marketing)) > limits.marketingBlocks)
    issues.push("Use at most four acquisition-test blocks.");
  if (!draft.marketingReason)
    issues.push("Document an acquisition test or a deliberate hold.");
  if (!brief.tradeoff) issues.push("State the expected trade-off.");
  if (!brief.success || !brief.guardrail)
    issues.push("Define a success measure and a guardrail.");
  if (!brief.owner || !brief.checkpoint)
    issues.push("Assign owners and a credible checkpoint.");
  return issues;
}
export function submitMission(mission: Mission): Mission {
  if (
    mission.submission ||
    completionIssues(mission.draft, mission.notebook).length
  )
    return mission;
  return {
    ...mission,
    submission: {
      draft: structuredClone(mission.draft),
      evidence: [...mission.notebook],
    },
  };
}
export function missionReview(submission: NonNullable<Mission["submission"]>) {
  const d = submission.draft,
    b = d.brief,
    plan = planTotals(d);
  const cited = (id: EvidenceId) =>
    b.evidence.includes(id) && submission.evidence.includes(id);
  const targeted = d.initiatives.includes("repair"),
    primary = d.initiatives[0];
  const marketingReasoned =
    (plan.marketing.spend === 0 && d.marketingReason === "hold") ||
    (plan.marketing.spend > 0 && d.marketingReason === "quality") ||
    (d.marketingReason === "intent" &&
      d.marketing.social > 0 &&
      d.marketing.social * limits.blockSize <= 3000);
  const criteria: {
    skill: Skill;
    checks: { label: string; met: boolean; why: string }[];
  }[] = [
    {
      skill: "analytics",
      checks: [
        {
          label: "Localize the deteriorating cell",
          met: d.analysis.segment === "paid_android" && cited("platforms"),
          why: "Paid-social Android declined from 15% to 5%; aggregate platform rates also contain channel-mix effects. Cite the joint table.",
        },
        {
          label: "Decompose the weighted average",
          met:
            d.analysis.mix.trim() !== "" &&
            d.analysis.within.trim() !== "" &&
            Math.abs(Number(d.analysis.mix) - 4) < 0.01 &&
            Math.abs(Number(d.analysis.within) - 3) < 0.01 &&
            cited("mix"),
          why: "Using latest weights at previous rates yields 24%: 4 pp mix and 3 pp residual deterioration. This is a defined counterfactual, not a causal attribution.",
        },
      ],
    },
    {
      skill: "business",
      checks: [
        {
          label: "Separate billing stock from activity",
          met: d.analysis.finance === "mrr_up" && cited("revenue"),
          why: "MRR grew from $38,400 to $48,000: 3,200 + 1,000 − 200 = 4,000 paid subscriptions. Activity D30 fell independently.",
        },
        {
          label: "Reason about acquisition efficiency and scope",
          met: marketingReasoned && cited("funnel"),
          why: "Use trial-to-paid conversion and new-paid CAC, not cheap trials alone. A hold requires zero allocated spend; a corrected-promise test requires $1,500–$3,000 in paid social. A bounded channel test is also defensible. Forecasts do not change actual MRR or CAC.",
        },
      ],
    },
    {
      skill: "discovery",
      checks: [
        {
          label: "Distinguish pain reports from explanations",
          met:
            researchCards.every(
              (card) => d.research[card.id] === card.correct,
            ) && cited("interviews"),
          why: "Routine loss and expectation mismatch are reported pain points in a targeted sample. A claim that price caused the whole decline is an untested explanation.",
        },
        {
          label: "Keep hypotheses falsifiable",
          met:
            b.confidence === "unquantified" &&
            b.hypotheses.every((id) =>
              id === "save"
                ? cited("sessions") || cited("engineering")
                : id === "intent" && cited("interviews") && cited("growth"),
            ) &&
            b.hypotheses.length > 0 &&
            b.hypotheses.length <= 2,
          why: "Support the save hypothesis with session or engineering evidence; support intent mismatch with interviews and Growth’s context. Neither establishes the entire seven-point retention effect.",
        },
      ],
    },
    {
      skill: "experimentation",
      checks: [
        {
          label: "Use an early signal and a mature outcome",
          met: b.success === "save_then_d30" && b.checkpoint === "staged",
          why: "Save success is an early mechanism measure. D30 requires a comparable cohort followed for 30 days; tomorrow’s revenue or message opens cannot replace it.",
        },
        {
          label: "Make the intervention safe and interpretable",
          met:
            targeted &&
            b.guardrail === "crash_checkout" &&
            cited("engineering"),
          why: "Stage the confirmed defect repair with crash and checkout guardrails. Protect users while acknowledging limits of causal attribution.",
        },
      ],
    },
    {
      skill: "strategy",
      checks: [
        {
          label: "Frame an ongoing-value problem",
          met: b.problem === "value_gap",
          why: "The strategic question is where users fail to reach continued value, not whether feature count or revenue must mirror activity retention.",
        },
        {
          label: "Align the portfolio to current evidence",
          met:
            targeted &&
            ["repair", "monitor", "interviews"].includes(primary) &&
            !d.initiatives.includes("streaks") &&
            b.tradeoff === "bounded",
          why: "A bounded repair/research portfolio addresses current evidence and makes room to learn before a broad feature bet.",
        },
      ],
    },
    {
      skill: "prioritization",
      checks: [
        {
          label: "Commit an executable plan",
          met: plan.feasible && d.initiatives.length > 0,
          why: "The entire portfolio—including the acquisition test—must fit $12,000 and eight engineering days. Priority order alone does not create capacity.",
        },
        {
          label: "Prioritize a known mechanism and name the trade-off",
          met: primary === "repair" && b.tradeoff === "bounded",
          why: "A reproducible save failure justifies a focused repair now. Defer broader bets and avoid promising an immediate retention lift.",
        },
      ],
    },
    {
      skill: "stakeholder",
      checks: [
        {
          label: "Answer the CEO with facts and uncertainty",
          met: cited("ceo") && d.ceo.frame === "separate" && cited("revenue"),
          why: "Address the CEO’s billing concern using the ledger while explaining the separate usage signal. Timing alone cannot establish the release’s effect.",
        },
        {
          label: "Make a bounded request and update commitment",
          met: d.ceo.commitment === "checkpoint" && cited("engineering"),
          why: "Request the scoped budget, acknowledge engineering capacity, assign owners, and promise a checkpoint rather than an unsupported recovery.",
        },
      ],
    },
    {
      skill: "leadership",
      checks: [
        {
          label: "Create shared accountability",
          met: b.owner === "shared" && b.checkpoint === "staged",
          why: "PM owns the decision; Engineering, Analyst, and Growth own their deliverables. Separate a five-day safety checkpoint from a mature D30 readout.",
        },
        {
          label: "Communicate calibrated confidence",
          met:
            b.confidence === "unquantified" &&
            d.ceo.frame === "separate" &&
            d.ceo.commitment === "checkpoint",
          why: "Make uncertainty visible without becoming passive. A verified defect can be repaired before its full business effect is known.",
        },
      ],
    },
  ];
  const gaps = criteria.filter(
    (criterion) => !criterion.checks.every((check) => check.met),
  );
  return {
    criteria,
    demonstrated: criteria.filter((criterion) =>
      criterion.checks.every((check) => check.met),
    ).length,
    gaps,
    plan,
    metrics: missionMetrics({
      draft: d,
      notebook: submission.evidence,
      submission,
    }),
    recommendLesson: gaps.some((criterion) =>
      ["analytics", "discovery", "experimentation"].includes(criterion.skill),
    ),
  };
}
export function sourceLabel(id: EvidenceId) {
  return evidenceSources.find((source) => source.id === id)!.label;
}
