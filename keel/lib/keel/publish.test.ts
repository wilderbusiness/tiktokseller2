import assert from "node:assert/strict";
import test from "node:test";

import { modeledCatalog } from "./catalog";
import { metaPlan } from "./meta";
import { rankProducts } from "./rank";
import { shopifyPayload } from "./shopify";
import { facelessPost, publishFacelessPost } from "./tiktok";
import { MODELED_DISCLAIMER } from "./types";

test("Shopify payload for the modeled catalog keeps the disclaimer", () => {
  const ranked = rankProducts(modeledCatalog());
  const payload = shopifyPayload(ranked, "modeled");
  assert.equal(payload.disclaimer, MODELED_DISCLAIMER);
  assert.match(payload.page.body_html, /not live TikTok/);
  assert.equal(payload.products[0]?.status, "active");
});

test("Meta plan is paused and does not claim a live ROAS", () => {
  const [product] = rankProducts(modeledCatalog());
  assert.ok(product);
  const plan = metaPlan(product, "modeled");
  assert.equal(plan.status, "PAUSED");
  assert.match(plan.disclaimer, /not live/);
  assert.ok((plan.dailyBudgetUsd ?? 0) > 0);
});

test("faceless publish does not send without a video URL", async () => {
  const [product] = modeledCatalog();
  assert.ok(product);
  const post = facelessPost(product);
  assert.equal(post.camera, "no person on camera");
  const result = await publishFacelessPost(post, null, () => {
    throw new Error("network should not be called");
  });
  assert.equal(result.status, "not_sent");
  assert.equal(result.publishId, null);
});
