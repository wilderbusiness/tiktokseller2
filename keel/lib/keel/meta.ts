import { budgetCapUsd, requireEnv } from "./env";
import { assertCanActivate, suggestedDailyBudgetUsd } from "./meta-policy";
import type { CatalogKind, RankedProduct } from "./types";
import { MODELED_DISCLAIMER } from "./types";

export type MetaPlan = {
  name: string;
  status: "PAUSED";
  dailyBudgetUsd: number | null;
  breakEvenRoas: number | null;
  catalogKind: CatalogKind;
  disclaimer: string;
  note: string;
};

export function metaPlan(product: RankedProduct, catalogKind: CatalogKind): MetaPlan {
  const cap = budgetCapUsd();
  return {
    name: `Keel ${product.name}`,
    status: "PAUSED",
    dailyBudgetUsd: suggestedDailyBudgetUsd(product.unitEconomics.contributionMarginUsd.value, cap),
    breakEvenRoas: product.unitEconomics.breakEvenRoas.value,
    catalogKind,
    disclaimer:
      catalogKind === "modeled"
        ? MODELED_DISCLAIMER
        : "Break-even ROAS is calculated from cost and price. It is not a live Meta result.",
    note: "This campaign is paused. Approval and META_DAILY_BUDGET_CAP are required before any spend.",
  };
}

function adAccountPath(accountId: string): string {
  const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  return id;
}

async function graph(path: string, body: Record<string, unknown>, token: string, fetchImpl: typeof fetch): Promise<Record<string, unknown>> {
  const response = await fetchImpl(`https://graph.facebook.com/v21.0/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const record = payload !== null && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(`Meta returned HTTP ${response.status}. No campaign was marked active.`);
  }
  return record;
}

export async function draftMetaCampaign(
  product: RankedProduct,
  catalogKind: CatalogKind,
  confirmed: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<{ campaignId: string | null; status: "PAUSED"; plan: MetaPlan }> {
  if (confirmed !== true) {
    throw new Error("Confirm the paused Meta plan before creating it.");
  }
  const creds = requireEnv(["META_AD_ACCOUNT_ID", "META_ACCESS_TOKEN", "META_PAGE_ID"]);
  if (!creds.ok) {
    throw new Error("Meta is not connected. Set META_AD_ACCOUNT_ID, META_ACCESS_TOKEN, META_PAGE_ID, and META_DAILY_BUDGET_CAP.");
  }
  const plan = metaPlan(product, catalogKind);
  if (plan.dailyBudgetUsd === null) {
    throw new Error("No daily budget could be sized because contribution margin is missing or not positive.");
  }
  const created = await graph(
    `${adAccountPath(creds.values.META_AD_ACCOUNT_ID)}/campaigns`,
    {
      name: plan.name,
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      special_ad_categories: [],
    },
    creds.values.META_ACCESS_TOKEN,
    fetchImpl,
  );
  const campaignId = typeof created.id === "string" ? created.id : null;
  if (campaignId) {
    await graph(
      `${adAccountPath(creds.values.META_AD_ACCOUNT_ID)}/adsets`,
      {
        name: `${plan.name} ad set`,
        campaign_id: campaignId,
        daily_budget: Math.round(plan.dailyBudgetUsd * 100),
        billing_event: "IMPRESSIONS",
        optimization_goal: "OFFSITE_CONVERSIONS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        status: "PAUSED",
        targeting: { geo_locations: { countries: ["US"] } },
      },
      creds.values.META_ACCESS_TOKEN,
      fetchImpl,
    );
  }
  return { campaignId, status: "PAUSED", plan };
}

export async function activateMetaCampaign(
  campaignId: string,
  dailyBudgetUsd: number,
  approved: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<{ campaignId: string; status: "ACTIVE" }> {
  assertCanActivate({ approved, dailyBudgetUsd, capUsd: budgetCapUsd() });
  const creds = requireEnv(["META_ACCESS_TOKEN"]);
  if (!creds.ok) {
    throw new Error("Meta is not connected. Spend was not started.");
  }
  await graph(campaignId, { status: "ACTIVE" }, creds.values.META_ACCESS_TOKEN, fetchImpl);
  return { campaignId, status: "ACTIVE" };
}
