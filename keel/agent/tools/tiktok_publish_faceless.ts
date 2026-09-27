import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { loadCatalog, rankCatalog, selectRanked } from "../../lib/keel/pipeline";
import { facelessPost, publishFacelessPost } from "../../lib/keel/tiktok";

export default defineTool({
  description:
    "Write a faceless TikTok package with no person on camera. Sends it through the Content Posting API only when confirmed and a video URL is present. Inbox uploads are drafts.",
  inputSchema: z.object({
    source: z.enum(["modeled", "live"]),
    productIds: z.array(z.string()).min(1),
    confirmed: z.boolean(),
    videoUrl: z.string().url().nullable(),
  }),
  approval: always(),
  async execute({ source, productIds, confirmed, videoUrl }) {
    const catalog = await loadCatalog(source);
    const selected = selectRanked(rankCatalog(catalog.products), productIds);
    const posts = selected.map((product) => facelessPost(product));
    if (!confirmed) {
      return { sent: false, posts };
    }
    const results = [];
    for (const post of posts) {
      results.push(await publishFacelessPost(post, videoUrl));
    }
    return { sent: results.some((result) => result.status === "draft_uploaded"), posts, results };
  },
});
