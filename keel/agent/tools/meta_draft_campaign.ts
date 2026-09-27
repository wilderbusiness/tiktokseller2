import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { draftMetaCampaign, metaPlan } from "../../lib/keel/meta";
import { loadCatalog, rankCatalog, selectRanked } from "../../lib/keel/pipeline";

export default defineTool({
  description:
    "Size a Meta campaign from contribution margin and create it paused. Never activates spend. Break-even ROAS is a model, not a live result.",
  inputSchema: z.object({
    source: z.enum(["modeled", "live"]),
    productId: z.string().min(1),
    confirmed: z.boolean(),
  }),
  approval: always(),
  async execute({ source, productId, confirmed }) {
    const catalog = await loadCatalog(source);
    const [product] = selectRanked(rankCatalog(catalog.products), [productId]);
    if (!product) {
      throw new Error(`No ranked product with id ${productId}.`);
    }
    const plan = metaPlan(product, catalog.kind);
    if (!confirmed) return { created: false, plan };
    const draft = await draftMetaCampaign(product, catalog.kind, true);
    return { created: true, ...draft };
  },
});
