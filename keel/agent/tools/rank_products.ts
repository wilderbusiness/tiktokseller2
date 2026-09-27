import { defineTool } from "eve/tools";
import { z } from "zod";

import { loadCatalog, rankCatalog } from "../../lib/keel/pipeline";

export default defineTool({
  description:
    "Rank a catalog by competitiveness, market share, and unit economics. Modeled inputs stay labeled modeled. Missing category velocity leaves market share empty.",
  inputSchema: z.object({
    source: z.enum(["modeled", "live"]),
  }),
  async execute({ source }) {
    const catalog = await loadCatalog(source);
    const ranked = rankCatalog(catalog.products);
    return {
      source: catalog.kind,
      disclaimer: catalog.disclaimer,
      ranked: ranked.map((product) => ({
        id: product.id,
        name: product.name,
        score: product.score,
        competitiveness: product.competitiveness,
        marketShare: product.marketShare,
        unitEconomics: product.unitEconomics,
        sources: {
          retail: product.retailUsd.source,
          units: product.unitsSold7d.source,
        },
      })),
    };
  },
});
