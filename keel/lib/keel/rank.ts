import { combineOrigin, figure, roundMoney } from "./figures";
import type { CatalogProduct, Figure, RankedProduct, UnitEconomics } from "./types";

const SHOPIFY_PERCENT = 0.029;
const SHOPIFY_FIXED = 0.3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function reviewScore(count: number): number {
  if (count <= 0) return 25;
  if (count <= 50) return 55;
  if (count <= 500) return 80;
  if (count <= 5000) return 60;
  return 35;
}

function shareScore(share: number): number {
  if (share < 0.02) return 50;
  if (share <= 0.15) return 80;
  if (share <= 0.4) return 60;
  return 40;
}

function pickSupplier(product: CatalogProduct): {
  unit: number;
  supplier: "alibaba" | "temu";
  sources: Figure<number>["source"][];
  fetchedAt: string;
} | null {
  const options = [
    product.alibabaUnitUsd.value !== null
      ? {
          unit: product.alibabaUnitUsd.value,
          supplier: "alibaba" as const,
          figure: product.alibabaUnitUsd,
        }
      : null,
    product.temuUnitUsd.value !== null
      ? {
          unit: product.temuUnitUsd.value,
          supplier: "temu" as const,
          figure: product.temuUnitUsd,
        }
      : null,
  ].filter((option) => option !== null);
  if (options.length === 0 || product.shippingUsd.value === null) return null;
  const cheapest = options.reduce((best, option) => (option.unit < best.unit ? option : best));
  return {
    unit: cheapest.unit,
    supplier: cheapest.supplier,
    sources: [cheapest.figure.source, product.shippingUsd.source],
    fetchedAt: cheapest.figure.fetchedAt,
  };
}

export function unitEconomics(product: CatalogProduct): UnitEconomics {
  const picked = pickSupplier(product);
  const retail = product.retailUsd.value;
  if (!picked || retail === null) {
    const empty = figure<number>(
      null,
      combineOrigin([
        product.retailUsd.source,
        product.shippingUsd.source,
        product.alibabaUnitUsd.source,
        product.temuUnitUsd.source,
      ]),
      product.retailUsd.fetchedAt,
      "Missing cost or retail, so this was not calculated",
    );
    return {
      landedCostUsd: empty,
      shopifyFeeUsd: empty,
      contributionMarginUsd: empty,
      marginRate: empty,
      breakEvenRoas: empty,
      supplier: null,
    };
  }
  const source = combineOrigin(picked.sources.concat(product.retailUsd.source));
  const fetchedAt = picked.fetchedAt;
  const landed = roundMoney(picked.unit + (product.shippingUsd.value ?? 0));
  const fee = roundMoney(retail * SHOPIFY_PERCENT + SHOPIFY_FIXED);
  const margin = roundMoney(retail - landed - fee);
  const marginRate = retail > 0 ? roundMoney(margin / retail) : null;
  const breakEven = margin > 0 ? roundMoney(retail / margin) : null;
  const supplierName = picked.supplier === "alibaba" ? "Alibaba" : "Temu";
  return {
    landedCostUsd: figure(landed, source, fetchedAt, `Landed cost from ${supplierName} unit plus shipping`),
    shopifyFeeUsd: figure(fee, source, fetchedAt, "Shopify card fee model: 2.9% + $0.30"),
    contributionMarginUsd: figure(margin, source, fetchedAt, "Retail minus landed cost minus Shopify fee"),
    marginRate: figure(marginRate, source, fetchedAt, "Contribution margin divided by retail"),
    breakEvenRoas: figure(
      breakEven,
      source,
      fetchedAt,
      breakEven === null
        ? "No break-even ROAS because contribution margin is not positive"
        : "Retail divided by contribution margin. This is a model, not a live Meta result.",
    ),
    supplier: picked.supplier,
  };
}

export function competitiveness(product: CatalogProduct, economics: UnitEconomics): number | null {
  const retail = product.retailUsd.value;
  const landed = economics.landedCostUsd.value;
  const reviews = product.reviewCount.value;
  if (retail === null || retail <= 0 || landed === null || reviews === null) return null;
  const priceScore = clamp(((retail - landed) / retail) * 100, 0, 100);
  const offerScore = product.offer.trim().length > 20 ? 80 : 40;
  return Math.round(0.5 * priceScore + 0.3 * reviewScore(reviews) + 0.2 * offerScore);
}

export function marketShare(product: CatalogProduct): Figure<number> {
  const units = product.unitsSold7d.value;
  const category = product.categoryUnits7d.value;
  if (units === null || category === null || category <= 0) {
    return figure<number>(
      null,
      combineOrigin([product.unitsSold7d.source, product.categoryUnits7d.source]),
      product.unitsSold7d.fetchedAt,
      "Market share needs both product units and category units. Missing category velocity stays empty.",
    );
  }
  return figure(
    roundMoney(units / category),
    combineOrigin([product.unitsSold7d.source, product.categoryUnits7d.source]),
    product.unitsSold7d.fetchedAt,
    "Product units divided by category units over 7 days",
  );
}

export function rankProducts(products: CatalogProduct[]): RankedProduct[] {
  const ranked = products.map((product) => {
    const economics = unitEconomics(product);
    const competitive = competitiveness(product, economics);
    const share = marketShare(product);
    const marginScore =
      economics.marginRate.value === null ? null : clamp(economics.marginRate.value * 100, 0, 100);
    const parts = [
      competitive,
      share.value === null ? null : shareScore(share.value),
      marginScore,
    ].filter((part): part is number => part !== null);
    const score = parts.length === 0 ? null : Math.round(parts.reduce((sum, part) => sum + part, 0) / parts.length);
    return {
      ...product,
      competitiveness: competitive,
      marketShare: share,
      unitEconomics: economics,
      score,
    };
  });
  return ranked.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
