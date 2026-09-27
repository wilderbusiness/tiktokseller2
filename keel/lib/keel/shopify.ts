import { shopifyShopDomain, requireEnv } from "./env";
import { MODELED_DISCLAIMER, type CatalogKind, type RankedProduct } from "./types";

export type ShopifyPayload = {
  catalogKind: CatalogKind;
  disclaimer: string | null;
  collection: { title: string };
  products: Array<{
    title: string;
    body_html: string;
    status: "active";
    variants: Array<{ price: string; sku: string }>;
  }>;
  page: { title: string; body_html: string };
};

function money(value: number | null): string {
  return value === null ? "" : value.toFixed(2);
}

export function shopifyPayload(products: RankedProduct[], catalogKind: CatalogKind): ShopifyPayload {
  const disclaimer = catalogKind === "modeled" ? MODELED_DISCLAIMER : null;
  const cards = products
    .map((product) => {
      const price = money(product.retailUsd.value);
      return `<article><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.offer)}</p><p>$${price}</p></article>`;
    })
    .join("");
  return {
    catalogKind,
    disclaimer,
    collection: { title: "Keel launch" },
    products: products.map((product) => ({
      title: product.name,
      body_html: `${escapeHtml(product.offer)}${disclaimer ? `<p>${escapeHtml(disclaimer)}</p>` : ""}`,
      status: "active",
      variants: [{ price: money(product.retailUsd.value), sku: `KEEL-${product.id}` }],
    })),
    page: {
      title: "Keel storefront",
      body_html: `${disclaimer ? `<p>${escapeHtml(disclaimer)}</p>` : ""}${cards}`,
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function shopifyFetch(path: string, body: unknown, fetchImpl: typeof fetch): Promise<unknown> {
  const creds = requireEnv(["SHOPIFY_ADMIN_TOKEN"]);
  const domain = shopifyShopDomain();
  if (!creds.ok || !domain) {
    throw new Error("Shopify is not connected. Set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ADMIN_TOKEN.");
  }
  const response = await fetchImpl(`https://${domain}/admin/api/2025-01/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Access-Token": creds.values.SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Shopify returned HTTP ${response.status}. The catalog was not marked as published.`);
  }
  return payload;
}

export async function publishShopifyCatalog(
  products: RankedProduct[],
  catalogKind: CatalogKind,
  confirmed: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<{ collectionId: string | null; productIds: string[]; pageId: string | null }> {
  if (confirmed !== true) {
    throw new Error("Confirm the Shopify payload before publishing.");
  }
  if (products.length === 0) {
    throw new Error("Choose at least one ranked product before publishing.");
  }
  const payload = shopifyPayload(products, catalogKind);
  const collection = (await shopifyFetch("custom_collections.json", { custom_collection: payload.collection }, fetchImpl)) as {
    custom_collection?: { id?: number };
  };
  const productIds: string[] = [];
  for (const product of payload.products) {
    const created = (await shopifyFetch("products.json", { product }, fetchImpl)) as { product?: { id?: number } };
    if (created.product?.id !== undefined) productIds.push(String(created.product.id));
  }
  const page = (await shopifyFetch("pages.json", { page: payload.page }, fetchImpl)) as { page?: { id?: number } };
  return {
    collectionId: collection.custom_collection?.id !== undefined ? String(collection.custom_collection.id) : null,
    productIds,
    pageId: page.page?.id !== undefined ? String(page.page.id) : null,
  };
}
