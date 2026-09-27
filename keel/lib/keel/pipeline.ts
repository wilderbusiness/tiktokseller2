import { modeledCatalog } from "./catalog";
import { applyManualSuppliers, type ManualSupplier } from "./suppliers";
import { rankProducts } from "./rank";
import { fetchTikTokShopProducts } from "./tiktok";
import { MODELED_DISCLAIMER, type CatalogKind, type CatalogProduct, type RankedProduct } from "./types";

export async function loadCatalog(
  kind: CatalogKind,
  manual: ManualSupplier[] = [],
  fetchImpl: typeof fetch = fetch,
): Promise<{ kind: CatalogKind; disclaimer: string | null; products: CatalogProduct[] }> {
  if (kind === "modeled") {
    return {
      kind,
      disclaimer: MODELED_DISCLAIMER,
      products: applyManualSuppliers(modeledCatalog(), manual),
    };
  }
  const products = applyManualSuppliers(await fetchTikTokShopProducts(fetchImpl), manual);
  return { kind, disclaimer: null, products };
}

export function rankCatalog(products: CatalogProduct[]): RankedProduct[] {
  return rankProducts(products);
}

export function selectRanked(products: RankedProduct[], ids: string[]): RankedProduct[] {
  const wanted = new Set(ids);
  return products.filter((product) => wanted.has(product.id));
}
