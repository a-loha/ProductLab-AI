export const channelNames = {
  organic: "Organic",
  referral: "Partner referrals",
  social: "Paid social",
} as const;
export type Channel = keyof typeof channelNames;
export const platforms = ["iOS", "Android"] as const;
export type Platform = (typeof platforms)[number];
export const periods = {
  previous: {
    label: "Previous cohort",
    trials: "25–31 Jul 2026",
    paid: "1–7 Aug 2026",
    mature: "D30 observed through 6 Sep 2026",
  },
  latest: {
    label: "Latest cohort",
    trials: "25–31 Aug 2026",
    paid: "1–7 Sep 2026",
    mature: "D30 observed through 7 Oct 2026",
  },
} as const;
export type Period = keyof typeof periods;
export type CohortRow = {
  period: Period;
  channel: Channel;
  platform: Platform;
  paid: number;
  activeD30: number;
};
export const cohorts: CohortRow[] = [
  {
    period: "previous",
    channel: "organic",
    platform: "iOS",
    paid: 200,
    activeD30: 70,
  },
  {
    period: "previous",
    channel: "organic",
    platform: "Android",
    paid: 200,
    activeD30: 70,
  },
  {
    period: "previous",
    channel: "referral",
    platform: "iOS",
    paid: 100,
    activeD30: 40,
  },
  {
    period: "previous",
    channel: "referral",
    platform: "Android",
    paid: 100,
    activeD30: 40,
  },
  {
    period: "previous",
    channel: "social",
    platform: "iOS",
    paid: 200,
    activeD30: 30,
  },
  {
    period: "previous",
    channel: "social",
    platform: "Android",
    paid: 200,
    activeD30: 30,
  },
  {
    period: "latest",
    channel: "organic",
    platform: "iOS",
    paid: 100,
    activeD30: 35,
  },
  {
    period: "latest",
    channel: "organic",
    platform: "Android",
    paid: 100,
    activeD30: 35,
  },
  {
    period: "latest",
    channel: "referral",
    platform: "iOS",
    paid: 100,
    activeD30: 40,
  },
  {
    period: "latest",
    channel: "referral",
    platform: "Android",
    paid: 100,
    activeD30: 40,
  },
  {
    period: "latest",
    channel: "social",
    platform: "iOS",
    paid: 300,
    activeD30: 45,
  },
  {
    period: "latest",
    channel: "social",
    platform: "Android",
    paid: 300,
    activeD30: 15,
  },
];
export const funnel = [
  {
    period: "previous" as Period,
    channel: "organic" as Channel,
    trials: 1000,
    paid: 400,
    spend: 8000,
  },
  {
    period: "previous" as Period,
    channel: "referral" as Channel,
    trials: 400,
    paid: 200,
    spend: 6000,
  },
  {
    period: "previous" as Period,
    channel: "social" as Channel,
    trials: 1600,
    paid: 400,
    spend: 16000,
  },
  {
    period: "latest" as Period,
    channel: "organic" as Channel,
    trials: 500,
    paid: 200,
    spend: 6000,
  },
  {
    period: "latest" as Period,
    channel: "referral" as Channel,
    trials: 400,
    paid: 200,
    spend: 6000,
  },
  {
    period: "latest" as Period,
    channel: "social" as Channel,
    trials: 3000,
    paid: 600,
    spend: 30000,
  },
];
export const subscriberLedger = {
  period: "1–30 Sep 2026",
  opening: 3200,
  newPaid: 1000,
  cancelled: 200,
  monthlyPrice: 12,
  grossMargin: 0.8,
};
export const limits = {
  budget: 12000,
  engineeringDays: 8,
  marketingBlocks: 4,
  blockSize: 1500,
};
export const initiatives = [
  {
    id: "repair",
    name: "Repair Android routine saving",
    cost: 6000,
    days: 5,
    kind: "Targeted repair",
    description:
      "Fix the reproducible save race, add a regression test, and stage the release with basic save telemetry.",
    tradeoff:
      "Restores a broken experience. A D30 effect remains unknown until new cohorts mature.",
  },
  {
    id: "monitor",
    name: "Strengthen cohort and rollout monitoring",
    cost: 1500,
    days: 2,
    kind: "Measurement",
    description:
      "Add version-level cohort logging, crash alerts, and a reproducible rollout dashboard.",
    tradeoff:
      "Makes comparisons safer and more reliable; measurement alone does not repair the experience.",
  },
  {
    id: "interviews",
    name: "Recruit contrasting user interviews",
    cost: 800,
    days: 0,
    kind: "Discovery",
    description:
      "Compare inactive paid-social Android users with retained users to test loss-of-routine and expectation hypotheses.",
    tradeoff:
      "Research-led with no engineering days. A small qualitative sample cannot estimate causal retention impact.",
  },
  {
    id: "redesign",
    name: "Redesign all onboarding",
    cost: 9500,
    days: 10,
    kind: "Broad redesign",
    description: "Rework onboarding across platforms and acquisition channels.",
    tradeoff:
      "Potentially broad value, but exceeds this sprint’s eight engineering days and makes attribution harder.",
  },
  {
    id: "streaks",
    name: "Build a daily streak feature",
    cost: 12000,
    days: 8,
    kind: "New feature",
    description: "Create a new motivation loop across the whole product.",
    tradeoff:
      "Uses the full budget and engineering capacity for a mechanism the current research has not validated.",
  },
  {
    id: "winback",
    name: "Launch a message-only win-back campaign",
    cost: 4000,
    days: 2,
    kind: "Lifecycle campaign",
    description:
      "Contact inactive subscribers using existing message channels; no recurring price concession.",
    tradeoff:
      "Fast contact, but neither message opens nor renewed activity would prove the save defect caused the original decline.",
  },
] as const;
export type InitiativeId = (typeof initiatives)[number]["id"];

export const evidenceSources = [
  { id: "channels", label: "Channel cohort snapshot", area: "analytics" },
  {
    id: "platforms",
    label: "Channel × platform comparison",
    area: "analytics",
  },
  { id: "mix", label: "Acquisition-mix counterfactual", area: "analytics" },
  { id: "funnel", label: "Acquisition funnel and spend", area: "analytics" },
  { id: "revenue", label: "September subscription ledger", area: "analytics" },
  { id: "interviews", label: "Targeted user interviews", area: "research" },
  { id: "sessions", label: "Routine-save session notes", area: "research" },
  { id: "ceo", label: "CEO priorities and request", area: "inbox" },
  { id: "analyst", label: "Analyst measurement validation", area: "inbox" },
  { id: "growth", label: "Growth team’s acquisition context", area: "inbox" },
  {
    id: "engineering",
    label: "Engineering defect reproduction",
    area: "inbox",
  },
] as const;
export type EvidenceId = (typeof evidenceSources)[number]["id"];
export const messages = [
  {
    id: "ceo",
    sender: "Maya Chen",
    role: "CEO",
    subject: "Can we get retention back to 28%?",
    body: "D30 is down seven points. Can we launch win-back this week? I also need to understand whether subscription revenue is shrinking. We have $12,000 for this decision cycle and eight engineering days. Bring me a bounded recommendation, what remains uncertain, and when we can check progress.",
    question: "How will you respond without promising an unsupported recovery?",
  },
  {
    id: "analyst",
    sender: "Owen Price",
    role: "Product Analyst",
    subject: "The retention signal is real; the denominator matters",
    body: "I validated the active-session event and UTC cohort boundaries. Both cohorts contain 1,000 new paying subscribers and are fully observed through day 30. Trial starts are a separate denominator. Use channel × platform before attributing the decline to a release. September billing has its own stock-and-flow ledger.",
    question: "How much is mix, and how much changed within a segment?",
  },
  {
    id: "growth",
    sender: "Leila Rahman",
    role: "Growth Lead",
    subject: "More trials, a different promise",
    body: "Paid social expanded from 40% to 60% of new paid subscribers. Its latest creative emphasizes quick body transformation; Pulse delivers daily wellness routines. Trial-to-paid conversion fell within that channel. I can reserve up to four $1,500 blocks for a small acquisition test, including a deliberate hold while we repair. Historical CAC is not a promise that spend will scale linearly.",
    question:
      "What acquisition learning would justify spending before scaling?",
  },
  {
    id: "engineering",
    sender: "Jonas Reed",
    role: "Engineering Lead",
    subject: "Android save failure reproduced",
    body: "On Android onboarding 2.4, rapidly leaving the routine picker can cancel the save request. We reproduced it on three supported devices. There is no evidence of payment, privacy, or safety harm. A targeted repair with regression checks takes five engineering days and $6,000. Basic rollout telemetry is included. A full redesign takes ten days. We can stage a safe repair; D30 attribution will still need a comparable mature cohort.",
    question:
      "Can we scope a safe fix without treating a defect as a quantified retention effect?",
  },
] as const;
export type MessageId = (typeof messages)[number]["id"];
export const researchCards = [
  {
    id: "routine",
    title: "A routine that disappeared",
    source:
      "4 of 12 inactive paid-social Android interviewees, recruited deliberately—not a representative sample",
    quote:
      "“I picked a routine, but when I opened Pulse that evening the plan was empty.”",
    context:
      "Eight interviewees mentioned a lost or missing routine in some form. Four described this exact sequence. These are reported experiences, not a causal effect estimate.",
    correct: "observed",
  },
  {
    id: "price",
    title: "“The price caused the entire decline”",
    source: "Internal hypothesis raised in a planning meeting",
    quote:
      "“Maybe everyone stopped returning because $12 feels too expensive.”",
    context:
      "No pricing change occurred in either cohort. This statement has not been tested with users or billing data. It could be investigated, but is not an observed pain point.",
    correct: "hypothesis",
  },
  {
    id: "intent",
    title: "An expectation mismatch",
    source: "2 of the 12 inactive interviewees from the same targeted sample",
    quote:
      "“The ad sounded like a workout transformation plan. I found meditation and short movement sessions.”",
    context:
      "The mismatch is an observed report. Whether it explains the aggregate decline remains a hypothesis; these users do not represent every paid-social subscriber.",
    correct: "observed",
  },
] as const;
export type ResearchId = (typeof researchCards)[number]["id"];
export const classifications = [
  { id: "observed", label: "Observed or reported pain point" },
  { id: "hypothesis", label: "Unvalidated explanation" },
  { id: "proof", label: "Proof of the full retention effect" },
] as const;

export const problemOptions = [
  {
    id: "value_gap",
    label:
      "D30 activity declined; localize where users fail to reach ongoing value.",
  },
  {
    id: "revenue_collapse",
    label: "Subscription revenue fell 25%, so we must discount immediately.",
  },
  {
    id: "missing_features",
    label: "Pulse lacks enough features to keep everyone engaged.",
  },
] as const;
export const hypothesisOptions = [
  {
    id: "save",
    label:
      "The Android save defect may reduce repeat use; quantify its effect.",
  },
  {
    id: "intent",
    label:
      "Changed acquisition intent may weaken activation and continued use.",
  },
  {
    id: "price",
    label: "Price caused the full decline, with no further evidence needed.",
  },
  {
    id: "streaks",
    label: "A missing streak feature is already established as the root cause.",
  },
] as const;
export const tradeoffOptions = [
  {
    id: "bounded",
    label:
      "Prioritize a bounded repair, defer broader bets, and measure without promising a retention lift.",
  },
  {
    id: "certainty",
    label:
      "Delay a reproducible defect repair until we can prove the complete retention effect.",
  },
  {
    id: "promise",
    label: "Commit to restoring 28% by the end of this sprint.",
  },
] as const;
export const successOptions = [
  {
    id: "save_then_d30",
    label:
      "Save success first; compare D30 in matched, fully matured post-change cohorts.",
  },
  {
    id: "mrr_tomorrow",
    label: "Tomorrow’s aggregate MRR proves whether onboarding improved.",
  },
  {
    id: "opens",
    label: "Win-back message open rate is the final retention success metric.",
  },
] as const;
export const guardrailOptions = [
  {
    id: "crash_checkout",
    label:
      "Monitor crash-free sessions and successful paid checkout; roll back on material harm.",
  },
  { id: "volume", label: "Only watch the total number of trial starts." },
  { id: "none", label: "Skip guardrails to ship faster." },
] as const;
export const ownerOptions = [
  {
    id: "shared",
    label:
      "PM owns the decision; Engineering owns safe rollout; Analyst owns readout; Growth owns acquisition test.",
  },
  {
    id: "engineering_only",
    label:
      "Engineering owns every outcome, including acquisition quality and business impact.",
  },
  { id: "unassigned", label: "Keep ownership open until after launch." },
] as const;
export const checkpointOptions = [
  {
    id: "staged",
    label:
      "Review save success and safety after five engineering days; schedule D30 after cohort maturity.",
  },
  { id: "tomorrow", label: "Report a causal D30 retention recovery tomorrow." },
  {
    id: "later",
    label: "Revisit whenever the overall retention number changes.",
  },
] as const;
export const ceoFrameOptions = [
  {
    id: "separate",
    label:
      "Separate the activity decline from growing subscription MRR; cite the measured cohort signal.",
  },
  {
    id: "conflate",
    label: "Tell the CEO revenue must have fallen because D30 fell.",
  },
  {
    id: "proven",
    label: "Tell the CEO the release caused all seven percentage points.",
  },
] as const;
export const ceoCommitOptions = [
  {
    id: "checkpoint",
    label:
      "Ask for the bounded sprint budget, name owners, and commit to an early checkpoint plus a mature D30 readout.",
  },
  {
    id: "promise",
    label:
      "Promise a return to 28% this week in exchange for immediate approval.",
  },
  {
    id: "silent",
    label: "Wait for complete certainty before giving any update.",
  },
] as const;
export const marketingReasons = [
  {
    id: "hold",
    label:
      "Hold acquisition spend until the confirmed experience defect is addressed.",
  },
  {
    id: "quality",
    label:
      "Run a bounded channel test; compare acquisition efficiency and value delivery before scaling.",
  },
  {
    id: "intent",
    label:
      "Reserve at most $3,000 in paid social to test a corrected promise, not to scale volume.",
  },
  {
    id: "cheapest",
    label:
      "Scale whichever channel has the cheapest trials; paid conversion and intent do not matter.",
  },
] as const;

export const definitions = {
  d30: {
    label: "D30 activity retention",
    group: "Metrics & measurement",
    definition:
      "The share of a paid-start cohort active on day 30 after first paid subscription starts.",
    formula: "Day-30 active subscribers ÷ original new-paid cohort × 100%",
    caveat:
      "Use fully matured cohorts and consistent events. Activity retention is not subscription renewal.",
  },
  cohort: {
    label: "Cohort & maturity",
    group: "Metrics & measurement",
    definition:
      "A group sharing a starting event and time window, followed using a consistent definition.",
    formula: "D30 maturity: every member has reached day 30",
    caveat:
      "Pulse uses paid-start cohorts. Trial conversion has a separate trial-start denominator; do not mix them.",
  },
  mix: {
    label: "Acquisition mix",
    group: "Metrics & measurement",
    definition: "Each channel’s share of new paid subscribers in the cohort.",
    formula: "Channel new paid ÷ all new paid × 100%",
    caveat:
      "A weighted average can fall when mix changes even if some segment rates stay constant.",
  },
  conversion: {
    label: "Trial-to-paid conversion",
    group: "Metrics & measurement",
    definition:
      "The share of trial starters who become paid subscribers within the defined conversion window.",
    formula: "Trials converting to paid ÷ trial starts × 100%",
    caveat:
      "Here trials last seven days and both windows are complete. More trials do not guarantee more paid subscribers.",
  },
  subscribers: {
    label: "Paid subscribers",
    group: "Subscription economics",
    definition:
      "The stock of active paying subscriptions at the end of the billing period.",
    formula: "Opening paid + new paid − cancelled = closing paid",
    caveat:
      "New paid subscribers are a flow. D30-active subscribers are a usage measure. Neither equals the closing paid stock.",
  },
  mrr: {
    label: "MRR",
    group: "Subscription economics",
    definition:
      "Monthly recurring subscription revenue at the current run rate.",
    formula: "Active paid subscriptions × monthly price (flat-plan model)",
    caveat:
      "Pulse assumes $12 flat plans, no expansion or discounts in this mission. Usage changes do not directly change MRR; it is not a cash receipt.",
  },
  arpa: {
    label: "ARPA",
    group: "Subscription economics",
    definition: "Average recurring revenue per active paid account per month.",
    formula: "MRR ÷ active paid accounts",
    caveat:
      "Pulse has one subscription per account, so ARPA is $12. Multi-seat and annual plans need more careful normalization.",
  },
  churn: {
    label: "Monthly subscriber churn",
    group: "Subscription economics",
    definition:
      "The share of subscribers present at the start of the month who cancel during that month.",
    formula: "Cancellations from opening stock ÷ opening paid stock × 100%",
    caveat:
      "Here 200 ÷ 3,200 = 6.25%. Activity retention cannot substitute for subscriber churn.",
  },
  subscriptionRetention: {
    label: "Subscription retention",
    group: "Subscription economics",
    definition:
      "The share of the opening paid subscriber stock that stays subscribed through a billing period.",
    formula: "(Opening paid − cancellations) ÷ opening paid × 100%",
    caveat:
      "Here monthly subscriber retention is 93.75%. It measures billing continuity, not day-30 app activity.",
  },
  cac: {
    label: "CAC",
    group: "Subscription economics",
    definition:
      "Acquisition spend per new paying subscriber in a matched acquisition window.",
    formula: "Attributed acquisition spend ÷ new paying subscribers",
    caveat:
      "Use paid conversions, not trials, in the denominator. Historical CAC may not hold at higher spend.",
  },
  ltv: {
    label: "Simplified gross-profit LTV",
    group: "Subscription economics",
    definition:
      "A rough lifetime gross-profit estimate under constant monthly churn, ARPA, and margin.",
    formula: "Monthly ARPA × gross margin ÷ monthly subscriber churn",
    caveat:
      "At $12, 80% margin and 6.25% monthly churn: $153.60. This steady-state model ignores cohort differences and is not a measured lifetime value.",
  },
  ratio: {
    label: "LTV / CAC",
    group: "Subscription economics",
    definition:
      "A comparison of estimated lifetime gross profit and acquisition cost.",
    formula: "Estimated gross-profit LTV ÷ CAC",
    caveat:
      "Pulse’s simplified estimate is about 3.66×. A ratio alone does not establish profitable growth, payback, or product-market fit.",
  },
  ab: {
    label: "A/B testing essentials",
    group: "Investigation & decisions",
    definition:
      "Compare randomized, eligible groups against a predefined hypothesis and outcome.",
    formula: "Treatment outcome − comparable control outcome",
    caveat:
      "Check sample size, allocation, instrumentation, and guardrails. Wait for retention maturity. Never withhold a necessary safety repair for attribution.",
  },
  guardrail: {
    label: "Guardrail",
    group: "Investigation & decisions",
    definition:
      "A measure that protects important user or business outcomes while optimizing another measure.",
    formula: "Define a harm threshold and a rollback decision before rollout",
    caveat:
      "Crash-free sessions and checkout success can guard a save-flow repair. A main metric improving does not excuse harm elsewhere.",
  },
  framework: {
    label: "Verify → Localize → Explain → Act",
    group: "Investigation & decisions",
    definition:
      "Validate measurement, find the affected segment, test competing mechanisms, then choose a bounded intervention.",
    formula: "Signal → segment → falsifiable hypothesis → action",
    caveat:
      "Finding a correlation narrows the search; it does not estimate a causal effect.",
  },
  discovery: {
    label: "Discovery: observation vs. hypothesis",
    group: "Investigation & decisions",
    definition:
      "An observed or reported pain point describes an experience; a hypothesis explains why a broader outcome changed.",
    formula: "Observation + competing explanation + disconfirming test",
    caveat:
      "Contrast retained and inactive users. A small interview sample is useful for mechanisms, not prevalence or causal effect size.",
  },
  prioritization: {
    label: "Prioritization & capacity",
    group: "Investigation & decisions",
    definition:
      "Compare expected user/business value, confidence, effort, risk, and reversibility within real constraints.",
    formula: "RICE: reach × impact × confidence ÷ effort (a discussion aid)",
    caveat:
      "Avoid false precision. A verified defect can justify a focused repair even before its full retention effect is quantified.",
  },
  jobs: {
    label: "Jobs to Be Done & opportunity mapping",
    group: "Investigation & decisions",
    definition:
      "Understand the progress a user seeks in a specific situation, then connect the desired outcome to unmet needs, possible solutions, and tests.",
    formula: "Situation → desired progress → opportunity → solution → test",
    caveat:
      "Ask about recent behavior and contrasting cases. In Pulse, losing a saved routine is a need to investigate; a streak feature is only one possible solution, not the need itself.",
  },
} as const;
export type Term = keyof typeof definitions;
