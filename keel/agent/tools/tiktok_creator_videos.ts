import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchCreatorVideos } from "../../lib/keel/tiktok";

export default defineTool({
  description: "List recent videos and view counts from the connected TikTok creator account. Does not search TikTok at large.",
  inputSchema: z.object({}),
  async execute() {
    const videos = await fetchCreatorVideos();
    return {
      source: "live" as const,
      videos,
    };
  },
});
