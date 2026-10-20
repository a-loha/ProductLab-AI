export const skillNames = {
  analytics: "Product Analytics",
  discovery: "Problem Discovery",
  experimentation: "Experimentation",
  prioritization: "Prioritization",
  business: "Business Thinking",
} as const;
export type Skill = keyof typeof skillNames;
export const lessonId = "diagnosing_retention_drop" as const;
export const mistakeNames: Record<string, string> = {
  solution_first_thinking: "Solution-first thinking",
  unverified_measurement: "Unverified measurement",
  wrong_segment: "Wrong segment",
  mix_only_explanation: "Incomplete decomposition",
  proxy_metric_confusion: "Activity vs. billing confusion",
  uncontrolled_rollout: "Uncontrolled rollout",
  acquisition_before_diagnosis: "Acquisition before diagnosis",
  causal_overclaim: "Causal overclaim",
};

export type Impact = {
  cost: number;
  mrrDelta?: number;
  acquisition?: { spend: number; newSubscribers: number };
};
export type Option = {
  id: string;
  title: string;
  description: string;
  tradeoff: string;
  demonstrated: Skill[];
  mistakes: string[];
  feedback: string;
  next: string;
  impact: Impact;
  consequence: string;
};
export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  question: string;
  criteria: { skill: Skill; label: string }[];
  options: Option[];
};

export const scenarios: Scenario[] = [
  {
    id: "retention_crisis",
    title: "Retention Crisis",
    subtitle: "First, understand the signal.",
    context:
      "You lead Pulse, a subscription wellness app for short movement and mindfulness routines. Across two fully matured signup cohorts, D30 activity retention fell from 28% to 21%. The CEO asks for a win-back campaign this week. Cohort sizes, tracking health, and channel mix still need checking.",
    question: "Where will you invest your first investigation budget?",
    criteria: [
      {
        skill: "analytics",
        label: "Verify the retention definition, events, and cohort maturity.",
      },
      {
        skill: "discovery",
        label: "Separate an observed symptom from an assumed cause.",
      },
      {
        skill: "prioritization",
        label:
          "Sequence high-information work before an expensive intervention.",
      },
    ],
    options: [
      {
        id: "audit",
        title: "Verify the signal, then segment cohorts",
        description:
          "Check definitions, instrumentation and cohort sizes; compare acquisition channels and platforms.",
        tradeoff:
          "$1,500 analysis budget. Delays immediate outreach, but reduces the risk of solving the wrong problem.",
        demonstrated: ["analytics", "discovery", "prioritization"],
        mistakes: [],
        feedback:
          "You prioritize trustworthy evidence before choosing a solution. A 7 percentage-point drop is a signal, not a diagnosis. Segment comparisons can localize it; they cannot establish causation alone.",
        next: "Pair the quantitative check with interviews from the affected segment once it is identified.",
        impact: { cost: 1500 },
        consequence:
          "$1,500 is spent on analysis. No retention, revenue, or acquisition outcome has been measured yet.",
      },
      {
        id: "interviews",
        title: "Start with interviews of inactive subscribers",
        description:
          "Speak to eight users who stopped using Pulse and look for unmet needs.",
        tradeoff:
          "$800 research budget. Rich detail quickly, but a small convenience sample may hide a mix or tracking issue.",
        demonstrated: ["discovery", "prioritization"],
        mistakes: ["unverified_measurement"],
        feedback:
          "Listening to inactive users can expose useful hypotheses. But eight interviews cannot verify whether the overall decline is real or representative. A tracking change or different acquisition mix could produce the same symptom.",
        next: "Verify event definitions and cohort sizes, then recruit interviews from the affected segment.",
        impact: { cost: 800 },
        consequence:
          "$800 is spent on research. Interview stories are qualitative evidence, not a measured change in retention.",
      },
      {
        id: "winback",
        title: "Commit to the CEO’s win-back campaign",
        description:
          "Prepay marketing capacity to send offers to inactive subscribers this week.",
        tradeoff:
          "$4,000 campaign budget. Fast customer contact, but the reason for inactivity remains unknown.",
        demonstrated: [],
        mistakes: ["solution_first_thinking", "unverified_measurement"],
        feedback:
          "You respond quickly to a business concern. However, contacting inactive subscribers treats the symptom before verifying the decline. Campaign opens and redemptions would not prove the original retention problem has been resolved.",
        next: "Define what the campaign would test, and audit the original cohorts before expanding it.",
        impact: { cost: 4000 },
        consequence:
          "$4,000 is paid upfront for campaign capacity. No campaign response, MRR lift, or retention lift is assumed.",
      },
      {
        id: "feature",
        title: "Build a streak feature immediately",
        description:
          "Prepay a delivery sprint to add daily streaks as a reason to return.",
        tradeoff:
          "$12,000 delivery budget. Creates a visible response, but commits heavily to an untested explanation.",
        demonstrated: [],
        mistakes: ["solution_first_thinking", "causal_overclaim"],
        feedback:
          "A streak feature might help if a missing habit loop is the problem. Nothing yet supports that explanation over tracking issues, changing user intent, or a broken experience. Shipping would be a costly hypothesis, not a diagnosis.",
        next: "List competing explanations and choose a low-cost check that could disprove each one.",
        impact: { cost: 12000 },
        consequence:
          "$12,000 is paid upfront for delivery. Shipping a feature does not automatically increase activity retention or subscription revenue.",
      },
    ],
  },
  {
    id: "segment_investigation",
    title: "Segment Investigation",
    subtitle: "Find where the average breaks.",
    context:
      "The analyst has now validated tracking and confirmed that both cohorts contain 1,000 new paying subscribers, each observed through day 30. The same snapshot is available whichever first action you chose. Your earlier spend remains on the books.",
    question: "Which interpretation should guide the next investigation?",
    criteria: [
      {
        skill: "analytics",
        label:
          "Separate changing channel weights from changing within-channel retention.",
      },
      {
        skill: "discovery",
        label: "Localize the affected users without declaring a cause.",
      },
      {
        skill: "business",
        label:
          "Keep activity retention distinct from billing and acquisition volume.",
      },
    ],
    options: [
      {
        id: "paid",
        title: "Investigate paid social: both mix and quality changed",
        description:
          "Its share grew from 40% to 60%, while its D30 retention fell from 15% to 10%.",
        tradeoff:
          "$1,000 analysis budget. Focused follow-up, while keeping acquisition intent, platform, and product bugs as competing explanations.",
        demonstrated: ["analytics", "discovery", "business"],
        mistakes: [],
        feedback:
          "Both mechanisms matter. Applying previous retention rates to the latest mix gives 24%, so composition explains 4 percentage points of the 7-point drop. Paid-social deterioration contributes the remaining 3 points. The segment is located; the cause is still unproven.",
        next: "Compare platform, landing-page promise, and onboarding versions inside paid social.",
        impact: { cost: 1000 },
        consequence:
          "$1,000 is spent on segment analysis. Identifying the segment does not change the already observed 21% D30 retention.",
      },
      {
        id: "organic",
        title: "Investigate organic because it lost the most retained users",
        description: "Organic day-30 active users fell from 140 to 70.",
        tradeoff:
          "$800 research budget. A large absolute change is worth understanding, but counts can fall because the cohort shrank.",
        demonstrated: ["business"],
        mistakes: ["wrong_segment"],
        feedback:
          "Organic contributes fewer retained users, but its retention rate remains 35%. Its cohort halved from 400 to 200. Treating that count change as worse product retention points the investigation at the wrong behavior.",
        next: "Compare rates and cohort sizes together. Paid social is the channel with a declining within-channel rate.",
        impact: { cost: 800 },
        consequence:
          "$800 is spent on follow-up. Organic’s smaller acquisition volume is an observation, not evidence that its users retain worse.",
      },
      {
        id: "mix",
        title: "Conclude that acquisition mix explains the entire decline",
        description:
          "The business acquired more users from a historically lower-retaining channel.",
        tradeoff:
          "$500 analysis budget. Recognizes a real composition effect, but stops before checking within-channel deterioration.",
        demonstrated: ["discovery", "business"],
        mistakes: ["mix_only_explanation"],
        feedback:
          "The mix shift is real. But at previous channel rates, the latest cohort would retain at 24%, not 21%. Paid social also declined from 15% to 10%. A mix-only explanation leaves 3 percentage points unexplained.",
        next: "Calculate a fixed-rate counterfactual, then investigate the residual inside paid social.",
        impact: { cost: 500 },
        consequence:
          "$500 is spent on analysis. No acquisition allocation or business outcome changes merely because an explanation was selected.",
      },
      {
        id: "discount",
        title: "Offer a recurring discount to prevent subscription churn",
        description:
          "Give 400 current subscribers a recurring 10% discount on their $12 monthly plan.",
        tradeoff:
          "$1,500 setup cost and $480 less MRR. Could address price objections, but the available metric measures app activity.",
        demonstrated: [],
        mistakes: ["proxy_metric_confusion", "solution_first_thinking"],
        feedback:
          "D30 here measures activity, not renewal or cancellation. A price intervention may be appropriate with evidence of price-driven churn, but that evidence is absent. The recurring discount has a predictable revenue cost even without a usage effect.",
        next: "Inspect billing churn separately and diagnose paid-social activity retention before using price as the lever.",
        impact: { cost: 1500, mrrDelta: -480 },
        consequence:
          "Cash falls $1,500. MRR falls $480: 400 × $12 × 10%. No reactivation, renewal, or D30 improvement is assumed.",
      },
    ],
  },
  {
    id: "product_decision",
    title: "Product Decision",
    subtitle: "Act on evidence. Preserve what you can learn.",
    context:
      "Follow-up inside paid social shows Android D30 fell from 15% to 5%; iOS stayed at 15%. Eight of twelve interviewed inactive Android users describe losing their routine. Engineering can reproduce a save failure in the new onboarding flow. This establishes a defect, but not how much of the retention decline it caused; channel mix and user intent still matter.",
    question: "Which intervention will you prioritize with the remaining cash?",
    criteria: [
      {
        skill: "experimentation",
        label:
          "Define a comparison, guardrails, and an outcome before claiming impact.",
      },
      {
        skill: "prioritization",
        label:
          "Match the scope and urgency of the intervention to the evidence.",
      },
      {
        skill: "business",
        label: "Make the budget and revenue trade-off explicit.",
      },
    ],
    options: [
      {
        id: "pilot",
        title: "Repair the save defect and stage a measured rollout",
        description:
          "Verify the fix, release to a small eligible group, and compare matched cohorts. Track save success now and D30 when mature.",
        tradeoff:
          "$6,000 budget. Reduces exposure while preserving a readout; a staged rollout leaves some users waiting, so severe failures need a safe fallback.",
        demonstrated: ["experimentation", "prioritization", "business"],
        mistakes: [],
        feedback:
          "You connect a reproducible defect to a bounded intervention and separate immediate save success from delayed retention. Compare similar users, define crash and payment guardrails, and expand only after the fix is safe. Do not withhold a necessary safety fix just to preserve an experiment.",
        next: "Predefine cohort eligibility, a staged rollout threshold, and a D30 readout date. A future measured result can update retention; this decision alone cannot.",
        impact: { cost: 6000 },
        consequence:
          "$6,000 is spent on a verified repair and rollout setup. There is no mature post-fix cohort, so D30, CAC, and MRR remain unchanged.",
      },
      {
        id: "rollout",
        title: "Roll out the fix to everyone with monitoring",
        description:
          "Prioritize restoring the broken save experience across Android immediately.",
        tradeoff:
          "$18,000 expedited rollout budget. Fast relief for a confirmed defect, with less ability to attribute a later retention change.",
        demonstrated: ["prioritization", "business"],
        mistakes: ["uncontrolled_rollout"],
        feedback:
          "Fixing a reproducible defect promptly is defensible. The trade-off is a broad change with a weaker counterfactual. Monitoring can detect failures, but a later aggregate retention improvement could also reflect channel mix or seasonality.",
        next: "Keep a rollback path and compare matched pre/post cohorts. State the limits of causal attribution.",
        impact: { cost: 18000 },
        consequence:
          "$18,000 is spent on expedited remediation. The save defect is addressed in this fictional action, but no retention effect is yet observed.",
      },
      {
        id: "acquisition",
        title:
          "Run a partner acquisition cycle while engineering queues the fix",
        description:
          "Move the next acquisition cycle to partner referrals and observe new paid signups.",
        tradeoff:
          "$30,000 spend. The scripted cycle acquires 600 paying subscribers: CAC is $50 and gross MRR adds $7,200, while the save defect remains.",
        demonstrated: ["business"],
        mistakes: ["acquisition_before_diagnosis"],
        feedback:
          "The acquisition cycle grows subscriptions, but leaves the confirmed defect unresolved. A more promising channel need not be cheaper: $30,000 / 600 = $50 CAC. More revenue and better activity retention are different outcomes.",
        next: "Prioritize the defect and decide what acquisition cost the business can sustain before scaling a replacement channel.",
        impact: {
          cost: 30000,
          mrrDelta: 7200,
          acquisition: { spend: 30000, newSubscribers: 600 },
        },
        consequence:
          "This choice advances one scripted acquisition cycle: cash −$30,000, 600 new $12 subscriptions add $7,200 gross MRR, and observed CAC becomes $50. No new cohort has matured to D30. These are fixed fictional outcomes, not forecasts; churn and other operating costs are outside this small model.",
      },
      {
        id: "offer",
        title: "Offer a larger discount while waiting for more evidence",
        description:
          "Give 400 current subscribers a new recurring discount of 20% of the $12 list price.",
        tradeoff:
          "$2,500 setup cost and another $960 less MRR. Creates an immediate concession but leaves a reproducible usability defect.",
        demonstrated: [],
        mistakes: ["solution_first_thinking", "proxy_metric_confusion"],
        feedback:
          "Waiting for a perfect causal estimate does not require ignoring a reproducible save failure. A billing concession does not repair the experience. The discount reduces revenue regardless of whether users return.",
        next: "Repair the verified defect, monitor safety, and collect retention evidence without assuming that price is the cause.",
        impact: { cost: 2500, mrrDelta: -960 },
        consequence:
          "Cash falls $2,500 and MRR falls $960: 400 × $12 × 20%. This is additional to any earlier concession; combined discounts are capped at 30% here. D30 and CAC are unchanged.",
      },
    ],
  },
];

export const channelRows = [
  {
    channel: "Organic",
    beforeN: 400,
    beforeActive: 140,
    afterN: 200,
    afterActive: 70,
  },
  {
    channel: "Partner referrals",
    beforeN: 200,
    beforeActive: 80,
    afterN: 200,
    afterActive: 80,
  },
  {
    channel: "Paid social",
    beforeN: 400,
    beforeActive: 60,
    afterN: 600,
    afterActive: 60,
  },
];
export const platformRows = [
  {
    channel: "Paid social · iOS",
    beforeN: 200,
    beforeActive: 30,
    afterN: 300,
    afterActive: 45,
  },
  {
    channel: "Paid social · Android",
    beforeN: 200,
    beforeActive: 30,
    afterN: 300,
    afterActive: 15,
  },
];

export type LessonKey = "understand" | "explore" | "pattern";
export type LessonQuestion = {
  key: LessonKey;
  title: string;
  introduction: string;
  question: string;
  skills: Skill[];
  options: {
    id: string;
    title: string;
    explanation: string;
    correct: boolean;
  }[];
};
export const lessonQuestions: LessonQuestion[] = [
  {
    key: "understand",
    title: "Understand the problem",
    introduction:
      "A retention decline tells you that fewer users returned. It does not explain why. Use Verify → Localize → Explain → Act to reduce uncertainty before committing to a solution.",
    question: "What can you conclude from 28% → 21% alone?",
    skills: ["discovery"],
    options: [
      {
        id: "symptom",
        title: "There is a signal to verify; the root cause is not yet known.",
        correct: true,
        explanation:
          "Exactly. Check the definition, event pipeline, sample size, and cohort maturity. The decline is 7 percentage points, or 25% relative; neither calculation identifies a cause.",
      },
      {
        id: "onboarding",
        title:
          "Onboarding must be the cause because it shapes first impressions.",
        correct: false,
        explanation:
          "Onboarding is a plausible hypothesis. It becomes more useful when connected to evidence that could disprove it. The aggregate number cannot distinguish it from acquisition mix, seasonality, or measurement issues.",
      },
      {
        id: "churn",
        title: "Subscription revenue must have fallen by 25%.",
        correct: false,
        explanation:
          "Activity retention and subscription renewal measure different things. Users can remain subscribed while becoming inactive. Check billing data before drawing a revenue conclusion.",
      },
    ],
  },
  {
    key: "explore",
    title: "Explore the data",
    introduction:
      "Start with checks that can change your next decision. First verify the signal, then compare like-for-like cohorts by dimensions connected to plausible explanations.",
    question: "Which first analysis gives you the most diagnostic value?",
    skills: ["analytics", "prioritization"],
    options: [
      {
        id: "verify_segment",
        title:
          "Validate events and mature cohorts, then compare channel × platform rates and counts.",
        correct: true,
        explanation:
          "This checks whether the decline is real and localizes it. Counts reveal small samples and mix shifts; rates reveal within-segment deterioration. Follow up with interviews from the affected segment.",
      },
      {
        id: "nps",
        title: "Run a satisfaction survey among everyone active today.",
        correct: false,
        explanation:
          "Useful for some questions, but active respondents exclude the very users who stopped returning. The survey does not verify the original cohorts or identify a segment-level change.",
      },
      {
        id: "revenue",
        title: "Compare overall MRR and the number of campaign opens.",
        correct: false,
        explanation:
          "These describe billing and message engagement. They do not explain day-30 app activity. Choose measurements that directly test the retention signal and your hypotheses.",
      },
    ],
  },
  {
    key: "pattern",
    title: "Find the pattern",
    introduction:
      "Here is a practice slice from Pulse’s paid-social cohorts. Both periods are fully matured. Read cohort sizes and rates together before assigning a cause.",
    question: "Which segment should you investigate next?",
    skills: ["analytics", "discovery"],
    options: [
      {
        id: "android",
        title: "Paid-social Android: its rate fell from 15% to 5%.",
        correct: true,
        explanation:
          "Android is the affected platform inside paid social. This localizes the problem, but does not establish why it changed. Compare onboarding versions and user intent; use interviews and a reproducible failure to test the explanation.",
      },
      {
        id: "ios",
        title: "Paid-social iOS, because it now has more active users.",
        correct: false,
        explanation:
          "iOS active users rose because its cohort grew. Its retention rate stayed at 15%. Android’s rate declined from 15% to 5%; that is the behavior requiring investigation.",
      },
      {
        id: "proof",
        title:
          "The Android rate proves that the latest release caused the decline.",
        correct: false,
        explanation:
          "A segment comparison narrows the search, but channel intent, device mix, and product changes can overlap. Correlation is not a causal estimate. Verify the proposed mechanism before attributing the decline.",
      },
    ],
  },
];

export const transferChoices = [
  {
    id: "compare",
    title:
      "Validate D7 events and compare mature, matched release cohorts before choosing an intervention.",
  },
  {
    id: "rollback",
    title:
      "Roll back the whole onboarding release because the aggregate decline proves it caused harm.",
  },
  {
    id: "survey",
    title:
      "Survey current active users and make the release decision from their satisfaction scores.",
  },
  {
    id: "campaign",
    title:
      "Run a reactivation campaign first and use its open rate to judge whether onboarding improved.",
  },
];
export const evidenceChoices = [
  {
    id: "matched",
    title:
      "Mature D7 cohorts matched by acquisition channel and platform, with event validation.",
  },
  {
    id: "aggregate",
    title: "Overall weekly active users before and after the release.",
  },
  {
    id: "opinions",
    title: "A few positive comments from people who completed onboarding.",
  },
];
export const gateChoices = [
  {
    id: "test",
    title:
      "If a within-segment drop aligns with a reproducible defect, test or stage a targeted repair with guardrails.",
  },
  {
    id: "assume",
    title:
      "Assume the timing establishes causation and promise an 8-point retention recovery.",
  },
  {
    id: "wait",
    title:
      "Wait for certainty without checking whether users face a reproducible blocking defect.",
  },
];
