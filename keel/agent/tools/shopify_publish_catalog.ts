import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { loadCatalog, rankCatalog, selectRanked } from "../../lib/keel/pipeline";
import { publishShopifyCatalog, shopifyPayload } from "../../lib/keel/shopify";

export default defineTool({
  description:
    "Build and, only when confirmed, publish products, a collection, and a storefront page on the connected Shopify shop. Does not create a Shopify account.",
  inputSchema: z.object({
    source: z.enum(["modeled", "live"]),
    productIds: z.array(z.string()).min(1),
    confirmed: z.boolean().describe("Must be true after the operator has seen the payload."),
  }),
  approval: always(),
  async execute({ source, productIds, confirmed }) {
    const catalog = await loadCatalog(source);
    const selected = selectRanked(rankCatalog(catalog.products), productIds);
    const payload = shopifyPayload(selected, catalog.kind);
    if (!confirmed) {
      return { published: false, payload };
    }
    const result = await publishShopifyCatalog(selected, catalog.kind, true);
    return { published: true, payload, result };
  },
});
