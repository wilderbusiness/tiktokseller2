import { requireEnv } from "./env";
import { figure } from "./figures";
import type { CatalogProduct, Figure } from "./types";

export type ManualSupplier = {
  productId: string;
  alibabaUnitUsd?: number | null;
  alibabaUrl?: string | null;
  temuUnitUsd?: number | null;
  temuUrl?: string | null;
  shippingUsd?: number | null;
};

function manualFigure(value: number | null | undefined, label: string): Figure<number> | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return figure(value, "manual", new Date().toISOString(), label);
}

export function applyManualSuppliers(products: CatalogProduct[], rows: ManualSupplier[]): CatalogProduct[] {
  const byId = new Map(rows.map((row) => [row.productId, row]));
  return products.map((product) => {
    const row = byId.get(product.id);
    if (!row) return product;
    return {
      ...product,
      alibabaUnitUsd: manualFigure(row.alibabaUnitUsd, "Operator-entered Alibaba unit cost") ?? product.alibabaUnitUsd,
      alibabaUrl: row.alibabaUrl ?? product.alibabaUrl,
      temuUnitUsd: manualFigure(row.temuUnitUsd, "Operator-entered Temu unit cost") ?? product.temuUnitUsd,
      temuUrl: row.temuUrl ?? product.temuUrl,
      shippingUsd: manualFigure(row.shippingUsd, "Operator-entered shipping per unit") ?? product.shippingUsd,
    };
  });
}

export async function searchAlibaba(keyword: string, fetchImpl: typeof fetch = fetch): Promise<{ unitUsd: number | null; url: string | null; detail: string }> {
  const check = requireEnv(["ALIBABA_APP_KEY", "ALIBABA_APP_SECRET", "ALIBABA_ACCESS_TOKEN"]);
  if (!check.ok) {
    throw new Error("Alibaba is not connected. Set ALIBABA_APP_KEY, ALIBABA_APP_SECRET, and ALIBABA_ACCESS_TOKEN. No supplier price was invented.");
  }
  const url = new URL("https://gw.api.alibaba.com/openapi/param2/1/com.alibaba.product/alibaba.product.search/" + check.values.ALIBABA_APP_KEY);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("access_token", check.values.ALIBABA_ACCESS_TOKEN);
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Alibaba returned HTTP ${response.status}. No live supplier price was filled in.`);
  }
  const payload: unknown = await response.json().catch(() => null);
  const root = payload !== null && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const products = Array.isArray(root.products) ? root.products : Array.isArray(root.result) ? root.result : [];
  const first = products[0];
  const record = first !== null && typeof first === "object" ? (first as Record<string, unknown>) : null;
  const price = typeof record?.price === "number" ? record.price : null;
  const link = typeof record?.url === "string" ? record.url : null;
  return {
    unitUsd: price,
    url: link,
    detail: price === null ? "Alibaba responded without a usable unit price." : "Alibaba returned a unit price.",
  };
}

export async function searchTemuSeller(keyword: string, fetchImpl: typeof fetch = fetch): Promise<{ detail: string }> {
  const check = requireEnv(["TEMU_APP_KEY", "TEMU_APP_SECRET", "TEMU_ACCESS_TOKEN"]);
  if (!check.ok) {
    throw new Error(
      "Temu has no public buyer search API. Enter a Temu link and unit cost, or set TEMU_APP_KEY, TEMU_APP_SECRET, and TEMU_ACCESS_TOKEN for the seller API.",
    );
  }
  const response = await fetchImpl("https://openapi-b-us.temu.com/openapi/router", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "bg.local.goods.list.query",
      app_key: check.values.TEMU_APP_KEY,
      access_token: check.values.TEMU_ACCESS_TOKEN,
      keyword,
    }),
  });
  if (!response.ok) {
    throw new Error(`Temu seller API returned HTTP ${response.status}. No Temu price was filled in.`);
  }
  return { detail: "Temu seller API responded. Review the payload before treating any price as a sourcing cost." };
}
