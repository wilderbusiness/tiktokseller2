export const MODELED_AS_OF = "2026-09-21";
export const MODELED_FETCHED_AT = "2026-09-21T00:00:00.000Z";

export const MODELED_DISCLAIMER =
  "Modeled starter catalog dated 21 Sep 2026. These figures are not live TikTok, Temu, Alibaba, Shopify, or Meta data.";

export type DataOrigin = "live" | "modeled" | "manual";

export type Figure<T> = {
  value: T | null;
  source: DataOrigin;
  fetchedAt: string;
  label: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  offer: string;
  retailUsd: Figure<number>;
  unitsSold7d: Figure<number>;
  categoryUnits7d: Figure<number>;
  reviewCount: Figure<number>;
  rating: Figure<number>;
  creatorViews: Figure<number>;
  alibabaUnitUsd: Figure<number>;
  alibabaUrl: string | null;
  temuUnitUsd: Figure<number>;
  temuUrl: string | null;
  shippingUsd: Figure<number>;
};

export type UnitEconomics = {
  landedCostUsd: Figure<number>;
  shopifyFeeUsd: Figure<number>;
  contributionMarginUsd: Figure<number>;
  marginRate: Figure<number>;
  breakEvenRoas: Figure<number>;
  supplier: "alibaba" | "temu" | null;
};

export type RankedProduct = CatalogProduct & {
  competitiveness: number | null;
  marketShare: Figure<number>;
  unitEconomics: UnitEconomics;
  score: number | null;
};

export type CatalogKind = "modeled" | "live";

export type ConnectionName =
  | "tiktokShop"
  | "tiktokCreator"
  | "shopify"
  | "meta"
  | "alibaba"
  | "temu";

export type ConnectionState = {
  name: ConnectionName;
  label: string;
  connected: boolean;
  missing: string[];
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
