import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { activateMetaCampaign } from "../../lib/keel/meta";

export default defineTool({
  description:
    "Turn a paused Meta campaign on. Refuses unless approved is true and the daily budget is within META_DAILY_BUDGET_CAP. Does not guarantee ROAS.",
  inputSchema: z.object({
    campaignId: z.string().min(1),
    dailyBudgetUsd: z.number().positive(),
    approved: z.literal(true),
  }),
  approval: always(),
  async execute({ campaignId, dailyBudgetUsd, approved }) {
    return activateMetaCampaign(campaignId, dailyBudgetUsd, approved);
  },
});