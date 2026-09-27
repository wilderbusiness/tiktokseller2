import { defineTool } from "eve/tools";
import { z } from "zod";

import { loadCatalog } from "../../lib/keel/pipeline";

export default defineTool({
  description:
    "Load products from the connected TikTok Shop, or the modeled starter catalog dated 21 Sep 2026. Live mode errors when TikTok Shop is not connected and does not invent products.",
  inputSchema: z.object({
    source: z.enum(["modeled", "live"]).describe("modeled is the 21 Sep 2026 starter set. live calls TikTok Shop."),
  }),
  async execute({ source }) {
    const catalog = await loadCatalog(source);
    return {
      source: catalog.kind,
      disclaimer: catalog.disclaimer,
      count: catalog.products.length,
      products: catalog.products,
    };
  },
});
