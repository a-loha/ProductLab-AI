import { useId, useState } from "react";
import type { ReactNode } from "react";
import { MetricLabel } from "./Help";
import { Icon, Pill, money, percent } from "./ui";
import {
  channelNames,
  periods,
  funnel,
  initiatives,
  limits,
  messages,
  researchCards,
  classifications,
  evidenceSources,
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
  subscriberLedger,
} from "./mission-content";
import type { Channel, EvidenceId, MessageId } from "./mission-content";
import {
  areaNames,
  cohortTotal,
  retentionRows,
  funnelTotal,
  economics,
  mixDecomposition,
  planTotals,
  missionMetrics,
  marketingForecast,
  completionIssues,
  missionReview,
  sourceLabel,
} from "./mission";
import type { Area, Mission, MissionDraft } from "./mission";
import { skillNames } from "./content";

export type EditDraft = (recipe: (draft: MissionDraft) => MissionDraft) => void;
type Props = {
  mission: Mission;
  edit: EditDraft;
  collect: (id: EvidenceId) => void;
  go: (area: Area) => void;
  submit: () => void;
  review: () => void;
};
export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: ReactNode;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId(),
    selection = options.find((option) => option.id === value)?.label;
  return (
    <div className="work-field">
      <div className="field-label" id={id}>
        {label}
      </div>
      <select
        aria-labelledby={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Choose a position…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {selection && selection.length > 70 && (
        <p className="selection-copy">{selection}</p>
      )}
    </div>
  );
}
function EvidenceButton({
  id,
  mission,
  collect,
}: {
  id: EvidenceId;
  mission: Mission;
  collect: Props["collect"];
}) {
  const added = mission.notebook.includes(id);
  return (
    <button
      type="button"
      className={`button secondary evidence-button ${added ? "collected" : ""}`}
      onClick={() => collect(id)}
      disabled={added}
    >
      {added ? (
        <>
          <Icon name="check" size={15} />
          In evidence notebook
        </>
      ) : (
        <>
          Add to evidence notebook <span aria-hidden="true">＋</span>
        </>
      )}
    </button>
  );
}
export function MissionMetrics({ mission }: { mission: Mission }) {
  const actual = missionMetrics(mission),
    plan = planTotals(mission.draft);
  return (
    <section
      className="metrics mission-metrics"
      aria-label="Pulse measured business metrics"
    >
      <article className="card metric">
        <div className="metric-label">
          <MetricLabel term="mrr" />
        </div>
        <strong>{money(actual.mrr)}</strong>
        <p>
          {actual.subscribers.toLocaleString("en-US")} paid subscriptions · 30
          Sep snapshot
        </p>
      </article>
      <article className="card metric">
        <div className="metric-label">
          <MetricLabel term="d30" />
        </div>
        <strong>{actual.retention}%</strong>
        <p className="negative">28% previously · both cohorts mature</p>
      </article>
      <article className="card metric">
        <div className="metric-label">
          <MetricLabel term="cac" />
        </div>
        <strong>{money(actual.cac)}</strong>
        <p>Attributed spend / 1,000 new paid</p>
      </article>
      <article className="card metric">
        <div className="metric-label">Cash available</div>
        <strong>{money(actual.cash)}</strong>
        <p>
          {mission.submission
            ? `${money(plan.cost)} paid for the committed plan`
            : `${money(plan.cost)} planned · not spent yet`}
        </p>
      </article>
    </section>
  );
}
export function BudgetSummary({ draft }: { draft: MissionDraft }) {
  const plan = planTotals(draft);
  return (
    <div
      className={`budget-summary ${plan.feasible ? "" : "over-budget"}`}
      aria-label="Plan resource use"
    >
      <div>
        <span>Decision-cycle budget</span>
        <strong>
          {money(plan.cost)} <small>/ {money(limits.budget)}</small>
        </strong>
        <p>
          Initiatives {money(plan.workCost)} + acquisition test{" "}
          {money(plan.marketing.spend)}
        </p>
      </div>
      <div>
        <span>Engineering capacity</span>
        <strong>
          {plan.engineeringDays} <small>/ {limits.engineeringDays} days</small>
        </strong>
        <p>
          {plan.feasible
            ? "Within the stated resource limits."
            : "Reduce scope or allocation before committing."}
        </p>
      </div>
    </div>
  );
}
function MissionBrief({ mission, go }: Props) {
  return (
    <>
      <section className="mission-brief-hero">
        <div className="hero-top">
          <span className="pulse-logo">
            <Icon name="leaf" size={25} />
          </span>
          <span>
            PULSE <small>VIRTUAL PRODUCT WORKSPACE</small>
          </span>
          <Pill>15–20 MIN MISSION</Pill>
        </div>
        <span className="eyebrow">YOUR MISSION</span>
        <h2>
          Investigate the signal.
          <br />
          Bring the team a decision.
        </h2>
        <p>
          D30 activity retention fell from 28% to 21%. The CEO wants a win-back
          campaign. You need to understand the evidence, protect user value, and
          commit to a focused plan—not just pick a feature.
        </p>
        <div className="button-row">
          <button className="button primary" onClick={() => go("analytics")}>
            Explore Analytics <Icon name="arrow" size={17} />
          </button>
          <button className="button secondary" onClick={() => go("inbox")}>
            Read Team Inbox
          </button>
        </div>
      </section>
      <div className="mission-objectives">
        <section className="card">
          <span className="eyebrow">A REAL PM DELIVERABLE</span>
          <h2>Your Decision Brief should explain…</h2>
          <ul className="objective-list">
            <li>
              Where behavior changed, and what is mix versus deterioration.
            </li>
            <li>
              Which user problems are observed and which explanations remain
              hypotheses.
            </li>
            <li>
              What to prioritize within{" "}
              <strong>$12,000 and eight engineering days</strong>.
            </li>
            <li>
              How to align the CEO, Engineering, Analyst, and Growth on evidence
              and next steps.
            </li>
            <li>
              What to measure early, what must wait, and what could trigger a
              rollback.
            </li>
          </ul>
        </section>
        <section className="card mission-status">
          <span className="eyebrow">YOUR CASE FILE</span>
          <h2>
            {mission.submission
              ? "Mission committed"
              : "Investigation in progress"}
          </h2>
          <dl>
            <div>
              <dt>Sources collected</dt>
              <dd>
                {mission.notebook.length} / {evidenceSources.length}
              </dd>
            </div>
            <div>
              <dt>Prioritized initiatives</dt>
              <dd>{mission.draft.initiatives.length}</dd>
            </div>
            <div>
              <dt>Brief citations</dt>
              <dd>{mission.draft.brief.evidence.length}</dd>
            </div>
            <div>
              <dt>CEO response</dt>
              <dd>
                {mission.draft.ceo.frame && mission.draft.ceo.commitment
                  ? "Drafted"
                  : "Open request"}
              </dd>
            </div>
          </dl>
          <p className="fine-print">
            Work in any order. Reading is free. No budget is spent until you
            submit the Decision Brief. Missing reasoning stays visible in your
            Mission Review.
          </p>
        </section>
      </div>
      <div className="section-heading activities-title">
        <h2>Your working areas</h2>
        <span className="muted">Choose the tool your investigation needs.</span>
      </div>
      <div className="work-area-grid">
        {[
          [
            "analytics",
            "Follow the denominators",
            "Compare channels, platforms, acquisition mix, and subscription economics.",
          ],
          [
            "research",
            "Hear what users experienced",
            "Contrast reported pain with untested explanations.",
          ],
          [
            "inbox",
            "Work with your team",
            "Read four perspectives and draft a structured response to the CEO.",
          ],
          [
            "backlog",
            "Make the trade-offs",
            "Prioritize a feasible portfolio, not a wish list.",
          ],
          [
            "decision",
            "Bring the evidence together",
            "Cite your sources, state a recommendation, and define a credible readout.",
          ],
        ].map(([area, title, description]) => (
          <button
            key={area}
            className="card area-card"
            onClick={() => go(area as Area)}
          >
            <span className="eyebrow">{areaNames[area as Area]}</span>
            <strong>{title}</strong>
            <p>{description}</p>
            <Icon name="arrow" size={17} />
          </button>
        ))}
      </div>
      <p className="snapshot-note">
        Fictional snapshot as of 20 Oct 2026. Billing: September. Latest
        paid-start cohort: 1–7 September, followed through 7 October. Historical
        spend is already reflected in opening cash.
      </p>
    </>
  );
}
function Analytics(props: Props) {
  const { mission, edit, collect } = props,
    locked = !!mission.submission,
    draft = mission.draft;
  const [tab, setTab] = useState<"retention" | "acquisition" | "economics">(
      "retention",
    ),
    [dimension, setDimension] = useState<"channel" | "platform" | "combined">(
      "channel",
    ),
    [period, setPeriod] = useState<"both" | "previous" | "latest">("both");
  const rows = retentionRows(dimension),
    mix = mixDecomposition(),
    econ = economics();
  const updateAnalysis = (key: keyof MissionDraft["analysis"], value: string) =>
    edit((current) => ({
      ...current,
      analysis: { ...current.analysis, [key]: value },
    }));
  return (
    <>
      <nav className="analytics-tabs" aria-label="Analytics views">
        {[
          ["retention", "Retention & cohorts"],
          ["acquisition", "Acquisition & funnel"],
          ["economics", "Subscription economics"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id as typeof tab)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "retention" && (
        <>
          <section className="card evidence-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ACTIVITY, NOT BILLING</span>
                <h2>Inspect the cohort, not just the average.</h2>
              </div>
              <MetricLabel term="cohort" />
            </div>
            <div className="filter-row">
              <label>
                Dimension
                <select
                  aria-label="Dimension"
                  value={dimension}
                  onChange={(event) =>
                    setDimension(event.target.value as typeof dimension)
                  }
                >
                  <option value="channel">Acquisition channel</option>
                  <option value="platform">Platform</option>
                  <option value="combined">Channel × platform</option>
                </select>
              </label>
              <label>
                Measurement window
                <select
                  aria-label="Measurement window"
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value as typeof period)
                  }
                >
                  <option value="both">Compare both mature cohorts</option>
                  <option value="previous">Previous cohort only</option>
                  <option value="latest">Latest cohort only</option>
                </select>
              </label>
            </div>
            <div className="cohort-periods">
              {(["previous", "latest"] as const)
                .filter((id) => period === "both" || period === id)
                .map((id) => (
                  <p key={id}>
                    <strong>{periods[id].label}</strong> · Paid starts{" "}
                    {periods[id].paid}
                    <br />
                    {periods[id].mature}
                  </p>
                ))}
            </div>
            <div
              className="table-scroll readable-table"
              tabIndex={0}
              role="region"
              aria-label="Retention comparison"
            >
              <table>
                <caption>
                  Denominator: original new-paid cohort. Numerator: active on
                  day 30. Same validated active-session event in both periods.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Segment</th>
                    {(["previous", "latest"] as const)
                      .filter((id) => period === "both" || period === id)
                      .map((id) => (
                        <th scope="col" key={id}>
                          {periods[id].label}
                          <br />
                          <span>
                            New paid · D30 active ·{" "}
                            <MetricLabel term="d30">Rate</MetricLabel>
                          </span>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      {(["previous", "latest"] as const)
                        .filter((id) => period === "both" || period === id)
                        .map((id) => (
                          <td key={id}>
                            {row[id].paid} · {row[id].active} ·{" "}
                            <strong>{percent(row[id].retention)}</strong>
                          </td>
                        ))}
                    </tr>
                  ))}
                  <tr className="total-row">
                    <th scope="row">All new paid in cohort</th>
                    {(["previous", "latest"] as const)
                      .filter((id) => period === "both" || period === id)
                      .map((id) => {
                        const total = cohortTotal(id);
                        return (
                          <td key={id}>
                            {total.paid.toLocaleString("en-US")} ·{" "}
                            {total.active} ·{" "}
                            <strong>{percent(total.retention)}</strong>
                          </td>
                        );
                      })}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="work-copy">
              A platform average also changes when channel mix changes. Compare
              the joint table before attributing the decline to Android alone.
            </p>
            {dimension === "platform" ? (
              <button
                className="button secondary"
                onClick={() => setDimension("combined")}
              >
                Inspect channel × platform
              </button>
            ) : (
              <EvidenceButton
                id={dimension === "channel" ? "channels" : "platforms"}
                mission={mission}
                collect={collect}
              />
            )}
          </section>
          <section className="card evidence-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A WEIGHTED-AVERAGE CHECK</span>
                <h2>How much changed because of mix?</h2>
              </div>
              <MetricLabel term="mix" />
            </div>
            <div
              className="table-scroll readable-table"
              tabIndex={0}
              role="region"
              aria-label="Acquisition mix comparison"
            >
              <table>
                <caption>
                  Channel weight = channel’s new paid / all new paid in that
                  cohort.
                </caption>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Previous weight</th>
                    <th>Latest weight</th>
                    <th>Previous D30</th>
                    <th>Latest D30</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionRows("channel").map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td>
                        {percent(
                          row.previous.paid / cohortTotal("previous").paid,
                        )}
                      </td>
                      <td>
                        {percent(row.latest.paid / cohortTotal("latest").paid)}
                      </td>
                      <td>{percent(row.previous.retention)}</td>
                      <td>{percent(row.latest.retention)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="counterfactual">
              <span>Latest mix × previous channel rates</span>
              <strong>{percent(mix.counterfactual)}</strong>
              <p>
                Reference method: hold previous rates fixed and change only the
                weights. The original 28% becomes 24%; the latest observed rate
                is 21%.
              </p>
            </div>
            <p className="fine-print">
              This decomposition uses a stated reference, not causal
              attribution. A different reference can allocate interaction
              effects differently. Both parts must sum to the observed 7
              percentage points.
            </p>
            <EvidenceButton id="mix" mission={mission} collect={collect} />
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">YOUR INVESTIGATION NOTES</span>
            <h2>State the pattern you would investigate.</h2>
            <div className="form-grid">
              <SelectField
                label="Affected joint segment"
                value={draft.analysis.segment}
                options={[
                  { id: "paid_android", label: "Paid social · Android" },
                  { id: "organic", label: "Organic users across platforms" },
                  { id: "ios", label: "All iOS users, independent of channel" },
                  {
                    id: "everyone",
                    label: "Every segment deteriorated equally",
                  },
                ]}
                onChange={(value) => updateAnalysis("segment", value)}
                disabled={locked}
              />
              <label className="work-field">
                <span>Mix contribution (percentage points)</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  step="0.1"
                  value={draft.analysis.mix}
                  onChange={(event) =>
                    updateAnalysis("mix", event.target.value)
                  }
                  disabled={locked}
                />
              </label>
              <label className="work-field">
                <span>Within-segment contribution (percentage points)</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  step="0.1"
                  value={draft.analysis.within}
                  onChange={(event) =>
                    updateAnalysis("within", event.target.value)
                  }
                  disabled={locked}
                />
              </label>
            </div>
            <p className="fine-print">
              Notes save automatically. They will be reviewed with the sources
              you cite, not graded as a standalone quiz.
            </p>
          </section>
        </>
      )}
      {tab === "acquisition" && (
        <>
          <section className="card evidence-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FOLLOW THE WHOLE FUNNEL</span>
                <h2>Trials, paid conversion, and acquisition spend.</h2>
              </div>
              <MetricLabel term="conversion" />
            </div>
            <p className="work-copy">
              Seven-day trials started {periods.previous.trials} and{" "}
              {periods.latest.trials}; conversions completed by their
              corresponding paid-start windows. Retention then follows those
              paid subscribers for 30 days. Spend is attributed to these
              trial-start cohorts.
            </p>
            <div
              className="table-scroll readable-table"
              tabIndex={0}
              role="region"
              aria-label="Acquisition funnel"
            >
              <table>
                <caption>
                  Counts reconcile to 1,000 new paid in each retention cohort.
                  CAC uses new paid, not trials.
                </caption>
                <thead>
                  <tr>
                    <th>Period / channel</th>
                    <th>Trial starts</th>
                    <th>New paid</th>
                    <th>
                      <MetricLabel term="conversion">Conversion</MetricLabel>
                    </th>
                    <th>Spend</th>
                    <th>
                      <MetricLabel term="cac" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(["previous", "latest"] as const).flatMap((id) => [
                    ...funnel
                      .filter((row) => row.period === id)
                      .map((row) => (
                        <tr key={`${id}-${row.channel}`}>
                          <th scope="row">
                            {periods[id].label} · {channelNames[row.channel]}
                          </th>
                          <td>{row.trials.toLocaleString("en-US")}</td>
                          <td>{row.paid}</td>
                          <td>{percent(row.paid / row.trials)}</td>
                          <td>{money(row.spend)}</td>
                          <td>{money(row.spend / row.paid)}</td>
                        </tr>
                      )),
                    <tr key={`${id}-total`} className="total-row">
                      <th scope="row">{periods[id].label} · total</th>
                      <td>{funnelTotal(id).trials.toLocaleString("en-US")}</td>
                      <td>{funnelTotal(id).paid.toLocaleString("en-US")}</td>
                      <td>{percent(funnelTotal(id).conversion)}</td>
                      <td>{money(funnelTotal(id).spend)}</td>
                      <td>{money(funnelTotal(id).cac)}</td>
                    </tr>,
                  ])}
                </tbody>
              </table>
            </div>
            <EvidenceButton id="funnel" mission={mission} collect={collect} />
          </section>
          <MarketingPlan {...props} />
        </>
      )}
      {tab === "economics" && (
        <>
          <section className="card evidence-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  BILLING PERIOD · {subscriberLedger.period}
                </span>
                <h2>Activity can fall while subscriptions grow.</h2>
              </div>
              <MetricLabel term="subscribers" />
            </div>
            <div
              className="table-scroll readable-table"
              tabIndex={0}
              role="region"
              aria-label="Subscription ledger"
            >
              <table>
                <caption>
                  Fictional flat-plan ledger. Cancellations are from the opening
                  paid stock. No expansion, discounts, or other new subscribers
                  in this billing month.
                </caption>
                <thead>
                  <tr>
                    <th>Movement</th>
                    <th>Paid subscriptions</th>
                    <th>Monthly recurring revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Opening stock</th>
                    <td>{econ.opening.toLocaleString("en-US")}</td>
                    <td>{money(econ.opening * 12)}</td>
                  </tr>
                  <tr>
                    <th scope="row">New paid in the month</th>
                    <td>+1,000</td>
                    <td>+{money(1000 * 12)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Cancelled from opening stock</th>
                    <td>−200</td>
                    <td>−{money(200 * 12)}</td>
                  </tr>
                  <tr className="total-row">
                    <th scope="row">Closing stock · 30 September</th>
                    <td>{econ.closing.toLocaleString("en-US")}</td>
                    <td>{money(econ.mrr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="economic-facts">
              {[
                ["arpa", money(econ.arpa)],
                ["churn", percent(econ.churn)],
                ["subscriptionRetention", percent(econ.subscriptionRetention)],
                ["ltv", `$${econ.ltv.toFixed(2)}`],
                ["ratio", `${econ.ratio.toFixed(2)}×`],
              ].map(([term, value]) => (
                <div key={term}>
                  <MetricLabel
                    term={
                      term as
                        | "arpa"
                        | "churn"
                        | "subscriptionRetention"
                        | "ltv"
                        | "ratio"
                    }
                  />
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p className="fine-print">
              LTV and LTV/CAC are simplified estimates using constant monthly
              churn, $12 ARPA, and 80% gross margin. They are not measured
              lifetime outcomes or proof that scaling is profitable.
            </p>
            <EvidenceButton id="revenue" mission={mission} collect={collect} />
            <SelectField
              label="Your billing vs. activity interpretation"
              value={draft.analysis.finance}
              options={[
                {
                  id: "mrr_up",
                  label:
                    "MRR grew while activity retention fell; they measure different things.",
                },
                {
                  id: "mrr_down",
                  label:
                    "MRR must have fallen by the same 25% relative decline.",
                },
                {
                  id: "same_measure",
                  label:
                    "Subscription retention and D30 activity retention are interchangeable.",
                },
              ]}
              onChange={(value) => updateAnalysis("finance", value)}
              disabled={locked}
            />
          </section>
        </>
      )}
    </>
  );
}
function MarketingPlan({ mission, edit }: Props) {
  const d = mission.draft,
    forecast = marketingForecast(d.marketing),
    locked = !!mission.submission;
  return (
    <section className="card evidence-panel">
      <span className="eyebrow">A SMALL ACQUISITION DECISION</span>
      <h2>Allocate a learning budget—or deliberately hold.</h2>
      <p className="work-copy">
        Up to four $1,500 blocks, counted inside the same $12,000 mission
        budget. Organic and partner channels historically converted better; paid
        social offers volume but lower conversion and a possible expectation
        mismatch. Rebalancing acquisition does not repair the Android defect.
      </p>
      <div className="allocation-grid">
        {(Object.keys(channelNames) as Channel[]).map((channel) => (
          <label className="allocation-card" key={channel}>
            <strong>{channelNames[channel]}</strong>
            <span>Acquisition-test blocks</span>
            <select
              aria-label={`${channelNames[channel]} test allocation`}
              value={d.marketing[channel]}
              onChange={(event) =>
                edit((current) => ({
                  ...current,
                  marketing: {
                    ...current.marketing,
                    [channel]: Number(event.target.value),
                  },
                }))
              }
              disabled={locked}
            >
              {[0, 1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} · {money(value * 1500)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="projection-box">
        <Pill tone="amber">Planning projection · not observed</Pill>
        <p>
          <strong>{money(forecast.spend)}</strong> allocated → {forecast.trials}{" "}
          trial starts → {forecast.paid} new paid → estimated CAC{" "}
          <strong>{forecast.cac === null ? "—" : money(forecast.cac)}</strong>.
        </p>
        <p>
          Assumes latest observed channel cost per trial and conversion hold for
          this small test. Organic: $12 per trial / 40% conversion; partners:
          $15 / 50%; social: $10 / 20%. Real scale, quality, and conversion may
          differ. No subscription or retention outcome is booked.
        </p>
      </div>
      <SelectField
        label="Acquisition decision rationale"
        value={d.marketingReason}
        options={marketingReasons}
        onChange={(marketingReason) =>
          edit((current) => ({ ...current, marketingReason }))
        }
        disabled={locked}
      />
      <BudgetSummary draft={d} />
    </section>
  );
}
function Research({ mission, edit, collect }: Props) {
  return (
    <>
      <section className="card evidence-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              TARGETED RESEARCH · 12 INACTIVE USERS
            </span>
            <h2>What did users actually experience?</h2>
          </div>
          <MetricLabel term="discovery" />
        </div>
        <p className="work-copy">
          Research recruited inactive paid-social Android users to explore
          mechanisms. It is not representative of all Pulse subscribers.
          Distinguish a reported experience from an explanation for the overall
          retention decline.
        </p>
        {researchCards.map((card) => (
          <article key={card.id} className="research-card">
            <span className="eyebrow">{card.source}</span>
            <h3>{card.title}</h3>
            <blockquote>{card.quote}</blockquote>
            <p>{card.context}</p>
            <SelectField
              label={`Classify: ${card.title}`}
              options={classifications}
              value={mission.draft.research[card.id]}
              onChange={(value) =>
                edit((d) => ({
                  ...d,
                  research: { ...d.research, [card.id]: value },
                }))
              }
              disabled={!!mission.submission}
            />
          </article>
        ))}
        <EvidenceButton id="interviews" mission={mission} collect={collect} />
      </section>
      <section className="card evidence-panel">
        <span className="eyebrow">SELECTED SESSION NOTES</span>
        <h2>A possible mechanism worth testing.</h2>
        <p className="work-copy">
          Six of ten deliberately selected Android failure recordings show a
          fast exit from the routine picker, followed by an empty home screen.
          Engineering later reproduced a cancelled save request. These
          recordings support a mechanism; the selected sample cannot estimate
          its prevalence or causal effect on D30.
        </p>
        <p className="work-copy">
          Next discovery move: contrast retained and inactive users, and compare
          onboarding versions and acquisition intent. Ask what evidence would
          disprove the save-defect explanation.
        </p>
        <EvidenceButton id="sessions" mission={mission} collect={collect} />
      </section>
    </>
  );
}
function Inbox({ mission, edit, collect }: Props) {
  const [selected, setSelected] = useState<MessageId>("ceo"),
    message = messages.find((message) => message.id === selected)!,
    d = mission.draft;
  return (
    <div className="inbox-grid">
      <nav className="card message-list" aria-label="Team messages">
        {messages.map((message) => (
          <button
            key={message.id}
            aria-current={selected === message.id ? "page" : undefined}
            onClick={() => setSelected(message.id)}
          >
            <span className="message-avatar">
              {message.sender
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <span>
              <strong>{message.role}</strong>
              <small>{message.subject}</small>
            </span>
            {mission.notebook.includes(message.id) && (
              <span className="message-read" aria-label="Collected">
                ✓
              </span>
            )}
          </button>
        ))}
      </nav>
      <div>
        <section className="card evidence-panel message-body">
          <div className="section-heading">
            <span className="eyebrow">
              {message.sender} · {message.role}
            </span>
            <Pill>Mission context</Pill>
          </div>
          <h2>{message.subject}</h2>
          <p className="work-copy">{message.body}</p>
          <div className="message-question">{message.question}</div>
          <EvidenceButton id={message.id} mission={mission} collect={collect} />
        </section>
        {selected === "ceo" && (
          <section className="card evidence-panel">
            <span className="eyebrow">DRAFT A STRUCTURED REPLY</span>
            <h2>Give the CEO an accountable next step.</h2>
            <p className="work-copy">
              Your selections form a reply draft. The Mission Review will assess
              the facts, uncertainty, and commitment—not arbitrary prose.
            </p>
            <SelectField
              label="How will you frame the situation?"
              value={d.ceo.frame}
              options={ceoFrameOptions}
              onChange={(frame) =>
                edit((current) => ({
                  ...current,
                  ceo: { ...current.ceo, frame },
                }))
              }
              disabled={!!mission.submission}
            />
            <SelectField
              label="What will you ask for and commit to?"
              value={d.ceo.commitment}
              options={ceoCommitOptions}
              onChange={(commitment) =>
                edit((current) => ({
                  ...current,
                  ceo: { ...current.ceo, commitment },
                }))
              }
              disabled={!!mission.submission}
            />
            {d.ceo.frame && d.ceo.commitment && (
              <div className="reply-preview">
                <span className="eyebrow">YOUR REPLY DRAFT</span>
                <p>
                  {
                    ceoFrameOptions.find((option) => option.id === d.ceo.frame)
                      ?.label
                  }
                </p>
                <p>
                  {
                    ceoCommitOptions.find(
                      (option) => option.id === d.ceo.commitment,
                    )?.label
                  }
                </p>
                <p>
                  Current proposed scope: {money(planTotals(d).cost)},{" "}
                  {planTotals(d).engineeringDays} engineering days. Supporting
                  citations will be attached in the Decision Brief.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
function Backlog({ mission, edit, go }: Props) {
  const d = mission.draft,
    locked = !!mission.submission;
  const toggle = (id: MissionDraft["initiatives"][number]) =>
    edit((current) => ({
      ...current,
      initiatives: current.initiatives.includes(id)
        ? current.initiatives.filter((item) => item !== id)
        : [...current.initiatives, id],
    }));
  const move = (index: number, offset: number) =>
    edit((current) => {
      const ids = [...current.initiatives];
      [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
      return { ...current, initiatives: ids };
    });
  return (
    <>
      <section className="card evidence-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PRIORITIZATION & DELIVERY</span>
            <h2>Build an executable portfolio.</h2>
          </div>
          <MetricLabel term="prioritization" />
        </div>
        <p className="work-copy">
          Select work, then set its order. The first item becomes your primary
          recommendation. Eight engineering days and $12,000 are available;
          research and marketing costs count toward the same budget. Exploring
          tools costs nothing.
        </p>
        <BudgetSummary draft={d} />
        <div className="backlog-catalog">
          {initiatives.map((item) => (
            <label
              className={`backlog-item ${d.initiatives.includes(item.id) ? "selected" : ""}`}
              key={item.id}
            >
              <input
                type="checkbox"
                checked={d.initiatives.includes(item.id)}
                onChange={() => toggle(item.id)}
                disabled={locked}
              />
              <span>
                <span className="backlog-title">
                  <strong>{item.name}</strong>
                  <Pill>
                    {money(item.cost)} · {item.days} eng days
                  </Pill>
                </span>
                <small>{item.kind}</small>
                <p>{item.description}</p>
                <p className="fine-print">{item.tradeoff}</p>
              </span>
            </label>
          ))}
        </div>
      </section>
      <section className="card evidence-panel">
        <span className="eyebrow">YOUR PRIORITY ORDER</span>
        <h2>What comes first—and what waits?</h2>
        {d.initiatives.length ? (
          <ol className="priority-list">
            {d.initiatives.map((id, index) => (
              <li key={id}>
                <span className="priority-number">P{index + 1}</span>
                <strong>
                  {initiatives.find((item) => item.id === id)!.name}
                </strong>
                <div>
                  <button
                    className="icon-button"
                    disabled={locked || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${initiatives.find((item) => item.id === id)!.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    className="icon-button"
                    disabled={locked || index === d.initiatives.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${initiatives.find((item) => item.id === id)!.name} down`}
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="work-copy">
            Select initiatives above to assemble your plan.
          </p>
        )}
        <p className="fine-print">
          Costs are paid upfront only after the Decision Brief is submitted. A
          repair is an intervention; a retention lift requires a later mature
          observation.
        </p>
        <button className="button secondary" onClick={() => go("analytics")}>
          Review acquisition allocation
        </button>
      </section>
    </>
  );
}
function DecisionBrief(props: Props) {
  const { mission, edit, go, submit, review } = props,
    d = mission.draft,
    b = d.brief,
    locked = !!mission.submission,
    issues = completionIssues(d, mission.notebook),
    rubric = missionReview({ draft: d, evidence: mission.notebook });
  const field = (key: keyof MissionDraft["brief"], value: string) =>
    edit((current) => ({
      ...current,
      brief: { ...current.brief, [key]: value },
    }));
  const toggleCitation = (id: EvidenceId) =>
    edit((current) => ({
      ...current,
      brief: {
        ...current.brief,
        evidence: current.brief.evidence.includes(id)
          ? current.brief.evidence.filter((item) => item !== id)
          : [...current.brief.evidence, id],
      },
    }));
  const toggleHypothesis = (id: string) =>
    edit((current) => ({
      ...current,
      brief: {
        ...current.brief,
        hypotheses: current.brief.hypotheses.includes(id)
          ? current.brief.hypotheses.filter((item) => item !== id)
          : [...current.brief.hypotheses, id].slice(0, 2),
      },
    }));
  return (
    <>
      <section className="card evidence-panel brief-intro">
        <span className="eyebrow">YOUR PRODUCT DELIVERABLE</span>
        <h2>A decision the team can act on.</h2>
        <p className="work-copy">
          Assemble a coherent recommendation from the evidence you collected.
          All structured choices are reviewed against the visible rubric.
          Free-text reflection is saved, never automatically graded.
        </p>
        <BudgetSummary draft={d} />
        {locked && (
          <div className="submitted-banner">
            <strong>This brief is committed.</strong>
            <p>
              Its evidence and rubric results are frozen. Further exploration
              does not retroactively change the review or charge the plan again.
            </p>
            <button className="button primary" onClick={review}>
              Open Mission Review <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
      </section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset className="brief-fields">
          <section className="card evidence-panel">
            <span className="eyebrow">01 · PROBLEM DEFINITION</span>
            <SelectField
              disabled={locked}
              label="What problem are you solving?"
              options={problemOptions}
              value={b.problem}
              onChange={(value) => field("problem", value)}
            />
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">02 · SUPPORTING EVIDENCE</span>
            <h2>Cite sources from your notebook.</h2>
            <p className="work-copy">
              At least two sources. A source can only be cited after you add it
              while investigating.
            </p>
            <div className="citation-grid">
              {mission.notebook.map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={b.evidence.includes(id)}
                    onChange={() => toggleCitation(id)}
                  />
                  <span>{sourceLabel(id)}</span>
                </label>
              ))}
            </div>
            {!mission.notebook.length && (
              <p className="empty-notebook">
                Your notebook is empty. Open Analytics, User Research, or Team
                Inbox and collect a relevant source.
              </p>
            )}
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">03 · KEY HYPOTHESES</span>
            <h2>Keep one or two explanations in play.</h2>
            <div className="hypothesis-list">
              {hypothesisOptions.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={b.hypotheses.includes(option.id)}
                    disabled={
                      locked ||
                      (b.hypotheses.length >= 2 &&
                        !b.hypotheses.includes(option.id))
                    }
                    onChange={() => toggleHypothesis(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <SelectField
              disabled={locked}
              label="How certain are these explanations?"
              value={b.confidence}
              options={[
                {
                  id: "unquantified",
                  label:
                    "There is evidence for mechanisms; their causal retention effects remain unquantified.",
                },
                {
                  id: "proven",
                  label:
                    "The entire seven-point effect has been proven, so further comparison is unnecessary.",
                },
              ]}
              onChange={(value) => field("confidence", value)}
            />
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">04 · RECOMMENDED ACTION & TRADE-OFF</span>
            <h2>
              {d.initiatives.length
                ? initiatives.find((item) => item.id === d.initiatives[0])!.name
                : "Choose your primary initiative in Product Backlog."}
            </h2>
            <p className="work-copy">
              The first item in your ranked backlog is the recommendation; the
              remaining items form its supporting scope.
            </p>
            <SelectField
              disabled={locked}
              label="What are you deliberately trading off?"
              options={tradeoffOptions}
              value={b.tradeoff}
              onChange={(value) => field("tradeoff", value)}
            />
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">05 · SUCCESS & SAFETY</span>
            <SelectField
              disabled={locked}
              label={
                <>
                  Success metric <MetricLabel term="d30">D30</MetricLabel>
                </>
              }
              options={successOptions}
              value={b.success}
              onChange={(value) => field("success", value)}
            />
            <SelectField
              disabled={locked}
              label={
                <>
                  Guardrail{" "}
                  <MetricLabel term="guardrail">definition</MetricLabel>
                </>
              }
              options={guardrailOptions}
              value={b.guardrail}
              onChange={(value) => field("guardrail", value)}
            />
          </section>
          <section className="card evidence-panel">
            <span className="eyebrow">06 · ALIGNMENT & DELIVERY</span>
            <SelectField
              disabled={locked}
              label="Ownership"
              options={ownerOptions}
              value={b.owner}
              onChange={(value) => field("owner", value)}
            />
            <SelectField
              disabled={locked}
              label="Checkpoint and readout"
              options={checkpointOptions}
              value={b.checkpoint}
              onChange={(value) => field("checkpoint", value)}
            />
            <p className="work-copy">
              CEO response:{" "}
              {d.ceo.frame && d.ceo.commitment
                ? "drafted in Team Inbox."
                : "not yet drafted; the communication gap will remain visible in the review."}
            </p>
            <label className="work-field">
              <span>Optional reflection · not automatically evaluated</span>
              <textarea
                disabled={locked}
                rows={3}
                maxLength={800}
                value={b.reflection}
                onChange={(event) => field("reflection", event.target.value)}
                placeholder="What assumption might change your recommendation?"
              />
            </label>
          </section>
        </fieldset>
        <section className="card evidence-panel commit-panel">
          <details>
            <summary>View the explicit Mission Review rubric</summary>
            <div className="rubric-preview">
              {rubric.criteria.map((criterion) => (
                <div key={criterion.skill}>
                  <h3>{skillNames[criterion.skill]}</h3>
                  <ul>
                    {criterion.checks.map((check) => (
                      <li key={check.label}>{check.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
          {!locked && (
            <>
              <p className="work-copy">
                Submitting commits {money(planTotals(d).cost)} of cash to the
                plan. No retention lift, paid conversion, or MRR lift will be
                invented.
              </p>
              {issues.length > 0 && (
                <div className="completion-issues">
                  <strong>Before you commit</strong>
                  <ul>
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className="button primary"
                type="submit"
                disabled={issues.length > 0}
              >
                Submit Decision Brief <Icon name="arrow" size={17} />
              </button>
            </>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => downloadBrief(mission)}
          >
            Download {locked ? "committed brief" : "draft"} (.md)
          </button>
        </section>
      </form>
      <div className="brief-navigation">
        <button className="text-button" onClick={() => go("analytics")}>
          Return to evidence
        </button>
        <button className="text-button" onClick={() => go("inbox")}>
          Draft CEO response
        </button>
        <button className="text-button" onClick={() => go("backlog")}>
          Adjust priorities
        </button>
      </div>
    </>
  );
}
export function briefText(mission: Mission) {
  const d = mission.submission?.draft ?? mission.draft,
    b = d.brief,
    lookup = (options: readonly { id: string; label: string }[], id: string) =>
      options.find((option) => option.id === id)?.label ?? "Not provided";
  return `# Pulse — Retention Crisis Decision Brief\n\nStatus: ${mission.submission ? "Committed" : "Draft — no cash spent"}\n\n## Problem\n${lookup(problemOptions, b.problem)}\n\n## Evidence\n${b.evidence.map((id) => "- " + sourceLabel(id)).join("\n") || "No citations"}\n\n## Hypotheses\n${b.hypotheses.map((id) => "- " + lookup(hypothesisOptions, id)).join("\n")}\nConfidence: ${b.confidence === "unquantified" ? "Mechanisms supported; causal effect unquantified." : b.confidence === "proven" ? "Full effect claimed as proven." : "Not provided"}\n\n## Priority order\n${d.initiatives.map((id, index) => `${index + 1}. ${initiatives.find((item) => item.id === id)!.name}`).join("\n")}\n\n## Trade-off\n${lookup(tradeoffOptions, b.tradeoff)}\n\n## Measures\n${lookup(successOptions, b.success)}\n${lookup(guardrailOptions, b.guardrail)}\n\n## Accountability\n${lookup(ownerOptions, b.owner)}\n${lookup(checkpointOptions, b.checkpoint)}\n\n## CEO response\n${lookup(ceoFrameOptions, d.ceo.frame)}\n${lookup(ceoCommitOptions, d.ceo.commitment)}\n\n## Budget\n${money(planTotals(d).cost)}; ${planTotals(d).engineeringDays}/8 engineering days. Acquisition allocation: ${money(planTotals(d).marketing.spend)}.\nNo new MRR, CAC, or D30 outcome is assumed. Historical cohorts are fully matured; future D30 is not yet observed.\n\n## Reflection (not graded)\n${b.reflection || "None"}\n`;
}
function downloadBrief(mission: Mission) {
  const url = URL.createObjectURL(
      new Blob([briefText(mission)], { type: "text/markdown;charset=utf-8" }),
    ),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pulse-decision-brief.md";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Workspace(props: Props & { area: Area }) {
  const { area, go, mission } = props;
  return (
    <>
      <nav className="workspace-tabs" aria-label="Mission working areas">
        {(Object.keys(areaNames) as Area[]).map((id) => (
          <button
            key={id}
            aria-current={area === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            {areaNames[id]}
          </button>
        ))}
      </nav>
      {mission.submission && area !== "decision" && (
        <div className="workspace-lock-note">
          Committed mission · tools remain open for reflection. The submitted
          plan and evidence snapshot are preserved.
        </div>
      )}
      {area === "brief" && <MissionBrief {...props} />}
      {area === "analytics" && <Analytics {...props} />}
      {area === "research" && <Research {...props} />}
      {area === "inbox" && <Inbox {...props} />}
      {area === "backlog" && <Backlog {...props} />}
      {area === "decision" && <DecisionBrief {...props} />}
    </>
  );
}
