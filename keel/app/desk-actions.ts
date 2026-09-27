"use server";

import { budgetCapUsd } from "@/lib/keel/env";
import { draftMetaCampaign, activateMetaCampaign, metaPlan } from "@/lib/keel/meta";
import { assertCanActivate } from "@/lib/keel/meta-policy";
import { loadCatalog, rankCatalog, selectRanked } from "@/lib/keel/pipeline";
import { shopifyPayload, publishShopifyCatalog } from "@/lib/keel/shopify";
import { applyManualSuppliers, searchAlibaba, type ManualSupplier } from "@/lib/keel/suppliers";
import { facelessPost, fetchCreatorVideos, publishFacelessPost } from "@/lib/keel/tiktok";
import type { CatalogKind, CatalogProduct, RankedProduct } from "@/lib/keel/types";

function failure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "The step failed." };
}

export async function showCatalog(kind: CatalogKind, manual: ManualSupplier[] = []) {
  try {
    const catalog = await loadCatalog(kind, manual);
    return { ok: true as const, ...catalog };
  } catch (error) {
    return failure(error);
  }
}

export async function showCreatorVideos() {
  try {
    const videos = await fetchCreatorVideos();
    return { ok: true as const, source: "live" as const, videos };
  } catch (error) {
    return failure(error);
  }
}

export async function lookupAlibaba(keyword: string) {
  try {
    const result = await searchAlibaba(keyword);
    return { ok: true as const, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function rankLoaded(products: CatalogProduct[]) {
  return rankCatalog(applyManualSuppliers(products, []));
}

export async function previewShopify(products: RankedProduct[], ids: string[], kind: CatalogKind) {
  const selected = selectRanked(products, ids);
  if (selected.length === 0) return failure(new Error("Choose at least one ranked product."));
  return { ok: true as const, payload: shopifyPayload(selected, kind) };
}

export async function confirmShopify(products: RankedProduct[], ids: string[], kind: CatalogKind) {
  try {
    const selected = selectRanked(products, ids);
    const result = await publishShopifyCatalog(selected, kind, true);
    return { ok: true as const, result };
  } catch (error) {
    return failure(error);
  }
}

export async function previewPosts(products: RankedProduct[], ids: string[]) {
  const selected = selectRanked(products, ids);
  if (selected.length === 0) return failure(new Error("Choose at least one ranked product."));
  return { ok: true as const, posts: selected.map((product) => facelessPost(product)) };
}

export async function confirmTikTok(products: RankedProduct[], ids: string[], videoUrl: string) {
  try {
    const selected = selectRanked(products, ids);
    const posts = selected.map((product) => facelessPost(product));
    const results = [];
    for (const post of posts) {
      results.push({ post, result: await publishFacelessPost(post, videoUrl.trim() || null) });
    }
    return { ok: true as const, results };
  } catch (error) {
    return failure(error);
  }
}

export async function previewMeta(products: RankedProduct[], productId: string, kind: CatalogKind) {
  const [product] = selectRanked(products, [productId]);
  if (!product) return failure(new Error("Choose a ranked product for the Meta plan."));
  return { ok: true as const, plan: metaPlan(product, kind) };
}

export async function confirmMetaDraft(products: RankedProduct[], productId: string, kind: CatalogKind) {
  try {
    const [product] = selectRanked(products, [productId]);
    if (!product) throw new Error("Choose a ranked product for the Meta plan.");
    const draft = await draftMetaCampaign(product, kind, true);
    return { ok: true as const, draft };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmMetaActivation(campaignId: string, dailyBudgetUsd: number, approved: boolean) {
  try {
    assertCanActivate({ approved, dailyBudgetUsd, capUsd: budgetCapUsd() });
    if (!campaignId.trim()) {
      throw new Error("Create a paused campaign before activating spend.");
    }
    const result = await activateMetaCampaign(campaignId.trim(), dailyBudgetUsd, approved);
    return { ok: true as const, result };
  } catch (error) {
    return failure(error);
  }
}
