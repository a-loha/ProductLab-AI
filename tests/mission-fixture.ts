import { newMission } from "../src/mission";
import { evidenceSources } from "../src/mission-content";
export function completeMission() {
  const mission = newMission();
  mission.notebook = evidenceSources.map((source) => source.id);
  mission.draft = {
    analysis: {
      segment: "paid_android",
      mix: "4",
      within: "3",
      finance: "mrr_up",
    },
    research: { routine: "observed", price: "hypothesis", intent: "observed" },
    initiatives: ["repair", "monitor", "interviews"],
    marketing: { organic: 1, referral: 1, social: 0 },
    marketingReason: "quality",
    ceo: { frame: "separate", commitment: "checkpoint" },
    brief: {
      problem: "value_gap",
      evidence: [...mission.notebook],
      hypotheses: ["save", "intent"],
      confidence: "unquantified",
      tradeoff: "bounded",
      success: "save_then_d30",
      guardrail: "crash_checkout",
      owner: "shared",
      checkpoint: "staged",
      reflection:
        "Test the mechanism without assuming that the aggregate change is entirely causal.",
    },
  };
  return mission;
}
