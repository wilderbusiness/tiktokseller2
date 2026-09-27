import { defineTool } from "eve/tools";
import { z } from "zod";

import { searchAlibaba, searchTemuSeller } from "../../lib/keel/suppliers";

export default defineTool({
  description:
    "Look up a supplier cost. Alibaba uses the Open Platform when connected. Temu has no public buyer search; the seller API is used only when Temu seller credentials are set. Never invent a price.",
  inputSchema: z.object({
    marketplace: z.enum(["alibaba", "temu"]),
    keyword: z.string().min(1),
  }),
  async execute({ marketplace, keyword }) {
    if (marketplace === "alibaba") {
      const result = await searchAlibaba(keyword);
      return { marketplace, source: result.unitUsd === null ? "unavailable" : "live", ...result };
    }
    const result = await searchTemuSeller(keyword);
    return { marketplace, source: "live" as const, unitUsd: null, url: null, ...result };
  },
});
