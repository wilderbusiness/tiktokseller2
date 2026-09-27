import assert from "node:assert/strict";
import test from "node:test";

import { modeledCatalog } from "./catalog";
import { assertCanActivate } from "./meta-policy";
import { rankProducts } from "./rank";
import { MODELED_DISCLAIMER } from "./types";

test("modeled catalog ranks with labeled figures", () => {
  const ranked = rankProducts(modeledCatalog());
  assert.equal(ranked.length, 4);
  assert.ok(ranked.every((product) => product.retailUsd.source === "modeled"));
  assert.ok(ranked.every((product) => product.score !== null));
  assert.ok((ranked[0]?.score ?? 0) >= (ranked[1]?.score ?? 0));
  const first = ranked[0];
  assert.ok(first);
  assert.equal(first.unitEconomics.breakEvenRoas.source, "modeled");
  assert.ok((first.unitEconomics.breakEvenRoas.value ?? 0) > 1);
  assert.match(first.unitEconomics.breakEvenRoas.label, /not a live Meta result/);
  assert.match(MODELED_DISCLAIMER, /not live TikTok, Temu, Alibaba, Shopify, or Meta data/);
});

test("missing category velocity leaves market share empty", () => {
  const [product] = modeledCatalog();
  assert.ok(product);
  product.categoryUnits7d = { ...product.categoryUnits7d, value: null };
  const [ranked] = rankProducts([product]);
  assert.equal(ranked?.marketShare.value, null);
  assert.match(ranked?.marketShare.label ?? "", /category velocity/);
});

test("manual supplier cost stays manual and is not labeled live", () => {
  const [product] = modeledCatalog();
  assert.ok(product);
  product.alibabaUnitUsd = {
    value: 1,
    source: "manual",
    fetchedAt: "2026-09-27T00:00:00.000Z",
    label: "Operator-entered Alibaba unit cost",
  };
  product.temuUnitUsd = { ...product.temuUnitUsd, value: null };
  const [ranked] = rankProducts([product]);
  assert.equal(ranked?.unitEconomics.supplier, "alibaba");
  assert.equal(ranked?.unitEconomics.landedCostUsd.source, "modeled");
});

test("negative margin has no break-even ROAS", () => {
  const [product] = modeledCatalog();
  assert.ok(product);
  product.retailUsd = { ...product.retailUsd, value: 2 };
  product.alibabaUnitUsd = { ...product.alibabaUnitUsd, value: 10 };
  product.temuUnitUsd = { ...product.temuUnitUsd, value: null };
  const [ranked] = rankProducts([product]);
  assert.equal(ranked?.unitEconomics.breakEvenRoas.value, null);
});

test("Meta activation refuses missing approval, missing cap, and over-cap budgets", () => {
  assert.throws(() => assertCanActivate({ approved: false, dailyBudgetUsd: 10, capUsd: 20 }), /approve/);
  assert.throws(() => assertCanActivate({ approved: true, dailyBudgetUsd: 10, capUsd: null }), /META_DAILY_BUDGET_CAP/);
  assert.throws(() => assertCanActivate({ approved: true, dailyBudgetUsd: 25, capUsd: 20 }), /cap/);
  assert.doesNotThrow(() => assertCanActivate({ approved: true, dailyBudgetUsd: 20, capUsd: 20 }));
});
