export function assertCanActivate(input: {
  approved: boolean;
  dailyBudgetUsd: number;
  capUsd: number | null;
}): void {
  if (input.approved !== true) {
    throw new Error("Meta spend stays paused until you approve it.");
  }
  if (input.capUsd === null) {
    throw new Error("Set META_DAILY_BUDGET_CAP before any spend.");
  }
  if (!Number.isFinite(input.dailyBudgetUsd) || input.dailyBudgetUsd <= 0) {
    throw new Error("Daily budget must be a positive amount.");
  }
  if (input.dailyBudgetUsd > input.capUsd) {
    throw new Error(`Daily budget exceeds the cap of $${input.capUsd.toFixed(2)}.`);
  }
}

export function suggestedDailyBudgetUsd(contributionMarginUsd: number | null, capUsd: number | null): number | null {
  if (contributionMarginUsd === null || contributionMarginUsd <= 0) return null;
  const suggested = Math.max(5, Math.round(contributionMarginUsd * 10));
  if (capUsd === null) return suggested;
  return Math.min(suggested, capUsd);
}
